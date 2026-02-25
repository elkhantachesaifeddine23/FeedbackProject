<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Feedback;
use App\Models\FeedbackRequest;
use Illuminate\Support\Facades\DB;

class GlobalRadarBuilder
{
    public function build(int $days = 30): array
    {
        $from = now()->subDays($days)->startOfDay();
        $to = now();

        $totalCompanies = Company::count();
        $totalRequests = FeedbackRequest::whereBetween('created_at', [$from, $to])->count();
        $totalFeedbacks = Feedback::whereBetween('created_at', [$from, $to])->count();

        $positive = Feedback::whereBetween('created_at', [$from, $to])
            ->notResolved()
            ->whereNotNull('rating')
            ->where('rating', '>=', 4)
            ->count();

        $negative = Feedback::whereBetween('created_at', [$from, $to])
            ->notResolved()
            ->whereNotNull('rating')
            ->where('rating', '<=', 2)
            ->count();

        $neutral = max($totalFeedbacks - $positive - $negative, 0);

        $avgRating = Feedback::whereBetween('created_at', [$from, $to])
            ->notResolved()
            ->whereNotNull('rating')
            ->avg('rating');

        $failedRequests = FeedbackRequest::whereBetween('created_at', [$from, $to])
            ->where('status', 'failed')
            ->count();

        $channelStats = FeedbackRequest::select('channel', DB::raw('count(*) as count'))
            ->whereBetween('created_at', [$from, $to])
            ->whereNotNull('channel')
            ->groupBy('channel')
            ->get()
            ->map(function ($row) {
                return [
                    'channel' => $row->channel,
                    'count' => (int) $row->count,
                ];
            })
            ->values();

        $responseRate = $totalRequests > 0
            ? round(($totalFeedbacks / $totalRequests) * 100, 1)
            : 0.0;

        // Payload for AI: comments are analyzed, keep it capped.
        // IMPORTANT: Exclude resolved feedbacks from analysis
        $analysisFeedbacks = Feedback::query()
            ->whereBetween('created_at', [$from, $to])
            ->notResolved()
            ->whereNotNull('comment')
            ->latest()
            ->take(240)
            ->get(['id', 'rating', 'comment', 'created_at'])
            ->map(function ($f) {
                return [
                    'id' => $f->id,
                    'rating' => $f->rating,
                    'comment' => $f->comment,
                    'created_at' => optional($f->created_at)->format('Y-m-d'),
                ];
            })
            ->values()
            ->all();

        $kpis = [
            'companies_total' => $totalCompanies,
            'requests_30d' => $totalRequests,
            'feedbacks_30d' => $totalFeedbacks,
            'response_rate_30d' => $responseRate,
            'avg_rating_30d' => $avgRating ? round((float) $avgRating, 2) : null,
        ];

        $ops = [
            'failed_requests_30d' => $failedRequests,
            'channels_30d' => $channelStats,
        ];

        // Company risk ranking (simple, explainable score)
        $companyMetrics = Company::query()
            ->select(['companies.id', 'companies.name'])
            ->join('feedback_requests', 'feedback_requests.company_id', '=', 'companies.id')
            ->leftJoin('feedback', 'feedback.feedback_request_id', '=', 'feedback_requests.id')
            ->whereBetween('feedback_requests.created_at', [$from, $to])
            ->groupBy('companies.id', 'companies.name')
            ->selectRaw('count(feedback_requests.id) as requests_count')
            ->selectRaw('count(feedback.id) as feedbacks_count')
            ->selectRaw('avg(feedback.rating) as avg_rating')
            ->selectRaw('sum(case when feedback.rating <= 2 then 1 else 0 end) as negative_count')
            ->selectRaw('sum(case when feedback.rating >= 4 then 1 else 0 end) as positive_count')
            ->get();

        $companiesAtRisk = $companyMetrics
            ->map(function ($row) {
                $requests = (int) $row->requests_count;
                $feedbacks = (int) $row->feedbacks_count;
                $negative = (int) $row->negative_count;

                $responseRate = $requests > 0 ? ($feedbacks / $requests) : 0.0;
                $negativeRate = $feedbacks > 0 ? ($negative / $feedbacks) : 0.0;

                // Risk score emphasizes negative rate, then low response rate.
                $riskScore = round(($negativeRate * 0.7 + (1 - $responseRate) * 0.3) * 100, 1);

                return [
                    'id' => (int) $row->id,
                    'name' => $row->name,
                    'requests_30d' => $requests,
                    'feedbacks_30d' => $feedbacks,
                    'response_rate_30d' => round($responseRate * 100, 1),
                    'avg_rating_30d' => $row->avg_rating !== null ? round((float) $row->avg_rating, 2) : null,
                    'negative_rate_30d' => round($negativeRate * 100, 1),
                    'risk_score' => $riskScore,
                ];
            })
            ->sortByDesc('risk_score')
            ->take(8)
            ->values();

        return [
            'period' => [
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
                'days' => $days,
            ],
            'sentiment' => [
                'positive' => $positive,
                'neutral' => $neutral,
                'negative' => $negative,
            ],
            'kpis' => $kpis,
            'ops' => $ops,
            'analysis_feedbacks' => $analysisFeedbacks,
            'feedbacks_with_comments' => count($analysisFeedbacks),
            'companies_at_risk' => $companiesAtRisk,
        ];
    }
}
