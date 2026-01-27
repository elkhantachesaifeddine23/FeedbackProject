<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Feedback;
use App\Models\FeedbackRequest;
use App\Services\RadarAnalysisService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $company = Auth::user()->company;

        // Clients avec stats sur les feedbacks
        $customers = Customer::where('company_id', $company->id)
        ->withCount([
        'feedbackRequests as total_feedbacks',
        'feedbackRequests as completed_feedbacks' => function ($q) {
            $q->where('status', 'completed');
        }
    ])
    ->latest()
    ->get()
    ->map(fn($c) => [
        'id' => $c->id,
        'name' => $c->name,
        'email' => $c->email,
        'phone' => $c->phone,
        'total_feedbacks' => $c->total_feedbacks,
        'completed_feedbacks' => $c->completed_feedbacks,
    ]);

 $feedbacks = FeedbackRequest::where('company_id', $company->id)
    ->whereHas('customer')
    ->with(['customer', 'feedback']) // 🔴 IMPORTANT
    ->latest()
    ->get()
    ->map(fn ($f) => [
    'id' => $f->id,
    'feedback_id' => $f->feedback?->id,
    'token' => $f->token, // ✅ AJOUT OBLIGATOIRE
    'customer' => [
        'id' => $f->customer->id,
        'name' => $f->customer->name,
    ],
    'status' => $f->status,
    'rating' => $f->feedback?->rating,
    'created_at' => $f->created_at->format('Y-m-d H:i'),
]);




$stats = [
    'customers' => $customers->count(),
    'feedbacks_total' => $feedbacks->count(),
    'feedbacks_sent' => $feedbacks->whereIn('status', ['sent', 'pending'])->count(),
    'feedbacks_completed' => $feedbacks->where('status', 'completed')->count(),
    'response_rate' => $feedbacks->count() > 0
        ? round(($feedbacks->where('status', 'completed')->count() / $feedbacks->count()) * 100, 1)
        : 0,
];

$stats['ratings'] = collect([1, 2, 3, 4, 5])->mapWithKeys(function ($star) use ($feedbacks) {
    return [
        $star => $feedbacks->where('rating', $star)->count()
    ];
});





        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'customers' => $customers,
            'recentFeedbacks' => $feedbacks,
        ]);
    }

    public function radar(RadarAnalysisService $radarService)
    {
        $company = Auth::user()->company;

        $allFeedbacks = Feedback::query()
            ->whereHas('feedbackRequest', function ($q) use ($company) {
                $q->where('company_id', $company->id);
            })
            ->get();

        $analysisFeedbacks = Feedback::query()
            ->whereHas('feedbackRequest', function ($q) use ($company) {
                $q->where('company_id', $company->id);
            })
            ->whereNotNull('comment')
            ->with(['feedbackRequest.customer'])
            ->latest()
            ->take(200)
            ->get();

        $total = $allFeedbacks->count();
        $positive = $allFeedbacks->filter(fn ($f) => $f->rating !== null && $f->rating >= 4)->count();
        $negative = $allFeedbacks->filter(fn ($f) => $f->rating !== null && $f->rating <= 2)->count();
        $neutral = $total - $positive - $negative;

        $sentiment = [
            'positive' => $positive,
            'neutral' => $neutral,
            'negative' => $negative,
        ];

        $payload = $analysisFeedbacks->map(function ($f) {
            return [
                'id' => $f->id, // 🔴 IMPORTANT pour générer le hash
                'rating' => $f->rating,
                'comment' => $f->comment,
                'customer' => $f->feedbackRequest?->customer?->name,
                'created_at' => optional($f->created_at)->format('Y-m-d'),
            ];
        })->values()->all();

        // ✅ Utiliser le cache intelligent
        $analysis = $radarService->analyzeWithCache(
            companyId: $company->id,
            feedbacks: $payload,
            sentimentStats: $sentiment,
            feedbacksWithComments: $analysisFeedbacks->count()
        );

        // Déterminer le timestamp à afficher
        $lastUpdated = $analysis['cached_at'] ?? now()->format('Y-m-d H:i');
        
        // Ajouter un indicateur de cache
        if ($analysis['cached']) {
            $analysis['cacheInfo'] = "Analyse mise en cache depuis " . $analysis['cached_at'];
        }

        return Inertia::render('Dashboard/RadarIA', [
            'stats' => [
                'total' => $total,
                'positive' => $positive,
                'negative' => $negative,
                'neutral' => $neutral,
                'positiveRate' => $total > 0 ? round(($positive / $total) * 100, 1) : 0,
                'negativeRate' => $total > 0 ? round(($negative / $total) * 100, 1) : 0,
            ],
            'analysis' => $analysis,
            'lastUpdated' => $lastUpdated,
        ]);
    }
}
