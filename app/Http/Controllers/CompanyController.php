<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Feedback;
use App\Models\FeedbackRequest;
use Illuminate\Support\Facades\DB;

class CompanyController extends Controller
{
    public function edit(Request $request)
    {
        $company = $request->user()->company;

        // Récupérer les statistiques
        $feedbacks = Feedback::whereHas('feedbackRequest', function ($q) use ($company) {
            $q->where('company_id', $company->id);
        })->get();

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

        return Inertia::render('Company/Edit', [
            'company' => $company,
            'stats' => [
                'avgRating' => $avgRating,
                'totalFeedbacks' => $totalFeedbacks,
                'completionRate' => $completionRate,
            ]
        ]);
    }

    

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sector' => ['nullable', 'string', 'max:255'],
            'google_place_id' => ['nullable', 'string', 'max:255'],
            'google_review_url' => ['nullable', 'url'],
        ]);

        $company = $request->user()->company;
        $company->update($validated);

        return redirect()
            ->route('company.edit')
            ->with('success', 'Informations de l’entreprise mises à jour');
    }
}
