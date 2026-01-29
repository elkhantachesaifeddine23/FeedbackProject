<?php

namespace App\Jobs;

use App\Models\Feedback;
use App\Models\FeedbackReply;
use App\Models\CompanyResponsePolicy;
use App\Services\AIReplyService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class GenerateAIReplyJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Feedback $feedback,
    ) {}

    public function handle(): void
    {
        try {
            $this->feedback->loadMissing('feedbackRequest.customer', 'feedbackRequest.company');

            $feedbackRequest = $this->feedback->feedbackRequest;
            if (! $feedbackRequest) {
                Log::warning('FeedbackRequest missing for Feedback', ['feedback_id' => $this->feedback->id]);
                return;
            }

            $company = $feedbackRequest->company;
            $customer = $feedbackRequest->customer;

            // Récupère la politique de réponse de l'entreprise
            $policy = CompanyResponsePolicy::firstOrCreate(
                ['company_id' => $company->id],
                ['auto_reply_enabled' => true, 'tone' => 'professional']
            );

            // Si auto-reply désactivé, stop
            if (!$policy->auto_reply_enabled) {
                Log::info('Auto-reply disabled for company', ['company_id' => $company->id]);
                return;
            }

            // Génère la réponse IA multilingue
            $aiService = new AIReplyService();
            $replyData = $aiService->generateMultilingual(
                feedbackContent: $this->feedback->comment ?? 'Feedback reçu',
                rating: $this->feedback->rating,
                customerName: $customer?->name,
                detectedLanguage: $feedbackRequest->detected_language
                    ?? ($this->feedback->comment ? $aiService->detectLanguage($this->feedback->comment) : null),
                tone: $policy->tone,
                customInstructions: $policy->custom_instructions
            );

            // Crée la réponse en BD
            $reply = FeedbackReply::create([
                'feedback_id' => $this->feedback->id,
                'responder_type' => 'ai',
                'responder_id' => null,
                'content' => $replyData['content'],
                'status' => 'pending', // En attente de review si note basse
                'provider' => 'gemini',
                'provider_response' => $replyData['provider_response'],
            ]);

            Log::info('AI reply generated', [
                'feedback_request_id' => $feedbackRequest->id,
                'reply_id' => $reply->id,
                'language' => $replyData['language'],
                'rating' => $this->feedback->rating,
            ]);

            // Si note basse: escalade automatique
            if ($policy->shouldEscalate($this->feedback->rating)) {
                // Dispatch le job d'escalade
                dispatch(new EscalateNegativeFeedbackJob($feedbackRequest, $reply));
            }

        } catch (\Exception $e) {
            Log::error('Error in GenerateAIReplyJob', [
                'feedback_request_id' => $feedbackRequest?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Marque la réponse comme échouée
            FeedbackReply::create([
                'feedback_id' => $this->feedback->id,
                'responder_type' => 'ai',
                'content' => 'Erreur lors de la génération IA',
                'status' => 'failed',
                'provider' => 'gemini',
                'provider_response' => json_encode(['error' => $e->getMessage()]),
            ]);

            throw $e;
        }
    }
}
