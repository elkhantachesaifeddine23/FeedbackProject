<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Models\FeedbackReply;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Jobs\GenerateAIReplyJob;
use App\Jobs\SendFeedbackReplyJob;
use App\Services\ReplyNotificationService;
use App\Services\AIReplyService;
use App\Services\GoogleBusinessProfileService;

class FeedbackReplyController extends Controller
{
    // 1️⃣ Afficher toutes les réponses d’un feedback
    public function index(int $id)
    {
        $feedback = Feedback::with([
            'replies',
            'feedbackRequest.customer',
            'feedbackRequest.company',
        ])->findOrFail($id);

        $isGoogle = $feedback->source === 'google';
        $company = $feedback->feedbackRequest?->company;
        $googleConnected = $company && $company->google_business_profile_connected && $company->google_oauth_token;

        return Inertia::render('Feedback/Reply', [
            'feedback' => $feedback,
            'replies'  => $feedback->replies,
            'replyContext' => [
                'source' => $feedback->source ?? 'manual',
                'is_google' => $isGoogle,
                'google_review_id' => $feedback->google_review_id,
                'google_connected' => $googleConnected,
                'has_google_reply' => $isGoogle && $feedback->replies()->whereNotNull('google_published_at')->exists(),
            ],
        ]);
    }

    // 2️⃣ Créer une réponse — logique différente selon la source du feedback

public function store(Request $request, int $id)
{
    $request->validate([
        'content' => ['required', 'string', 'max:1000'],
    ]);

    $feedback = Feedback::with('feedbackRequest.customer', 'feedbackRequest.company')->findOrFail($id);
    $isGoogle = $feedback->source === 'google';

    $reply = FeedbackReply::create([
        'feedback_id'    => $feedback->id,
        'responder_type' => 'admin',
        'responder_id'   => Auth::id(),
        'content'        => $request->content,
        'status'         => 'pending',
    ]);

    if ($isGoogle && $feedback->google_review_id) {
        // ── Google Business Profile: publier la réponse sur Google ──
        $company = $feedback->feedbackRequest->company;

        if (!$company || !$company->google_oauth_token) {
            $reply->update(['status' => 'failed']);
            return redirect()
                ->route('dashboard')
                ->with('error', 'Compte Google non connecté. Impossible de publier la réponse.');
        }

        try {
            $gbpService = new GoogleBusinessProfileService($company);
            $success = $gbpService->replyToReview($feedback->google_review_id, $request->content);

            if ($success) {
                $reply->update([
                    'status' => 'completed',
                    'google_published_at' => now(),
                ]);

                return redirect()
                    ->route('dashboard')
                    ->with('success', 'Réponse publiée sur Google Business Profile ✓');
            } else {
                $reply->update(['status' => 'failed']);
                return redirect()
                    ->route('dashboard')
                    ->with('error', 'Échec de la publication sur Google. La réponse a été sauvegardée localement.');
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Google reply failed', [
                'feedback_id' => $feedback->id,
                'review_id' => $feedback->google_review_id,
                'error' => $e->getMessage(),
            ]);
            $reply->update(['status' => 'failed']);
            return redirect()
                ->route('dashboard')
                ->with('error', 'Erreur lors de la publication sur Google: ' . $e->getMessage());
        }
    } else {
        // ── Plateforme (email/SMS/WhatsApp/QR): envoyer par email ──
        $reply->update(['status' => 'completed']);

        app(ReplyNotificationService::class)->send($reply);

        return redirect()
            ->route('dashboard')
            ->with('success', 'Réponse envoyée au client par email ✓');
    }
}

    // 3️⃣ Génération IA
    public function generateAIReply(int $id)
    {
        $feedback = Feedback::with('feedbackRequest')->findOrFail($id);

        // 🔹 Job asynchrone pour la réponse IA multilingue
        GenerateAIReplyJob::dispatch($feedback);

        return back()->with('success', 'La réponse IA est en cours de génération...');
    }

    // Génération IA synchrone — renvoie directement le contenu généré (JSON)
    public function generateAIReplySync(Request $request, int $id, AIReplyService $aiService)
    {
        $feedback = Feedback::with('feedbackRequest.customer', 'feedbackRequest.company')->findOrFail($id);

        $customerName = $feedback->feedbackRequest?->customer?->name ?? null;
        $feedbackRequest = $feedback->feedbackRequest;

        $detectedLanguage = $feedbackRequest?->detected_language;
        if (! $detectedLanguage && $feedback->comment) {
            $detectedLanguage = $aiService->detectLanguage($feedback->comment);
        }

        $replyData = $aiService->generateMultilingual(
            feedbackContent: $feedback->comment ?? '',
            rating: $feedback->rating,
            customerName: $customerName,
            detectedLanguage: $detectedLanguage,
            tone: $feedbackRequest?->company?->responsePolicy?->tone ?? 'professional',
            customInstructions: $feedbackRequest?->company?->responsePolicy?->custom_instructions
        );

        return response()->json([
            'content' => $replyData['content'],
            'language' => $replyData['language'],
        ]);
    }
}
