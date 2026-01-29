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

class FeedbackReplyController extends Controller
{
    // 1️⃣ Afficher toutes les réponses d’un feedback
    public function index(int $id)
    {
        $feedback = Feedback::with([
            'replies',
            'feedbackRequest.customer'
        ])->findOrFail($id);

        return Inertia::render('Feedback/Reply', [
            'feedback' => $feedback,
            'replies'  => $feedback->replies,
        ]);
    }

    // 2️⃣ Créer une réponse manuelle

public function store(Request $request, int $id)
{
    $request->validate([
        'content' => ['required', 'string', 'max:1000'],
    ]);

    $feedback = Feedback::with('feedbackRequest.customer')->findOrFail($id);

    $reply = FeedbackReply::create([
    'feedback_id'    => $feedback->id,
    'responder_type' => 'admin',
    'responder_id'   => Auth::id(),
    'content'        => $request->content,
    'status'         => 'completed', // ✅ conforme à la DB
   ]);


    // 🔥 Envoi non bloquant (try/catch)
    app(ReplyNotificationService::class)
        ->send($reply);

        return redirect()
        ->route('dashboard')
        ->with('success', 'Réponse envoyée avec succès');
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
