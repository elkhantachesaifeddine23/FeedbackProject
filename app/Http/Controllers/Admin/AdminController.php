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

        // Statistiques du mois précédent pour les tendances
        $lastMonthCompanies = Company::where('created_at', '<', now()->startOfMonth())->count();
        $lastMonthFeedbacks = Feedback::where('created_at', '<', now()->startOfMonth())->count();
        
        $companiesGrowth = $lastMonthCompanies > 0 
            ? round((($totalCompanies - $lastMonthCompanies) / $lastMonthCompanies) * 100, 1)
            : 100;
        
        $feedbacksGrowth = $lastMonthFeedbacks > 0
            ? round((($totalFeedbacks - $lastMonthFeedbacks) / $lastMonthFeedbacks) * 100, 1)
            : 100;

        // Taux de réponse (feedbacks / demandes)
        $responseRate = $totalFeedbackRequests > 0 
            ? round(($totalFeedbacks / $totalFeedbackRequests) * 100, 2) 
            : 0;

        // Note moyenne
        $averageRating = Feedback::whereNotNull('rating')->avg('rating');
        $averageRating = $averageRating ? round($averageRating, 2) : 0;

        // NPS Score (Net Promoter Score)
        $promoters = Feedback::where('rating', 5)->count();
        $detractors = Feedback::whereIn('rating', [1, 2])->count();
        $npsScore = $totalFeedbacks > 0 
            ? round((($promoters - $detractors) / $totalFeedbacks) * 100, 1)
            : 0;

        // Satisfaction rate (4-5 stars)
        $satisfiedCustomers = Feedback::whereIn('rating', [4, 5])->count();
        $satisfactionRate = $totalFeedbacks > 0 
            ? round(($satisfiedCustomers / $totalFeedbacks) * 100, 1)
            : 0;

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
                'companiesGrowth' => $companiesGrowth,
                'feedbacksGrowth' => $feedbacksGrowth,
                'npsScore' => $npsScore,
                'satisfactionRate' => $satisfactionRate,
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
        // Statistiques générales
        $totalCompanies = Company::count();
        $activeCompanies = Company::whereHas('subscription', function($q) {
            $q->where('status', 'active');
        })->count();
        
        // Entreprises créées ce mois
        $companiesThisMonth = Company::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        
        // Croissance mensuelle
        $lastMonthCompanies = Company::whereMonth('created_at', now()->subMonth()->month)
            ->whereYear('created_at', now()->subMonth()->year)
            ->count();
        
        $monthlyGrowth = $lastMonthCompanies > 0 
            ? round((($companiesThisMonth - $lastMonthCompanies) / $lastMonthCompanies) * 100, 1)
            : 100;
        
        // Répartition par secteur
        $sectorDistribution = Company::select('sector', DB::raw('count(*) as count'))
            ->whereNotNull('sector')
            ->groupBy('sector')
            ->orderBy('count', 'desc')
            ->get();
        
        // Évolution sur 12 mois
        $monthlyEvolution = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $count = Company::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
            $monthlyEvolution[] = [
                'month' => $date->format('M Y'),
                'count' => $count,
            ];
        }
        
        // Statistiques d'activité
        $totalCustomers = Customer::count();
        $totalFeedbackRequests = FeedbackRequest::count();
        $totalFeedbacks = Feedback::count();
        
        $avgCustomersPerCompany = $totalCompanies > 0 
            ? round($totalCustomers / $totalCompanies, 1)
            : 0;
        
        $avgFeedbacksPerCompany = $totalCompanies > 0 
            ? round($totalFeedbacks / $totalCompanies, 1)
            : 0;
        
        // Taux d'engagement (entreprises avec au moins 1 feedback)
        $activeEngagement = Company::has('feedbackRequests')->count();
        $engagementRate = $totalCompanies > 0 
            ? round(($activeEngagement / $totalCompanies) * 100, 1)
            : 0;
        
        // Top 5 entreprises les plus actives
        $topCompanies = Company::withCount(['feedbackRequests', 'customers'])
            ->orderBy('feedback_requests_count', 'desc')
            ->take(5)
            ->get()
            ->map(function ($company) {
                return [
                    'id' => $company->id,
                    'name' => $company->name,
                    'sector' => $company->sector,
                    'customers' => $company->customers_count,
                    'feedbacks' => $company->feedback_requests_count,
                ];
            });
        
        // Liste complète des entreprises avec détails
        $companies = Company::with(['user', 'subscription'])
            ->withCount(['customers', 'feedbackRequests'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($company) {
                return [
                    'id' => $company->id,
                    'name' => $company->name,
                    'sector' => $company->sector,
                    'user_name' => $company->user->name ?? 'N/A',
                    'user_email' => $company->user->email ?? 'N/A',
                    'customers_count' => $company->customers_count,
                    'feedback_requests_count' => $company->feedback_requests_count,
                    'is_active' => $company->subscription?->status === 'active',
                    'created_at' => $company->created_at->format('d/m/Y'),
                    'logo_url' => $company->logo_url,
                ];
            });
        
        return Inertia::render('Admin/Companies', [
            'stats' => [
                'totalCompanies' => $totalCompanies,
                'activeCompanies' => $activeCompanies,
                'companiesThisMonth' => $companiesThisMonth,
                'monthlyGrowth' => $monthlyGrowth,
                'avgCustomersPerCompany' => $avgCustomersPerCompany,
                'avgFeedbacksPerCompany' => $avgFeedbacksPerCompany,
                'engagementRate' => $engagementRate,
                'totalCustomers' => $totalCustomers,
                'totalFeedbackRequests' => $totalFeedbackRequests,
            ],
            'sectorDistribution' => $sectorDistribution,
            'monthlyEvolution' => $monthlyEvolution,
            'topCompanies' => $topCompanies,
            'companies' => $companies,
        ]);
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
        // Feedbacks par canal (tous feedbacks, toutes entreprises)
        $channels = ['sms', 'qr', 'email'];
        $feedbacksByChannel = collect($channels)->mapWithKeys(function ($channel) {
            $count = \App\Models\FeedbackRequest::where('channel', $channel)
                ->whereHas('feedback')
                ->count();
            return [$channel => $count];
        });
        // Statistiques globales
        $totalCompanies = \App\Models\Company::count();
        $newCompanies = \App\Models\Company::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        $totalFeedbacks = \App\Models\Feedback::count();
        $activeCompanies = \App\Models\Company::whereHas('feedbackRequests.feedback')->count();
        $avgFeedbacksPerCompany = $totalCompanies > 0 ? round($totalFeedbacks / $totalCompanies, 1) : 0;

        // Évolution du nombre d'entreprises (12 derniers mois)
        $companiesTrend = collect(range(0, 11))->map(function ($i) {
            $date = now()->subMonths(11 - $i);
            return [
                'date' => $date->format('Y-m'),
                'count' => \App\Models\Company::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
            ];
        });

        // Évolution du nombre de feedbacks (12 derniers mois)
        $feedbacksTrend = collect(range(0, 11))->map(function ($i) {
            $date = now()->subMonths(11 - $i);
            return [
                'date' => $date->format('Y-m'),
                'count' => \App\Models\Feedback::whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count(),
            ];
        });

        // Top entreprises par feedbacks
        $topCompanies = \App\Models\Company::withCount(['feedbackRequests as feedbacks' => function ($q) {
            $q->whereHas('feedback');
        }])
            ->orderByDesc('feedbacks')
            ->limit(10)
            ->get()
            ->map(function ($company) {
                return [
                    'name' => $company->name,
                    'feedbacks' => $company->feedbacks,
                    'rating' => \App\Models\Feedback::whereHas('feedbackRequest', function ($q) use ($company) {
                        $q->where('company_id', $company->id);
                    })->avg('rating') ?? 0,
                ];
            });

        return Inertia::render('Admin/Analytics', [
            'stats' => [
                'totalCompanies' => $totalCompanies,
                'newCompanies' => $newCompanies,
                'totalFeedbacks' => $totalFeedbacks,
                'avgFeedbacksPerCompany' => $avgFeedbacksPerCompany,
                'activeCompanies' => $activeCompanies,
            ],
            'companiesTrend' => $companiesTrend,
            'feedbacksTrend' => $feedbacksTrend,
            'topCompanies' => $topCompanies,
            'feedbacksByChannel' => $feedbacksByChannel,
        ]);
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
