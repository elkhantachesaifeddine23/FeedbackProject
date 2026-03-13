<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Feedback;
use App\Models\FeedbackRequest;
use App\Models\FeedbackReply;
use App\Models\Task;
use App\Models\ReviewPlatform;
use App\Services\RadarAnalysisService;
use App\Services\ActionableInsightsService;
use App\Services\CreditConsumptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function analytics()
    {
        $company = Auth::user()->company;
        // Récupérer tous les feedbacks de l'entreprise
        $feedbacks = Feedback::whereHas('feedbackRequest', function ($q) use ($company) {
            $q->where('company_id', $company->id);
        })->get();

        // Répartition des notes
        $ratings = collect([1,2,3,4,5])->mapWithKeys(function ($star) use ($feedbacks) {
            return [$star => $feedbacks->where('rating', $star)->count()];
        });
        $ratingsTotal = $feedbacks->count();

        // Sources des feedbacks
        $sources = FeedbackRequest::where('company_id', $company->id)
            ->select('channel', DB::raw('count(*) as count'))
            ->groupBy('channel')
            ->pluck('count', 'channel');

        // Évolution des notes (30 derniers jours)
        $trendRaw = Feedback::whereHas('feedbackRequest', function ($q) use ($company) {
            $q->where('company_id', $company->id);
        })
        ->whereBetween('created_at', [now()->subDays(29)->startOfDay(), now()->endOfDay()])
        ->selectRaw('DATE(created_at) as date, avg(rating) as avg_rating, count(*) as count')
        ->groupBy('date')
        ->orderBy('date', 'asc')
        ->get();

        $trend = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $row = $trendRaw->firstWhere('date', $date);
            $trend[] = [
                'date' => $date,
                'avg_rating' => $row ? round($row->avg_rating, 2) : null,
                'count' => $row ? $row->count : 0,
            ];
        }

        // Note moyenne
        $avgRating = $feedbacks->whereNotNull('rating')->avg('rating');
        $avgRating = $avgRating !== null ? round((float) $avgRating, 2) : 0;

        // Total feedbacks
        $totalFeedbacks = $feedbacks->count() ?? 0;

        // Taux de complétion
        $completedFeedbacks = FeedbackRequest::where('company_id', $company->id)
            ->where('status', 'completed')->count();
        $sentFeedbacks = FeedbackRequest::where('company_id', $company->id)
            ->count();
        $completionRate = $sentFeedbacks > 0 ? round(($completedFeedbacks / $sentFeedbacks) * 100, 2) : 0;

        // Temps de traitement moyen (en heures)
        $processingTimes = FeedbackRequest::where('company_id', $company->id)
            ->where('status', 'completed')
            ->whereNotNull('updated_at')
            ->whereNotNull('created_at')
            ->get()
            ->map(function ($f) {
                return $f->updated_at && $f->created_at ? $f->updated_at->diffInMinutes($f->created_at) : null;
            })
            ->filter();
        $avgProcessingTime = $processingTimes->count() > 0 ? round($processingTimes->avg() / 60, 2) : 0; // en heures

        // Période précédente (30 jours avant)
        $prevStart = now()->subDays(59)->startOfDay();
        $prevEnd = now()->subDays(30)->endOfDay();
        $prevFeedbacks = Feedback::whereHas('feedbackRequest', function ($q) use ($company, $prevStart, $prevEnd) {
            $q->where('company_id', $company->id)
                ->whereBetween('created_at', [$prevStart, $prevEnd]);
        })->get();
        $prevAvgRating = $prevFeedbacks->whereNotNull('rating')->avg('rating');
        $prevAvgRating = $prevAvgRating !== null ? round((float) $prevAvgRating, 2) : 0;
        $prevTotalFeedbacks = $prevFeedbacks->count() ?? 0;
        $prevCompletedFeedbacks = FeedbackRequest::where('company_id', $company->id)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$prevStart, $prevEnd])
            ->count();
        $prevSentFeedbacks = FeedbackRequest::where('company_id', $company->id)
            ->whereBetween('created_at', [$prevStart, $prevEnd])
            ->count();
        $prevCompletionRate = $prevSentFeedbacks > 0 ? round(($prevCompletedFeedbacks / $prevSentFeedbacks) * 100, 2) : 0;
        $prevProcessingTimes = FeedbackRequest::where('company_id', $company->id)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$prevStart, $prevEnd])
            ->whereNotNull('updated_at')
            ->whereNotNull('created_at')
            ->get()
            ->map(function ($f) {
                return $f->updated_at && $f->created_at ? $f->updated_at->diffInMinutes($f->created_at) : null;
            })
            ->filter();
        $prevAvgProcessingTime = $prevProcessingTimes->count() > 0 ? round($prevProcessingTimes->avg() / 60, 2) : 0;

        // Évolution
        $evolRating = round($avgRating - $prevAvgRating, 2);
        $evolFeedbacks = $prevTotalFeedbacks > 0 ? round((($totalFeedbacks - $prevTotalFeedbacks) / $prevTotalFeedbacks) * 100, 2) : 0;
        $evolCompletion = round($completionRate - $prevCompletionRate, 2);
        $evolProcessing = round($avgProcessingTime - $prevAvgProcessingTime, 2);

        // Quality Index (exemple simple)
        $qualityIndex = round(($avgRating * 20 + $completionRate) / 2, 0);
        $evolQualityIndex = round($qualityIndex - (($prevAvgRating * 20 + $prevCompletionRate) / 2), 0);

        return \Inertia\Inertia::render('Analytics', [
            'ratings' => $ratings,
            'ratingsTotal' => $ratingsTotal,
            'sources' => $sources,
            'trend' => $trend,
            'qualityIndex' => $qualityIndex,
            'evolQualityIndex' => $evolQualityIndex,
            'avgRating' => $avgRating,
            'evolRating' => $evolRating,
            'totalFeedbacks' => $totalFeedbacks,
            'evolFeedbacks' => $evolFeedbacks,
            'completionRate' => $completionRate,
            'evolCompletion' => $evolCompletion,
            'avgProcessingTime' => $avgProcessingTime,
            'evolProcessing' => $evolProcessing,
        ]);
    }
    public function index()
    {
        $company = Auth::user()->company;
        $globalQRCode = $this->generateGlobalQRCode();
        
        // OPTIMIZED: Pagination au lieu de charger tous les customers
        $customers = Customer::where('company_id', $company->id)
            ->withCount([
                'feedbackRequests as total_feedbacks',
                'feedbackRequests as completed_feedbacks' => function ($q) {
                    $q->where('status', 'completed');
                }
            ])
            ->latest()
            ->paginate(50) // Limiter à 50 par page
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
                'phone' => $c->phone,
                'total_feedbacks' => $c->total_feedbacks,
                'completed_feedbacks' => $c->completed_feedbacks,
            ]);

        // OPTIMIZED: Eager loading + pagination pour éviter N+1 queries
        $feedbacks = FeedbackRequest::where('company_id', $company->id)
            ->whereHas('customer')
            ->with(['customer:id,name,email', 'feedback:id,feedback_request_id,rating,comment'])
            ->latest()
            ->paginate(50) // Limiter à 50 par page
            ->map(fn ($f) => [
                'id' => $f->id,
                'feedback_id' => $f->feedback?->id,
                'token' => $f->token,
                'customer' => [
                    'id' => $f->customer->id,
                    'name' => $f->customer->name,
                ],
                'status' => $f->status,
                'rating' => $f->feedback?->rating,
                'created_at' => $f->created_at->format('Y-m-d H:i'),
            ]);

        $now = now();
        $last7 = now()->subDays(7);

        // OPTIMIZED: Use cache for recurring stats queries
        $stats = \Illuminate\Support\Facades\Cache::remember(
            "dashboard-stats-{$company->id}",
            3600, // Cache for 1 hour
            function () use ($company, $now, $last7) {
                $requestsTotal = FeedbackRequest::where('company_id', $company->id)->count();
                $requestsLast7 = FeedbackRequest::where('company_id', $company->id)
                    ->whereBetween('created_at', [$last7, $now])
                    ->count();
                $completedTotal = FeedbackRequest::where('company_id', $company->id)
                    ->where('status', 'completed')
                    ->count();
                $completedLast7 = FeedbackRequest::where('company_id', $company->id)
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$last7, $now])
                    ->count();
                $failedTotal = FeedbackRequest::where('company_id', $company->id)
                    ->where('status', 'failed')
                    ->count();
                $pendingTotal = FeedbackRequest::where('company_id', $company->id)
                    ->whereIn('status', ['sent', 'pending'])
                    ->count();

                $responseRate = $requestsTotal > 0
                    ? round(($completedTotal / $requestsTotal) * 100, 1)
                    : 0;
                $responseRate7d = $requestsLast7 > 0
                    ? round(($completedLast7 / $requestsLast7) * 100, 1)
                    : 0;

                return [
                    'customers' => Customer::where('company_id', $company->id)->count(),
                    'feedbacks_total' => Feedback::whereHas('feedbackRequest', function ($q) use ($company) {
                        $q->where('company_id', $company->id);
                    })->count(),
                    'feedbacks_completed' => $completedTotal,
                    'feedbacks_sent' => $pendingTotal,
                    'feedbacks_failed' => $failedTotal,
                    'requests_total' => $requestsTotal,
                    'requests_last_7d' => $requestsLast7,
                    'completed_last_7d' => $completedLast7,
                    'response_rate' => $responseRate,
                    'response_rate_7d' => $responseRate7d,
                    'channel_email' => FeedbackRequest::where('company_id', $company->id)->where('channel', 'email')->count(),
                    'channel_sms' => FeedbackRequest::where('company_id', $company->id)->where('channel', 'sms')->count(),
                    'channel_whatsapp' => FeedbackRequest::where('company_id', $company->id)->where('channel', 'whatsapp')->count(),
                    'channel_qr' => FeedbackRequest::where('company_id', $company->id)->where('channel', 'qr')->count(),
                ];
            }
        );

        $stats['sms_credits'] = app(CreditConsumptionService::class)->getSmsCredits($company);

        // Compute avg rating & NPS from paginated feedbacks (on-demand)
        $allFeedbacks = Feedback::whereHas('feedbackRequest', function ($q) use ($company) {
            $q->where('company_id', $company->id);
        })->get();

        $avgRating = $allFeedbacks->whereNotNull('rating')->avg('rating');
        $avgRating = $avgRating ? round((float) $avgRating, 2) : null;

        $promoters = $allFeedbacks->where('rating', 5)->count();
        $detractors = $allFeedbacks->whereIn('rating', [1, 2])->count();
        $nps = $stats['feedbacks_completed'] > 0
            ? round((($promoters - $detractors) / $stats['feedbacks_completed']) * 100, 1)
            : 0;

        $stats['avg_rating'] = $avgRating;
        $stats['nps'] = $nps;
        $stats['positive_count'] = $allFeedbacks->whereIn('rating', [4, 5])->count();
        $stats['negative_count'] = $allFeedbacks->whereIn('rating', [1, 2])->count();
        $stats['neutral_count'] = $allFeedbacks->where('rating', 3)->count();
        $stats['ratings'] = collect([1, 2, 3, 4, 5])->mapWithKeys(function ($star) use ($allFeedbacks) {
            return [
                $star => $allFeedbacks->where('rating', $star)->count()
            ];
        });

        // Feedback trend (cached)
        $feedbackTrend = \Illuminate\Support\Facades\Cache::remember(
            "feedback-trend-{$company->id}",
            3600,
            function () use ($company) {
                $feedbackTrendRaw = Feedback::query()
                    ->whereHas('feedbackRequest', function ($q) use ($company) {
                        $q->where('company_id', $company->id);
                    })
                    ->whereBetween('created_at', [now()->subDays(13)->startOfDay(), now()->endOfDay()])
                    ->selectRaw('DATE(created_at) as date, count(*) as count')
                    ->groupBy('date')
                    ->orderBy('date', 'asc')
                    ->get()
                    ->mapWithKeys(fn ($row) => [$row->date => (int) $row->count]);

                $trend = collect();
                for ($i = 13; $i >= 0; $i--) {
                    $date = now()->subDays($i)->format('Y-m-d');
                    $trend->push([
                        'date' => $date,
                        'count' => $feedbackTrendRaw->get($date, 0),
                    ]);
                }
                return $trend;
            }
        );

        // ── Extended Pro Stats ─────────────────────────────────
        $extendedStats = \Illuminate\Support\Facades\Cache::remember(
            "dashboard-extended-{$company->id}",
            3600,
            function () use ($company) {
                // Tasks stats
                $tasks = Task::where('company_id', $company->id);
                $tasksTotal = (clone $tasks)->count();
                $tasksOpen = (clone $tasks)->whereIn('status', ['not_started', 'in_progress'])->count();
                $tasksCompleted = (clone $tasks)->where('status', 'completed')->count();
                $tasksOverdue = (clone $tasks)->whereNotNull('due_date')->where('due_date', '<', now())->whereIn('status', ['not_started', 'in_progress'])->count();
                $tasksCritical = (clone $tasks)->where('severity', 'critical')->whereIn('status', ['not_started', 'in_progress'])->count();

                // Feedback Replies stats
                $repliesTotal = FeedbackReply::whereHas('feedback.feedbackRequest', function ($q) use ($company) {
                    $q->where('company_id', $company->id);
                })->count();
                $repliesAI = FeedbackReply::whereHas('feedback.feedbackRequest', function ($q) use ($company) {
                    $q->where('company_id', $company->id);
                })->where('responder_type', 'ai')->count();
                $repliesAdmin = FeedbackReply::whereHas('feedback.feedbackRequest', function ($q) use ($company) {
                    $q->where('company_id', $company->id);
                })->where('responder_type', 'admin')->count();

                // Average time to first reply (in hours)
                $avgReplyTime = FeedbackReply::whereHas('feedback.feedbackRequest', function ($q) use ($company) {
                    $q->where('company_id', $company->id);
                })
                ->join('feedback', 'feedback_replies.feedback_id', '=', 'feedback.id')
                ->selectRaw('AVG(EXTRACT(EPOCH FROM (feedback_replies.created_at - feedback.created_at)) / 3600) as avg_hours')
                ->value('avg_hours');

                // Resolution stats
                $feedbacksResolved = Feedback::whereHas('feedbackRequest', function ($q) use ($company) {
                    $q->where('company_id', $company->id);
                })->whereNotNull('resolved_at')->count();
                $feedbacksUnresolved = Feedback::whereHas('feedbackRequest', function ($q) use ($company) {
                    $q->where('company_id', $company->id);
                })->whereNull('resolved_at')->count();
                $feedbacksPinned = Feedback::whereHas('feedbackRequest', function ($q) use ($company) {
                    $q->where('company_id', $company->id);
                })->where('is_pinned', true)->count();

                // Feedback sources
                $sourcesManual = Feedback::whereHas('feedbackRequest', function ($q) use ($company) {
                    $q->where('company_id', $company->id);
                })->where('source', 'manual')->count();
                $sourcesGoogle = Feedback::whereHas('feedbackRequest', function ($q) use ($company) {
                    $q->where('company_id', $company->id);
                })->where('source', 'google')->count();

                // Review platforms
                $platformsActive = ReviewPlatform::where('company_id', $company->id)->where('is_active', true)->count();
                $platformsTotal = ReviewPlatform::where('company_id', $company->id)->count();

                // Subscription
                $subscription = $company->subscription;

                // Google sync
                $googleConnected = $company->google_business_profile_connected ?? false;
                $googleLastSync = $company->google_last_sync_at;

                // Language distribution
                $languages = FeedbackRequest::where('company_id', $company->id)
                    ->whereNotNull('detected_language')
                    ->select('detected_language', DB::raw('count(*) as count'))
                    ->groupBy('detected_language')
                    ->orderByDesc('count')
                    ->limit(5)
                    ->pluck('count', 'detected_language');

                // Auto-reply enabled?
                $policy = $company->responsePolicy;
                $autoReplyEnabled = $policy ? $policy->auto_reply_enabled : false;

                // Rating distribution with percentages
                $totalWithRating = Feedback::whereHas('feedbackRequest', function ($q) use ($company) {
                    $q->where('company_id', $company->id);
                })->whereNotNull('rating')->count();

                $ratingDistribution = collect([5, 4, 3, 2, 1])->map(function ($star) use ($company, $totalWithRating) {
                    $count = Feedback::whereHas('feedbackRequest', function ($q) use ($company) {
                        $q->where('company_id', $company->id);
                    })->where('rating', $star)->count();
                    return [
                        'star' => $star,
                        'count' => $count,
                        'percent' => $totalWithRating > 0 ? round(($count / $totalWithRating) * 100, 1) : 0,
                    ];
                });

                return [
                    'tasks' => [
                        'total' => $tasksTotal,
                        'open' => $tasksOpen,
                        'completed' => $tasksCompleted,
                        'overdue' => $tasksOverdue,
                        'critical' => $tasksCritical,
                    ],
                    'replies' => [
                        'total' => $repliesTotal,
                        'ai' => $repliesAI,
                        'admin' => $repliesAdmin,
                        'avg_reply_hours' => $avgReplyTime ? round((float) $avgReplyTime, 1) : null,
                    ],
                    'resolution' => [
                        'resolved' => $feedbacksResolved,
                        'unresolved' => $feedbacksUnresolved,
                        'pinned' => $feedbacksPinned,
                        'rate' => ($feedbacksResolved + $feedbacksUnresolved) > 0
                            ? round(($feedbacksResolved / ($feedbacksResolved + $feedbacksUnresolved)) * 100, 1)
                            : 0,
                    ],
                    'sources' => [
                        'manual' => $sourcesManual,
                        'google' => $sourcesGoogle,
                    ],
                    'platforms' => [
                        'active' => $platformsActive,
                        'total' => $platformsTotal,
                    ],
                    'subscription' => $subscription ? [
                        'plan' => $subscription->plan,
                        'status' => $subscription->status,
                        'trial_ends_at' => $subscription->trial_ends_at?->toISOString(),
                        'ends_at' => $subscription->ends_at?->toISOString(),
                    ] : null,
                    'google' => [
                        'connected' => $googleConnected,
                        'last_sync' => $googleLastSync?->toISOString(),
                    ],
                    'languages' => $languages,
                    'auto_reply_enabled' => $autoReplyEnabled,
                    'rating_distribution' => $ratingDistribution,
                ];
            }
        );

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'extendedStats' => $extendedStats,
            'customers' => $customers,
            'recentFeedbacks' => $feedbacks,
            'feedbackTrend' => $feedbackTrend,
            'globalQRCode' => $globalQRCode,
        ]);
    }

    public function radar(RadarAnalysisService $radarService, ActionableInsightsService $insightsService)
    {
        $company = Auth::user()->company;
        $data = $this->buildRadarData($company, 30);

        // ── Enrichir avec données opérationnelles (tasks, replies, resolution) ──
        $periodStart = now()->subDays(30)->startOfDay();
        $periodEnd = now();

        $tasksQuery = Task::where('company_id', $company->id);
        $operationalData = [
            'tasks' => [
                'total' => (clone $tasksQuery)->count(),
                'open' => (clone $tasksQuery)->whereIn('status', ['not_started', 'in_progress'])->count(),
                'completed' => (clone $tasksQuery)->where('status', 'completed')->count(),
                'overdue' => (clone $tasksQuery)->whereNotNull('due_date')->where('due_date', '<', now())->whereIn('status', ['not_started', 'in_progress'])->count(),
                'critical' => (clone $tasksQuery)->where('severity', 'critical')->whereIn('status', ['not_started', 'in_progress'])->count(),
            ],
            'replies' => [
                'total' => FeedbackReply::whereHas('feedback.feedbackRequest', fn($q) => $q->where('company_id', $company->id))->count(),
                'ai' => FeedbackReply::whereHas('feedback.feedbackRequest', fn($q) => $q->where('company_id', $company->id))->where('responder_type', 'ai')->count(),
                'admin' => FeedbackReply::whereHas('feedback.feedbackRequest', fn($q) => $q->where('company_id', $company->id))->where('responder_type', 'admin')->count(),
                'unanswered' => Feedback::whereHas('feedbackRequest', fn($q) => $q->where('company_id', $company->id))
                    ->whereDoesntHave('replies')
                    ->whereBetween('created_at', [$periodStart, $periodEnd])
                    ->count(),
            ],
            'resolution' => [
                'resolved' => Feedback::whereHas('feedbackRequest', fn($q) => $q->where('company_id', $company->id))->whereNotNull('resolved_at')->count(),
                'unresolved' => Feedback::whereHas('feedbackRequest', fn($q) => $q->where('company_id', $company->id))->whereNull('resolved_at')->count(),
                'pinned' => Feedback::whereHas('feedbackRequest', fn($q) => $q->where('company_id', $company->id))->where('is_pinned', true)->count(),
            ],
            'google' => [
                'connected' => $company->google_business_profile_connected ?? false,
                'reviews_count' => Feedback::whereHas('feedbackRequest', fn($q) => $q->where('company_id', $company->id))->where('source', 'google')->count(),
            ],
        ];

        $resTotal = $operationalData['resolution']['resolved'] + $operationalData['resolution']['unresolved'];
        $operationalData['resolution']['rate'] = $resTotal > 0
            ? round(($operationalData['resolution']['resolved'] / $resTotal) * 100, 1) : 0;

        // ── Récupérer les derniers feedbacks négatifs non résolus ──
        $unresolvedNegative = Feedback::whereHas('feedbackRequest', fn($q) => $q->where('company_id', $company->id))
            ->whereNotNull('comment')
            ->where('rating', '<=', 2)
            ->whereNull('resolved_at')
            ->with('feedbackRequest.customer')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'rating' => $f->rating,
                'comment' => mb_substr($f->comment, 0, 200),
                'customer' => $f->feedbackRequest?->customer?->name ?? 'Anonyme',
                'date' => $f->created_at?->format('d/m/Y'),
                'resolved' => false,
            ])->values()->all();

        // ── IA Analysis: send only UNRESOLVED feedbacks + resolution context ──
        $analysis = $radarService->analyzeWithCache(
            companyId: $company->id,
            feedbacks: $data['analysisPayload'],
            sentimentStats: $data['sentiment'],
            feedbacksWithComments: $data['feedbacksWithComments'],
            resolutionContext: $data['resolutionContext'] ?? []
        );

        // ── Générer le résumé IA avec persistance des problèmes détectés ──
        $feedbackSummary = $this->generateFeedbackSummary($radarService, $company, $data, $operationalData);

        // ── Persister les problèmes & décisions détectés par l'IA ──
        $this->syncDetectedProblems($company, $feedbackSummary, $data['analysisPayload']);

        // ── Charger les problèmes/décisions OUVERTS depuis la base ──
        // Exclure ceux qui ont déjà une tâche associée
        $detectedProblems = \App\Models\DetectedProblem::where('company_id', $company->id)
            ->notResolved()
            ->problems()
            ->whereDoesntHave('tasks')
            ->withCount('feedbacks')
            ->orderByRaw("CASE WHEN urgency LIKE '%imm%' THEN 0 WHEN urgency LIKE '%court%' THEN 1 ELSE 2 END")
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'title' => $p->title,
                'detail' => $p->detail,
                'solution' => $p->solution,
                'effort' => $p->effort,
                'impact' => $p->impact,
                'urgency' => $p->urgency,
                'status' => $p->status,
                'type' => $p->type,
                'feedbacks_count' => $p->feedbacks_count,
                'created_at' => $p->created_at?->format('d/m/Y'),
            ])->values()->all();

        $detectedDecisions = \App\Models\DetectedProblem::where('company_id', $company->id)
            ->notResolved()
            ->decisions()
            ->whereDoesntHave('tasks')
            ->withCount('feedbacks')
            ->orderByRaw("CASE WHEN urgency LIKE '%imm%' THEN 0 WHEN urgency LIKE '%court%' THEN 1 ELSE 2 END")
            ->get()
            ->map(fn($d) => [
                'id' => $d->id,
                'title' => $d->title,
                'detail' => $d->detail,
                'impact' => $d->impact,
                'urgency' => $d->urgency,
                'status' => $d->status,
                'type' => $d->type,
                'feedbacks_count' => $d->feedbacks_count,
                'created_at' => $d->created_at?->format('d/m/Y'),
            ])->values()->all();

        // 🎯 Générer les actions à partir des problèmes détectés
        $generatedActions = $insightsService->generateActionsFromProblems($analysis, $data);
        
        $allActions = array_merge($data['recommendedActions'], $generatedActions);
        usort($allActions, function ($a, $b) {
            $prio = ['P0' => 0, 'P1' => 1, 'P2' => 2];
            $aPrio = $prio[$a['priority'] ?? 'P2'] ?? 2;
            $bPrio = $prio[$b['priority'] ?? 'P2'] ?? 2;
            return $aPrio <=> $bPrio;
        });
        $topActions = array_slice($allActions, 0, 5);

        $lastUpdated = $analysis['cached_at'] ?? now()->format('Y-m-d H:i');

        if (!empty($analysis['cached'])) {
            $analysis['cacheInfo'] = "Analyse mise en cache depuis " . $analysis['cached_at'];
        }

        return Inertia::render('Dashboard/RadarIA', [
            'period' => $data['period'],
            'stats' => $data['stats'],
            'channels' => $data['channels'],
            'trends' => $data['trends'],
            'signals' => $data['signals'],
            'recommendedActions' => $topActions,
            'allActions' => $allActions,
            'benchmarks' => $data['benchmarks'],
            'healthScore' => $data['healthScore'],
            'analysis' => $analysis,
            'lastUpdated' => $lastUpdated,
            'operationalData' => $operationalData,
            'feedbackSummary' => $feedbackSummary,
            'unresolvedNegative' => $unresolvedNegative,
            'detectedProblems' => $detectedProblems,
            'detectedDecisions' => $detectedDecisions,
        ]);
    }

    /**
     * Créer une tâche à partir d'un problème/décision détecté par l'IA.
     */
    public function createTaskFromProblem(Request $request, int $id)
    {
        $company = Auth::user()->company;
        if (!$company) abort(403);

        $problem = \App\Models\DetectedProblem::where('company_id', $company->id)
            ->where('id', $id)
            ->notResolved()
            ->firstOrFail();

        // Vérifier si une tâche n'existe pas déjà pour ce problème
        $existingTask = Task::where('detected_problem_id', $problem->id)->first();
        if ($existingTask) {
            return back()->with('info', 'Une tâche existe déjà pour ce problème.');
        }

        // Mapper l'urgence/impact vers la sévérité de la tâche
        $severity = 'moderate';
        if ($problem->urgency && str_contains(strtolower($problem->urgency), 'imm')) {
            $severity = 'critical';
        } elseif ($problem->impact && str_contains(strtolower($problem->impact), 'faible')) {
            $severity = 'low';
        }

        // Créer la tâche
        $task = Task::create([
            'company_id' => $company->id,
            'detected_problem_id' => $problem->id,
            'title' => $problem->title,
            'description' => $problem->solution ?? $problem->detail,
            'status' => Task::STATUS_NOT_STARTED,
            'severity' => $severity,
            'priority' => $severity === 'critical' ? 100 : ($severity === 'moderate' ? 50 : 10),
            'source' => 'radar_ia',
        ]);

        return back()->with('success', 'Tâche créée avec succès.');
    }

    /**
     * Résoudre un problème/décision détecté par l'IA.
     * Cascade: marque aussi les feedbacks liés comme résolus.
     */
    public function resolveDetectedProblem(Request $request, int $id)
    {
        $company = Auth::user()->company;
        if (!$company) abort(403);

        $problem = \App\Models\DetectedProblem::where('company_id', $company->id)
            ->where('id', $id)
            ->notResolved()
            ->firstOrFail();

        $problem->markResolved();

        return back()->with('success', 'Problème résolu avec succès.');
    }

    /**
     * Rouvrir un problème/décision précédemment résolu.
     */
    public function reopenDetectedProblem(Request $request, int $id)
    {
        $company = Auth::user()->company;
        if (!$company) abort(403);

        $problem = \App\Models\DetectedProblem::where('company_id', $company->id)
            ->where('id', $id)
            ->where('status', \App\Models\DetectedProblem::STATUS_RESOLVED)
            ->firstOrFail();

        $problem->reopen();

        return back()->with('success', 'Problème rouvert.');
    }

    public function exportRadar(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $company = $user->company;

        if (! $company) {
            abort(403);
        }

        $days = (int) $request->query('days', 30);
        $days = max(7, min($days, 90));
        
        $format = $request->query('format', 'csv'); // csv ou pdf

        $data = $this->buildRadarData($company, $days);
        
        if ($format === 'pdf') {
            return $this->exportRadarPDF($company, $data, $days);
        }

        return $this->exportRadarCSV($company, $data);
    }

    private function exportRadarCSV($company, $data)
    {
        $filename = 'radar-ia-' . $company->id . '-' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($data) {
            $output = fopen('php://output', 'w');
            
            // Ajouter le BOM UTF-8 pour Windows/Excel
            fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($output, ['Radar IA Export']);
            fputcsv($output, ['Période', $data['period']['from'] . ' → ' . $data['period']['to']]);
            fputcsv($output, ['Généré le', now()->format('Y-m-d H:i')]);
            fputcsv($output, []);

            fputcsv($output, ['KPI', 'Valeur']);
            fputcsv($output, ['Feedbacks', $data['stats']['total']]);
            fputcsv($output, ['Taux positif', $data['stats']['positiveRate'] . '%']);
            fputcsv($output, ['Taux négatif', $data['stats']['negativeRate'] . '%']);
            fputcsv($output, ['Note moyenne', $data['stats']['avgRating'] ?? '—']);
            fputcsv($output, ['Taux de réponse', $data['stats']['responseRate'] . '%']);
            fputcsv($output, ['Health score', $data['healthScore']['score']]);
            fputcsv($output, []);

            fputcsv($output, ['Tendances (vs période précédente)', 'Actuel', 'Précédent', 'Delta']);
            fputcsv($output, ['Taux positif', $data['trends']['positiveRate']['current'] . '%', $data['trends']['positiveRate']['previous'] . '%', $data['trends']['positiveRate']['delta'] . '%']);
            fputcsv($output, ['Taux négatif', $data['trends']['negativeRate']['current'] . '%', $data['trends']['negativeRate']['previous'] . '%', $data['trends']['negativeRate']['delta'] . '%']);
            fputcsv($output, ['Taux de réponse', $data['trends']['responseRate']['current'] . '%', $data['trends']['responseRate']['previous'] . '%', $data['trends']['responseRate']['delta'] . '%']);
            fputcsv($output, ['Note moyenne', $data['trends']['avgRating']['current'] ?? '—', $data['trends']['avgRating']['previous'] ?? '—', $data['trends']['avgRating']['delta'] ?? '—']);
            fputcsv($output, ['Échecs d’envoi', $data['trends']['failedRequests']['current'], $data['trends']['failedRequests']['previous'], $data['trends']['failedRequests']['delta']]);
            fputcsv($output, []);

            fputcsv($output, ['Canaux (30j)', 'Demandes']);
            foreach ($data['channels'] as $channel) {
                fputcsv($output, [$channel['channel'], $channel['count']]);
            }
            fputcsv($output, []);

            fputcsv($output, ['Health Score - Drivers', 'Valeur']);
            fputcsv($output, ['Score note', $data['healthScore']['drivers']['rating_score'] ?? '—']);
            fputcsv($output, ['Pénalité négatif', $data['healthScore']['drivers']['negative_penalty'] ?? '—']);
            fputcsv($output, ['Pénalité réponse', $data['healthScore']['drivers']['response_penalty'] ?? '—']);
            fputcsv($output, ['Pénalité échecs', $data['healthScore']['drivers']['failed_penalty'] ?? '—']);
            fputcsv($output, []);

            fputcsv($output, ['Benchmarks', 'Entreprise', 'Médiane', 'Percentile']);
            foreach ($data['benchmarks'] as $key => $benchmark) {
                fputcsv($output, [
                    $benchmark['label'],
                    $benchmark['company'] ?? '—',
                    $benchmark['median'] ?? '—',
                    $benchmark['percentile'] !== null ? $benchmark['percentile'] . '%' : '—',
                ]);
            }
            fputcsv($output, []);

            fputcsv($output, ['Signals', 'Catégorie', 'Sévérité', 'Détail', 'Évidence']);
            foreach ($data['signals'] as $signal) {
                $evidence = '';
                if (! empty($signal['evidence']) && is_array($signal['evidence'])) {
                    $evidence = implode(' | ', $signal['evidence']);
                }
                fputcsv($output, [
                    $signal['title'] ?? '',
                    strtoupper($signal['category'] ?? ''),
                    strtoupper($signal['severity'] ?? ''),
                    $signal['detail'] ?? '',
                    $evidence,
                ]);
            }
            fputcsv($output, []);

            fputcsv($output, ['Actions recommandées PRO', 'Priorité', 'Titre', 'Détail', 'Problème source', 'Responsable', 'À suivre', 'Timeline', 'Mentions']);
            if (!empty($allActions) && is_array($allActions)) {
                foreach ($allActions as $action) {
                    fputcsv($output, [
                        $action['priority'] ?? 'P2',
                        $action['title'] ?? '',
                        $action['detail'] ?? '',
                        $action['problem_source'] ?? '',
                        $action['owner_role'] ?? '',
                        $action['kpi_to_track'] ?? '',
                        $action['timeline'] ?? '',
                        $action['mention_count'] ?? 0,
                    ]);
                }
            } else {
                // Fallback: exporter les actions basiques si allActions n'existe pas
                foreach ($data['recommendedActions'] as $action) {
                    $context = '';
                    if (! empty($action['context'])) {
                        $contextParts = [];
                        if (! empty($action['context']['signal_title'])) {
                            $contextParts[] = 'Signal: ' . $action['context']['signal_title'];
                        }
                        if (! empty($action['context']['signal_detail'])) {
                            $contextParts[] = 'Détail: ' . $action['context']['signal_detail'];
                        }
                        if (! empty($action['context']['evidence']) && is_array($action['context']['evidence'])) {
                            $contextParts[] = 'Exemples: ' . implode(' | ', $action['context']['evidence']);
                        }
                        $context = implode(' / ', $contextParts);
                    }
                    fputcsv($output, [
                        $action['priority'] ?? 'P2',
                        $action['title'] ?? '',
                        $action['detail'] ?? '',
                        $context,
                    ]);
                }
            }
            fputcsv($output, []);

            fclose($output);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function exportRadarPDF($company, $data, $days)
    {
        $filename = 'radar-ia-' . $company->id . '-' . now()->format('Ymd_His') . '.pdf';
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.radar', [
            'company' => $company,
            'data' => $data,
            'days' => $days,
            'generatedAt' => now()->format('d/m/Y H:i'),
        ]);
        
        return $pdf->download($filename);
    }

    private function buildRadarData($company, int $days): array
    {
        $periodStart = now()->subDays($days)->startOfDay();
        $periodEnd = now();
        $prevPeriodStart = now()->subDays($days * 2)->startOfDay();
        $prevPeriodEnd = now()->subDays($days)->endOfDay();

        // ── LAYER 1: ALL feedbacks → Stats, Trends, Benchmarks, Health Score ──
        $allFeedbacks = Feedback::query()
            ->whereHas('feedbackRequest', function ($q) use ($company) {
                $q->where('company_id', $company->id);
            })
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->get();

        $previousFeedbacks = Feedback::query()
            ->whereHas('feedbackRequest', function ($q) use ($company) {
                $q->where('company_id', $company->id);
            })
            ->whereBetween('created_at', [$prevPeriodStart, $prevPeriodEnd])
            ->get();

        // ── LAYER 2: UNRESOLVED feedbacks only → IA Analysis, Signals, Actions ──
        // Exclure les feedbacks déjà liés à un problème ayant une tâche
        $analysisFeedbacks = Feedback::query()
            ->whereHas('feedbackRequest', function ($q) use ($company) {
                $q->where('company_id', $company->id);
            })
            ->notResolved()
            ->whereNotNull('comment')
            ->whereDoesntHave('detectedProblems.tasks')
            ->with(['feedbackRequest.customer'])
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->latest()
            ->take(200)
            ->get();

        // ── Resolution context for IA prompts ──
        $resolvedInPeriod = Feedback::query()
            ->whereHas('feedbackRequest', fn($q) => $q->where('company_id', $company->id))
            ->whereNotNull('resolved_at')
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->count();

        $lastResolvedAt = Feedback::query()
            ->whereHas('feedbackRequest', fn($q) => $q->where('company_id', $company->id))
            ->whereNotNull('resolved_at')
            ->max('resolved_at');

        $channelStats = FeedbackRequest::query()
            ->where('company_id', $company->id)
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->whereNotNull('channel')
            ->selectRaw('channel, count(*) as count')
            ->groupBy('channel')
            ->orderBy('count', 'desc')
            ->get()
            ->map(fn ($row) => ['channel' => $row->channel, 'count' => (int) $row->count])
            ->values();

        $total = $allFeedbacks->count();
        $positive = $allFeedbacks->filter(fn ($f) => $f->rating !== null && $f->rating >= 4)->count();
        $negative = $allFeedbacks->filter(fn ($f) => $f->rating !== null && $f->rating <= 2)->count();
        $neutral = $total - $positive - $negative;

        $prevTotal = $previousFeedbacks->count();
        $prevPositive = $previousFeedbacks->filter(fn ($f) => $f->rating !== null && $f->rating >= 4)->count();
        $prevNegative = $previousFeedbacks->filter(fn ($f) => $f->rating !== null && $f->rating <= 2)->count();
        $prevNeutral = $prevTotal - $prevPositive - $prevNegative;

        $avgRating = $total > 0
            ? round((float) $allFeedbacks->whereNotNull('rating')->avg('rating'), 2)
            : null;

        $prevAvgRating = $prevTotal > 0
            ? round((float) $previousFeedbacks->whereNotNull('rating')->avg('rating'), 2)
            : null;

        $requestsCurrent = FeedbackRequest::query()
            ->where('company_id', $company->id)
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->count();

        $requestsPrevious = FeedbackRequest::query()
            ->where('company_id', $company->id)
            ->whereBetween('created_at', [$prevPeriodStart, $prevPeriodEnd])
            ->count();

        $responseRate = $requestsCurrent > 0
            ? round(($total / $requestsCurrent) * 100, 1)
            : 0;

        $prevResponseRate = $requestsPrevious > 0
            ? round(($prevTotal / $requestsPrevious) * 100, 1)
            : 0;

        $failedCurrent = FeedbackRequest::query()
            ->where('company_id', $company->id)
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->where('status', 'failed')
            ->count();

        $failedPrevious = FeedbackRequest::query()
            ->where('company_id', $company->id)
            ->whereBetween('created_at', [$prevPeriodStart, $prevPeriodEnd])
            ->where('status', 'failed')
            ->count();

        $positiveRate = $total > 0 ? round(($positive / $total) * 100, 1) : 0;
        $negativeRate = $total > 0 ? round(($negative / $total) * 100, 1) : 0;
        $prevPositiveRate = $prevTotal > 0 ? round(($prevPositive / $prevTotal) * 100, 1) : 0;
        $prevNegativeRate = $prevTotal > 0 ? round(($prevNegative / $prevTotal) * 100, 1) : 0;

        $signals = [];
        $recommendedActions = [];

        // Collect negative and positive feedbacks
        $negativeFeedbacks = $analysisFeedbacks->filter(fn ($f) => $f->rating !== null && $f->rating <= 2);
        $positiveFeedbacks = $analysisFeedbacks->filter(fn ($f) => $f->rating !== null && $f->rating >= 4);

        $negativeEvidence = $negativeFeedbacks
            ->take(3)
            ->map(fn ($f) => str($f->comment)->limit(160)->toString())
            ->values()
            ->all();

        $negativeIds = $negativeFeedbacks
            ->pluck('id')
            ->take(3)
            ->values()
            ->all();

        $positiveEvidence = $positiveFeedbacks
            ->take(3)
            ->map(fn ($f) => str($f->comment)->limit(160)->toString())
            ->values()
            ->all();

        $positiveIds = $positiveFeedbacks
            ->pluck('id')
            ->take(3)
            ->values()
            ->all();

        $negativeDelta = round($negativeRate - $prevNegativeRate, 1);
        if ($negativeDelta >= 10) {
            $signals[] = [
                'category' => 'risk',
                'severity' => $negativeDelta >= 20 ? 'high' : 'medium',
                'title' => 'Hausse du taux négatif',
                'detail' => "Taux négatif en hausse de {$negativeDelta} points vs période précédente.",
                'evidence_count' => $negative,
                'evidence' => $negativeEvidence,
            ];
            $recommendedActions[] = [
                'priority' => 'P0',
                'title' => 'Traiter les causes principales des avis négatifs',
                'detail' => 'Identifier les 3 problèmes récurrents et définir un plan d’action correctif sur 7 jours.',
                'context' => [
                    'signal_title' => 'Hausse du taux négatif',
                    'signal_detail' => "Taux négatif en hausse de {$negativeDelta} points vs période précédente.",
                    'evidence' => $negativeEvidence,
                    'feedback_ids' => $negativeIds,
                ],
            ];
        }

        $responseDelta = round($responseRate - $prevResponseRate, 1);
        if ($responseDelta <= -15) {
            $signals[] = [
                'category' => 'ops',
                'severity' => $responseDelta <= -25 ? 'high' : 'medium',
                'title' => 'Baisse du taux de réponse',
                'detail' => "Taux de réponse en baisse de {$responseDelta} points vs période précédente.",
                'evidence_count' => $requestsCurrent,
            ];
            $recommendedActions[] = [
                'priority' => 'P1',
                'title' => 'Relancer les clients non répondus',
                'detail' => 'Créer une campagne de relance ciblée (email/SMS) pour les demandes non complétées.',
                'context' => [
                    'signal_title' => 'Baisse du taux de réponse',
                    'signal_detail' => "Taux de réponse en baisse de {$responseDelta} points vs période précédente.",
                ],
            ];
        }

        if ($failedCurrent >= 5 && $failedCurrent > $failedPrevious) {
            $signals[] = [
                'category' => 'ops',
                'severity' => $failedCurrent >= 15 ? 'high' : 'medium',
                'title' => 'Échecs d’envoi en hausse',
                'detail' => "{$failedCurrent} échecs sur la période (vs {$failedPrevious}).",
                'evidence_count' => $failedCurrent,
            ];
            $recommendedActions[] = [
                'priority' => 'P1',
                'title' => 'Vérifier deliverability et canaux',
                'detail' => 'Contrôler SPF/DKIM/DMARC et l’état des numéros SMS; tester un envoi manuel.',
                'context' => [
                    'signal_title' => 'Échecs d’envoi en hausse',
                    'signal_detail' => "{$failedCurrent} échecs sur la période (vs {$failedPrevious}).",
                ],
            ];
        }

        $positiveDelta = round($positiveRate - $prevPositiveRate, 1);
        if ($positiveDelta >= 10 && $negativeRate <= 20) {
            $signals[] = [
                'category' => 'opportunity',
                'severity' => $positiveDelta >= 20 ? 'high' : 'medium',
                'title' => 'Progression de la satisfaction',
                'detail' => "Taux positif en hausse de {$positiveDelta} points.",
                'evidence_count' => $positive,
                'evidence' => $positiveEvidence,
            ];
            $recommendedActions[] = [
                'priority' => 'P2',
                'title' => 'Capitaliser sur les points forts',
                'detail' => 'Mettre en avant les aspects les plus appréciés (site, réseaux, campagnes).',
                'context' => [
                    'signal_title' => 'Progression de la satisfaction',
                    'signal_detail' => "Taux positif en hausse de {$positiveDelta} points.",
                    'evidence' => $positiveEvidence,
                    'feedback_ids' => $positiveIds,
                ],
            ];
        }

        $channelSignals = $this->buildChannelSignals($company->id, $periodStart, $periodEnd, $prevPeriodStart, $prevPeriodEnd);
        $signals = array_merge($signals, $channelSignals['signals']);
        $recommendedActions = array_merge($recommendedActions, $channelSignals['actions']);

        $sentiment = [
            'positive' => $positive,
            'neutral' => $neutral,
            'negative' => $negative,
        ];

        $payload = $analysisFeedbacks->map(function ($f) {
            return [
                'id' => $f->id,
                'rating' => $f->rating,
                'comment' => $f->comment,
                'customer' => $f->feedbackRequest?->customer?->name,
                'created_at' => optional($f->created_at)->format('Y-m-d'),
            ];
        })->values()->all();

        $benchmarks = $this->buildBenchmarks($company->id, $periodStart, $periodEnd);
        $healthScore = $this->buildHealthScore($responseRate, $negativeRate, $avgRating, $failedCurrent);

        return [
            'period' => [
                'from' => $periodStart->format('Y-m-d'),
                'to' => $periodEnd->format('Y-m-d'),
                'days' => $days,
            ],
            'stats' => [
                'total' => $total,
                'positive' => $positive,
                'negative' => $negative,
                'neutral' => $neutral,
                'positiveRate' => $positiveRate,
                'negativeRate' => $negativeRate,
                'avgRating' => $avgRating,
                'responseRate' => $responseRate,
            ],
            'channels' => $channelStats,
            'trends' => [
                'positiveRate' => [
                    'current' => $positiveRate,
                    'previous' => $prevPositiveRate,
                    'delta' => round($positiveRate - $prevPositiveRate, 1),
                ],
                'negativeRate' => [
                    'current' => $negativeRate,
                    'previous' => $prevNegativeRate,
                    'delta' => round($negativeRate - $prevNegativeRate, 1),
                ],
                'responseRate' => [
                    'current' => $responseRate,
                    'previous' => $prevResponseRate,
                    'delta' => round($responseRate - $prevResponseRate, 1),
                ],
                'avgRating' => [
                    'current' => $avgRating,
                    'previous' => $prevAvgRating,
                    'delta' => $avgRating !== null && $prevAvgRating !== null
                        ? round($avgRating - $prevAvgRating, 2)
                        : null,
                ],
                'failedRequests' => [
                    'current' => $failedCurrent,
                    'previous' => $failedPrevious,
                    'delta' => $failedCurrent - $failedPrevious,
                ],
            ],
            'signals' => $signals,
            'recommendedActions' => $recommendedActions,
            'benchmarks' => $benchmarks,
            'healthScore' => $healthScore,
            'analysisPayload' => $payload,
            'sentiment' => $sentiment,
            'feedbacksWithComments' => $analysisFeedbacks->count(),
            'resolutionContext' => [
                'resolved_in_period' => $resolvedInPeriod,
                'unresolved_in_period' => $analysisFeedbacks->count(),
                'last_resolved_at' => $lastResolvedAt,
            ],
        ];
    }

    private function buildBenchmarks(int $companyId, $periodStart, $periodEnd): array
    {
        $metrics = DB::table('companies')
            ->select('companies.id', 'companies.name')
            ->leftJoin('feedback_requests', function ($join) use ($periodStart, $periodEnd) {
                $join->on('feedback_requests.company_id', '=', 'companies.id')
                    ->whereBetween('feedback_requests.created_at', [$periodStart, $periodEnd]);
            })
            ->leftJoin('feedback', 'feedback.feedback_request_id', '=', 'feedback_requests.id')
            ->groupBy('companies.id', 'companies.name')
            ->selectRaw('count(feedback_requests.id) as requests_count')
            ->selectRaw('count(feedback.id) as feedbacks_count')
            ->selectRaw('avg(feedback.rating) as avg_rating')
            ->selectRaw('sum(case when feedback.rating <= 2 then 1 else 0 end) as negative_count')
            ->get()
            ->map(function ($row) {
                $requests = (int) $row->requests_count;
                $feedbacks = (int) $row->feedbacks_count;
                $negative = (int) $row->negative_count;

                $responseRate = $requests > 0 ? round(($feedbacks / $requests) * 100, 1) : 0;
                $negativeRate = $feedbacks > 0 ? round(($negative / $feedbacks) * 100, 1) : 0;
                $avgRating = $row->avg_rating !== null ? round((float) $row->avg_rating, 2) : null;

                return [
                    'id' => (int) $row->id,
                    'responseRate' => $responseRate,
                    'negativeRate' => $negativeRate,
                    'avgRating' => $avgRating,
                ];
            })
            ->values();

        $current = $metrics->firstWhere('id', $companyId);

        $responseRates = $metrics->pluck('responseRate')->filter()->values()->all();
        $negativeRates = $metrics->pluck('negativeRate')->filter()->values()->all();
        $avgRatings = $metrics->pluck('avgRating')->filter()->values()->all();

        return [
            'responseRate' => [
                'label' => 'Taux de réponse',
                'company' => $current['responseRate'] ?? null,
                'median' => $this->median($responseRates),
                'percentile' => $this->percentileRank($responseRates, $current['responseRate'] ?? null),
            ],
            'negativeRate' => [
                'label' => 'Taux négatif',
                'company' => $current['negativeRate'] ?? null,
                'median' => $this->median($negativeRates),
                'percentile' => $this->percentileRank($negativeRates, $current['negativeRate'] ?? null),
            ],
            'avgRating' => [
                'label' => 'Note moyenne',
                'company' => $current['avgRating'] ?? null,
                'median' => $this->median($avgRatings),
                'percentile' => $this->percentileRank($avgRatings, $current['avgRating'] ?? null),
            ],
        ];
    }

    private function buildHealthScore(float $responseRate, float $negativeRate, ?float $avgRating, int $failedCurrent): array
    {
        $ratingScore = $avgRating !== null ? ($avgRating / 5) * 100 : 50;
        $negPenalty = $negativeRate * 0.6;
        $respPenalty = (100 - $responseRate) * 0.3;
        $failPenalty = min($failedCurrent * 2, 15);

        $score = round(max(0, min(100, $ratingScore - $negPenalty - $respPenalty - $failPenalty)), 1);

        return [
            'score' => $score,
            'drivers' => [
                'rating_score' => round($ratingScore, 1),
                'negative_penalty' => round($negPenalty, 1),
                'response_penalty' => round($respPenalty, 1),
                'failed_penalty' => round($failPenalty, 1),
            ],
        ];
    }

    private function buildChannelSignals(int $companyId, $periodStart, $periodEnd, $prevStart, $prevEnd): array
    {
        $current = DB::table('feedback_requests')
            ->leftJoin('feedback', 'feedback.feedback_request_id', '=', 'feedback_requests.id')
            ->where('feedback_requests.company_id', $companyId)
            ->whereBetween('feedback_requests.created_at', [$periodStart, $periodEnd])
            ->whereNotNull('feedback_requests.channel')
            ->groupBy('feedback_requests.channel')
            ->selectRaw('feedback_requests.channel as channel')
            ->selectRaw('count(feedback_requests.id) as requests_count')
            ->selectRaw('count(feedback.id) as feedbacks_count')
            ->selectRaw('sum(case when feedback.rating <= 2 then 1 else 0 end) as negative_count')
            ->get()
            ->keyBy('channel');

        $previous = DB::table('feedback_requests')
            ->leftJoin('feedback', 'feedback.feedback_request_id', '=', 'feedback_requests.id')
            ->where('feedback_requests.company_id', $companyId)
            ->whereBetween('feedback_requests.created_at', [$prevStart, $prevEnd])
            ->whereNotNull('feedback_requests.channel')
            ->groupBy('feedback_requests.channel')
            ->selectRaw('feedback_requests.channel as channel')
            ->selectRaw('count(feedback_requests.id) as requests_count')
            ->selectRaw('count(feedback.id) as feedbacks_count')
            ->selectRaw('sum(case when feedback.rating <= 2 then 1 else 0 end) as negative_count')
            ->get()
            ->keyBy('channel');

        $signals = [];
        $actions = [];

        foreach ($current as $channel => $row) {
            $prev = $previous->get($channel);

            $requests = (int) $row->requests_count;
            $feedbacks = (int) $row->feedbacks_count;
            $negative = (int) $row->negative_count;

            $prevRequests = (int) ($prev->requests_count ?? 0);
            $prevFeedbacks = (int) ($prev->feedbacks_count ?? 0);
            $prevNegative = (int) ($prev->negative_count ?? 0);

            $responseRate = $requests > 0 ? ($feedbacks / $requests) * 100 : 0;
            $prevResponseRate = $prevRequests > 0 ? ($prevFeedbacks / $prevRequests) * 100 : 0;
            $responseDelta = round($responseRate - $prevResponseRate, 1);

            $negativeRate = $feedbacks > 0 ? ($negative / $feedbacks) * 100 : 0;
            $prevNegativeRate = $prevFeedbacks > 0 ? ($prevNegative / $prevFeedbacks) * 100 : 0;
            $negativeDelta = round($negativeRate - $prevNegativeRate, 1);

            if ($responseDelta <= -20 && $requests >= 5) {
                $signals[] = [
                    'category' => 'ops',
                    'severity' => $responseDelta <= -35 ? 'high' : 'medium',
                    'title' => "Baisse de réponse — {$channel}",
                    'detail' => "Taux de réponse {$channel} en baisse de {$responseDelta} points.",
                    'evidence_count' => $requests,
                ];
                $actions[] = [
                    'priority' => 'P1',
                    'title' => "Relance ciblée ({$channel})",
                    'detail' => "Créer une relance dédiée pour les demandes envoyées via {$channel}.",
                    'context' => [
                        'signal_title' => "Baisse de réponse — {$channel}",
                        'signal_detail' => "Taux de réponse {$channel} en baisse de {$responseDelta} points.",
                    ],
                ];
            }

            if ($negativeDelta >= 15 && $feedbacks >= 5) {
                $signals[] = [
                    'category' => 'risk',
                    'severity' => $negativeDelta >= 25 ? 'high' : 'medium',
                    'title' => "Hausse négative — {$channel}",
                    'detail' => "Taux négatif {$channel} en hausse de {$negativeDelta} points.",
                    'evidence_count' => $negative,
                ];
                $actions[] = [
                    'priority' => 'P0',
                    'title' => "Analyser les retours négatifs ({$channel})",
                    'detail' => "Extraire les causes principales liées aux retours {$channel}.",
                    'context' => [
                        'signal_title' => "Hausse négative — {$channel}",
                        'signal_detail' => "Taux négatif {$channel} en hausse de {$negativeDelta} points.",
                    ],
                ];
            }
        }

        return ['signals' => $signals, 'actions' => $actions];
    }

    private function percentileRank(array $values, ?float $current): ?float
    {
        if ($current === null || empty($values)) {
            return null;
        }

        $sorted = $values;
        sort($sorted);
        $count = count($sorted);
        $below = collect($sorted)->filter(fn ($v) => $v <= $current)->count();

        return round(($below / $count) * 100, 1);
    }

    private function median(array $values): ?float
    {
        if (empty($values)) {
            return null;
        }

        $sorted = $values;
        sort($sorted);
        $count = count($sorted);
        $mid = (int) floor($count / 2);

        if ($count % 2 === 0) {
            return round((($sorted[$mid - 1] + $sorted[$mid]) / 2), 1);
        }

        return round($sorted[$mid], 1);
    }

    /**
     * Générer QR code global en base64 (SVG)
     */
    private function generateGlobalQRCode()
    {
        try {
            // URL publique du formulaire de feedback global
            $url = route('feedback.public');

            // Créer le QR code (v6 utilise readonly class avec constructeur)
            $qrCode = new \Endroid\QrCode\QrCode(
                data: $url,
                size: 300,
                margin: 10
            );

            $writer = new \Endroid\QrCode\Writer\SvgWriter();
            $result = $writer->write($qrCode);

            // Retourner en base64
            return 'data:' . $result->getMimeType() . ';base64,' . base64_encode($result->getString());
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Synchroniser les problèmes/décisions détectés par l'IA en base de données.
     * 
     * Logique :
     * 1. Pour chaque problème/décision retourné par l'IA → upsert via ai_hash (dédupliquation)
     * 2. Attacher les feedback_ids en pivot (sync sans détacher les anciens)
     * 3. Auto-résoudre les problèmes OUVERTS qui ne sont plus détectés par l'IA
     */
    private function syncDetectedProblems($company, array $feedbackSummary, array $analysisPayload): void
    {
        if (($feedbackSummary['status'] ?? '') === 'empty') {
            return;
        }

        $companyId = $company->id;
        $now = now();
        $currentHashes = [];

        // Map analysis payload IDs for quick lookup
        $validFeedbackIds = collect($analysisPayload)->pluck('id')->filter()->all();

        // ── Process problems ──
        $problems = $feedbackSummary['problems'] ?? [];
        foreach ($problems as $problem) {
            $title = trim($problem['title'] ?? '');
            if (empty($title)) continue;

            $hash = \App\Models\DetectedProblem::generateHash($title, $companyId);
            $currentHashes[] = $hash;

            // Check if exists first to avoid overwriting user-set status
            $existing = \App\Models\DetectedProblem::where('ai_hash', $hash)
                ->where('company_id', $companyId)
                ->first();

            if ($existing) {
                // Update content but preserve status (user may have set it to in_progress)
                $existing->update([
                    'title' => $title,
                    'detail' => $problem['detail'] ?? null,
                    'solution' => $problem['solution'] ?? null,
                    'effort' => $problem['effort'] ?? null,
                    'impact' => $problem['impact'] ?? null,
                    'urgency' => $problem['urgency'] ?? null,
                ]);
                // If it was resolved but IA re-detected it → reopen
                if ($existing->status === \App\Models\DetectedProblem::STATUS_RESOLVED) {
                    $existing->reopen();
                }
                $detected = $existing;
            } else {
                $detected = \App\Models\DetectedProblem::create([
                    'ai_hash' => $hash,
                    'company_id' => $companyId,
                    'title' => $title,
                    'detail' => $problem['detail'] ?? null,
                    'solution' => $problem['solution'] ?? null,
                    'effort' => $problem['effort'] ?? null,
                    'impact' => $problem['impact'] ?? null,
                    'urgency' => $problem['urgency'] ?? null,
                    'type' => \App\Models\DetectedProblem::TYPE_PROBLEM,
                    'status' => \App\Models\DetectedProblem::STATUS_OPEN,
                ]);
            }

            // Attach feedback IDs (only valid ones, without detaching existing)
            $feedbackIds = collect($problem['feedback_ids'] ?? [])
                ->map(fn($id) => (int) $id)
                ->filter(fn($id) => in_array($id, $validFeedbackIds))
                ->unique()
                ->values()
                ->all();

            if (!empty($feedbackIds)) {
                $detected->feedbacks()->syncWithoutDetaching($feedbackIds);
                // Update denormalized count
                $detected->update(['feedbacks_count' => $detected->feedbacks()->count()]);
            }
        }

        // ── Process decisions ──
        $decisions = $feedbackSummary['decisions'] ?? [];
        foreach ($decisions as $decision) {
            $title = trim($decision['title'] ?? '');
            if (empty($title)) continue;

            $hash = \App\Models\DetectedProblem::generateHash($title, $companyId);
            $currentHashes[] = $hash;

            $existing = \App\Models\DetectedProblem::where('ai_hash', $hash)
                ->where('company_id', $companyId)
                ->first();

            if ($existing) {
                $existing->update([
                    'title' => $title,
                    'detail' => $decision['detail'] ?? null,
                    'impact' => $decision['impact'] ?? null,
                    'urgency' => $decision['urgency'] ?? null,
                ]);
                if ($existing->status === \App\Models\DetectedProblem::STATUS_RESOLVED) {
                    $existing->reopen();
                }
                $detected = $existing;
            } else {
                $detected = \App\Models\DetectedProblem::create([
                    'ai_hash' => $hash,
                    'company_id' => $companyId,
                    'title' => $title,
                    'detail' => $decision['detail'] ?? null,
                    'solution' => null,
                    'effort' => null,
                    'impact' => $decision['impact'] ?? null,
                    'urgency' => $decision['urgency'] ?? null,
                    'type' => \App\Models\DetectedProblem::TYPE_DECISION,
                    'status' => \App\Models\DetectedProblem::STATUS_OPEN,
                ]);
            }

            $feedbackIds = collect($decision['feedback_ids'] ?? [])
                ->map(fn($id) => (int) $id)
                ->filter(fn($id) => in_array($id, $validFeedbackIds))
                ->unique()
                ->values()
                ->all();

            if (!empty($feedbackIds)) {
                $detected->feedbacks()->syncWithoutDetaching($feedbackIds);
                $detected->update(['feedbacks_count' => $detected->feedbacks()->count()]);
            }
        }

        // ── Auto-resolve: problems/decisions no longer detected by IA ──
        // Only auto-resolve items that were OPEN (not manually in_progress)
        if (!empty($currentHashes)) {
            \App\Models\DetectedProblem::where('company_id', $companyId)
                ->where('status', \App\Models\DetectedProblem::STATUS_OPEN)
                ->whereNotIn('ai_hash', $currentHashes)
                ->each(function ($stale) {
                    $stale->markResolved();
                });
        }
    }

    /**
     * Générer un résumé IA structuré des feedbacks avec Gemini
     * Inclut: résumé, décisions suggérées, problèmes à résoudre avec solutions
     */
    private function generateFeedbackSummary(RadarAnalysisService $radarService, $company, array $data, array $ops): array
    {
        $cacheKey = "radar-summary-{$company->id}-" . md5(json_encode($data['sentiment']) . json_encode($ops));

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () use ($data, $ops) {
            $feedbacks = $data['analysisPayload'] ?? [];
            $stats = $data['stats'] ?? [];
            $sentiment = $data['sentiment'] ?? [];

            if (empty($feedbacks)) {
                return [
                    'status' => 'empty',
                    'summary' => 'Aucun feedback disponible pour générer un résumé.',
                    'decisions' => [],
                    'problems' => [],
                ];
            }

            // Include feedback IDs so IA can reference which feedbacks justify each problem/decision
            $entries = collect($feedbacks)
                ->take(50)
                ->map(fn($f, $i) => "[ID:{$f['id']}] ★{$f['rating']}/5 — " . mb_substr($f['comment'] ?? '', 0, 200))
                ->implode("\n");

            $feedbackIds = collect($feedbacks)->take(50)->pluck('id')->values()->all();

            $opsContext = json_encode([
                'tasks_open' => $ops['tasks']['open'] ?? 0,
                'tasks_overdue' => $ops['tasks']['overdue'] ?? 0,
                'tasks_critical' => $ops['tasks']['critical'] ?? 0,
                'replies_ai' => $ops['replies']['ai'] ?? 0,
                'replies_admin' => $ops['replies']['admin'] ?? 0,
                'unanswered' => $ops['replies']['unanswered'] ?? 0,
                'resolution_rate' => $ops['resolution']['rate'] ?? 0,
                'pinned' => $ops['resolution']['pinned'] ?? 0,
                'avg_rating' => $stats['avgRating'] ?? null,
                'response_rate' => $stats['responseRate'] ?? 0,
                'positive_rate' => $stats['positiveRate'] ?? 0,
                'negative_rate' => $stats['negativeRate'] ?? 0,
            ], JSON_UNESCAPED_UNICODE);

            $feedbackIdsJson = json_encode($feedbackIds);

            $prompt = <<<PROMPT
Tu es un consultant IA expert en expérience client (CX) et gestion d'entreprise. Analyse les feedbacks clients suivants et les données opérationnelles pour produire:

1. Un RÉSUMÉ court (3-4 phrases max) qui capture l'essentiel de ce que disent les clients
2. Des DÉCISIONS concrètes que le dirigeant devrait prendre (max 4)
3. Des PROBLÈMES identifiés avec des SOLUTIONS précises (max 4)

Données opérationnelles: {$opsContext}
Sentiment: positif={$sentiment['positive']}, neutre={$sentiment['neutral']}, négatif={$sentiment['negative']}

IMPORTANT: Chaque feedback a un identifiant [ID:xxx]. Pour chaque problème et décision, tu DOIS indiquer les IDs des feedbacks qui justifient cette observation dans le champ "feedback_ids".
IDs disponibles: {$feedbackIdsJson}

Contraintes:
- JSON valide uniquement
- Pas d'invention — uniquement basé sur les feedbacks fournis
- Ton professionnel, concis, actionnable
- Chaque décision et problème doit avoir un impact mesurable
- feedback_ids doit contenir UNIQUEMENT des IDs présents dans la liste ci-dessus

Format JSON:
{
  "summary": "Résumé en 3-4 phrases...",
  "decisions": [
    {"title": "...", "detail": "...", "impact": "faible|moyen|fort", "urgency": "immédiat|court_terme|moyen_terme", "feedback_ids": [12, 45]}
  ],
  "problems": [
    {"title": "...", "detail": "...", "solution": "...", "effort": "faible|moyen|élevé", "impact": "faible|moyen|fort", "feedback_ids": [12, 78, 90]}
  ]
}

Feedbacks:
{$entries}
PROMPT;

            try {
                $apiKey = config('services.gemini.api_key');
                $model = config('services.gemini.model') ?? 'models/gemini-2.5-flash:generateContent';

                if (!$apiKey) {
                    return $this->fallbackFeedbackSummary($data, $ops);
                }

                $url = 'https://generativelanguage.googleapis.com/v1beta/' . $model . '?key=' . urlencode($apiKey);

                $response = \Illuminate\Support\Facades\Http::timeout(30)->post($url, [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                ]);

                if (!$response->successful()) {
                    return $this->fallbackFeedbackSummary($data, $ops);
                }

                $text = $response->json('candidates.0.content.parts.0.text');
                $start = strpos($text, '{');
                $end = strrpos($text, '}');

                if ($start === false || $end === false) {
                    return $this->fallbackFeedbackSummary($data, $ops);
                }

                $parsed = json_decode(substr($text, $start, $end - $start + 1), true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    return $this->fallbackFeedbackSummary($data, $ops);
                }

                // Sanitize feedback_ids: keep only valid IDs from the available set
                $validIds = array_flip($feedbackIds);
                $sanitizeIds = function (array $items) use ($validIds) {
                    return array_map(function ($item) use ($validIds) {
                        $ids = is_array($item['feedback_ids'] ?? null) ? $item['feedback_ids'] : [];
                        $item['feedback_ids'] = array_values(array_filter($ids, fn($id) => isset($validIds[(int) $id])));
                        return $item;
                    }, $items);
                };

                return [
                    'status' => 'ok',
                    'summary' => $parsed['summary'] ?? 'Résumé indisponible.',
                    'decisions' => $sanitizeIds(is_array($parsed['decisions'] ?? null) ? array_slice($parsed['decisions'], 0, 4) : []),
                    'problems' => $sanitizeIds(is_array($parsed['problems'] ?? null) ? array_slice($parsed['problems'], 0, 4) : []),
                ];
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Feedback summary generation failed', ['error' => $e->getMessage()]);
                return $this->fallbackFeedbackSummary($data, $ops);
            }
        });
    }

    private function fallbackFeedbackSummary(array $data, array $ops): array
    {
        $stats = $data['stats'] ?? [];
        $total = $stats['total'] ?? 0;
        $negRate = $stats['negativeRate'] ?? 0;
        $avgRating = $stats['avgRating'] ?? null;
        $resRate = $ops['resolution']['rate'] ?? 0;

        $summaryParts = [];
        if ($total > 0) {
            $summaryParts[] = "Sur les {$total} feedbacks analysés, le taux de satisfaction est de {$stats['positiveRate']}%.";
        }
        if ($avgRating) {
            $summaryParts[] = "La note moyenne est de {$avgRating}/5.";
        }
        if ($negRate > 20) {
            $summaryParts[] = "Le taux d'avis négatifs ({$negRate}%) nécessite une attention particulière.";
        }
        if (($ops['replies']['unanswered'] ?? 0) > 0) {
            $summaryParts[] = "{$ops['replies']['unanswered']} feedback(s) restent sans réponse.";
        }

        $decisions = [];
        if ($negRate > 25) {
            $decisions[] = ['title' => 'Plan de redressement CX', 'detail' => 'Lancer un audit des retours négatifs pour identifier les causes racines.', 'impact' => 'fort', 'urgency' => 'immédiat'];
        }
        if (($ops['replies']['unanswered'] ?? 0) > 3) {
            $decisions[] = ['title' => 'Répondre aux feedbacks en attente', 'detail' => "Il y a {$ops['replies']['unanswered']} feedbacks sans réponse.", 'impact' => 'moyen', 'urgency' => 'court_terme'];
        }
        if (($ops['tasks']['overdue'] ?? 0) > 0) {
            $decisions[] = ['title' => 'Traiter les tâches en retard', 'detail' => "{$ops['tasks']['overdue']} tâche(s) dépassent leur date d'échéance.", 'impact' => 'moyen', 'urgency' => 'immédiat'];
        }

        return [
            'status' => 'fallback',
            'summary' => implode(' ', $summaryParts) ?: 'Résumé local: données insuffisantes pour une analyse approfondie.',
            'decisions' => $decisions,
            'problems' => [],
        ];
    }
}
