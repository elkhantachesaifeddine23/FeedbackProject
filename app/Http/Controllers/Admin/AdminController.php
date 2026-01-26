<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Feedback;
use App\Models\FeedbackReply;
use App\Models\FeedbackRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function dashboard(Request $request)
    {
        // Statistiques générales
        $totalCompanies = Company::count();
        $totalCustomers = Customer::count();
        $totalFeedbackRequests = FeedbackRequest::count();
        $totalFeedbacks = Feedback::count();
        $totalReplies = FeedbackReply::count();

        // Taux de réponse (feedbacks / demandes)
        $responseRate = $totalFeedbackRequests > 0 
            ? round(($totalFeedbacks / $totalFeedbackRequests) * 100, 2) 
            : 0;

        // Note moyenne
        $averageRating = Feedback::whereNotNull('rating')->avg('rating');
        $averageRating = $averageRating ? round($averageRating, 2) : 0;

        // Répartition des notes
        $ratingDistribution = Feedback::select('rating', DB::raw('count(*) as count'))
            ->whereNotNull('rating')
            ->groupBy('rating')
            ->orderBy('rating', 'desc')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->rating => $item->count];
            });

        // Réponses IA vs Admin
        $aiReplies = FeedbackReply::where('responder_type', 'ai')->count();
        $adminReplies = FeedbackReply::where('responder_type', 'admin')->count();
        $totalRepliesCount = $aiReplies + $adminReplies;
        
        $aiPercentage = $totalRepliesCount > 0 
            ? round(($aiReplies / $totalRepliesCount) * 100, 2) 
            : 0;
        $adminPercentage = $totalRepliesCount > 0 
            ? round(($adminReplies / $totalRepliesCount) * 100, 2) 
            : 0;

        // Évolution des feedbacks sur les 30 derniers jours
        $feedbackEvolutionRaw = Feedback::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(*) as count')
            )
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->date => $item->count];
            });

        // Remplir les jours manquants avec 0 pour avoir un graphique complet
        $feedbackEvolution = collect();
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $feedbackEvolution->push([
                'date' => $date,
                'count' => $feedbackEvolutionRaw->get($date, 0),
            ]);
        }

        // Top 10 entreprises par nombre de feedbacks
        $topCompanies = Company::withCount([
                'feedbackRequests as feedbacks_count' => function ($query) {
                    $query->whereHas('feedback');
                }
            ])
            ->orderBy('feedbacks_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($company) {
                return [
                    'id' => $company->id,
                    'name' => $company->name,
                    'sector' => $company->sector,
                    'feedbacks_count' => $company->feedbacks_count,
                    'customers_count' => $company->customers()->count(),
                ];
            });

        // Statistiques par secteur
        $sectorStats = Company::select('sector', DB::raw('count(*) as companies_count'))
            ->whereNotNull('sector')
            ->groupBy('sector')
            ->orderBy('companies_count', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'sector' => $item->sector ?: 'Non spécifié',
                    'companies_count' => $item->companies_count,
                ];
            });

        // Feedbacks récents (derniers 10)
        $recentFeedbacks = Feedback::with(['feedbackRequest.company', 'feedbackRequest.customer'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($feedback) {
                return [
                    'id' => $feedback->id,
                    'rating' => $feedback->rating,
                    'comment' => $feedback->comment,
                    'company_name' => $feedback->feedbackRequest->company->name ?? 'N/A',
                    'customer_name' => $feedback->feedbackRequest->customer->name ?? 'N/A',
                    'created_at' => $feedback->created_at->format('d/m/Y H:i'),
                ];
            });

        // Statistiques de canaux (SMS, Email, etc.)
        $channelStats = FeedbackRequest::select('channel', DB::raw('count(*) as count'))
            ->whereNotNull('channel')
            ->groupBy('channel')
            ->get()
            ->map(function ($item) {
                return [
                    'channel' => $item->channel ?: 'Non spécifié',
                    'count' => $item->count,
                ];
            });

        // Taux de réponse par entreprise (top 5)
        $companiesResponseRate = Company::withCount([
                'feedbackRequests as total_requests',
                'feedbackRequests as feedbacks_count' => function ($query) {
                    $query->whereHas('feedback');
                }
            ])
            ->get()
            ->filter(function ($company) {
                return $company->total_requests > 0;
            })
            ->map(function ($company) {
                $rate = $company->total_requests > 0 
                    ? round(($company->feedbacks_count / $company->total_requests) * 100, 2)
                    : 0;
                
                return [
                    'name' => $company->name,
                    'response_rate' => $rate,
                    'feedbacks' => $company->feedbacks_count,
                    'requests' => $company->total_requests,
                ];
            })
            ->sortByDesc('response_rate')
            ->take(5)
            ->values();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalCompanies' => $totalCompanies,
                'totalCustomers' => $totalCustomers,
                'totalFeedbackRequests' => $totalFeedbackRequests,
                'totalFeedbacks' => $totalFeedbacks,
                'totalReplies' => $totalReplies,
                'responseRate' => $responseRate,
                'averageRating' => $averageRating,
            ],
            'ratingDistribution' => $ratingDistribution,
            'replyStats' => [
                'ai' => [
                    'count' => $aiReplies,
                    'percentage' => $aiPercentage,
                ],
                'admin' => [
                    'count' => $adminReplies,
                    'percentage' => $adminPercentage,
                ],
            ],
            'feedbackEvolution' => $feedbackEvolution,
            'topCompanies' => $topCompanies,
            'sectorStats' => $sectorStats,
            'recentFeedbacks' => $recentFeedbacks,
            'channelStats' => $channelStats,
            'companiesResponseRate' => $companiesResponseRate,
        ]);
    }

    public function companies()
    {
        return Inertia::render('Admin/Companies');
    }

    public function users()
    {
        return Inertia::render('Admin/Users');
    }

    public function feedbacks()
    {
        return Inertia::render('Admin/Feedbacks');
    }

    public function requests()
    {
        return Inertia::render('Admin/Requests');
    }

    public function replies()
    {
        return Inertia::render('Admin/Replies');
    }

    public function analytics()
    {
        return Inertia::render('Admin/Analytics');
    }

    public function subscriptions()
    {
        return Inertia::render('Admin/Subscriptions');
    }

    public function channels()
    {
        return Inertia::render('Admin/Channels');
    }

    public function settings()
    {
        return Inertia::render('Admin/Settings');
    }
}
