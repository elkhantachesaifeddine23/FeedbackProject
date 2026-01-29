<?php

namespace App\Jobs;

use App\Models\FeedbackRequest;
use App\Models\FeedbackReply;
use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EscalateNegativeFeedbackJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public FeedbackRequest $feedbackRequest,
        public FeedbackReply $reply,
    ) {}

    public function handle(): void
    {
        try {
            $company = $this->feedbackRequest->company;
            $customer = $this->feedbackRequest->customer;
            $policy = $company->responsePolicy;

            Log::info('Escalating negative feedback', [
                'feedback_request_id' => $this->feedbackRequest->id,
                'customer' => $customer?->name,
                'threshold' => $policy?->escalate_threshold ?? 2,
            ]);

            // 1️⃣ Crée une Task (ticket) pour l'équipe
            $task = Task::create([
                'company_id' => $company->id,
                'title' => "🔴 Feedback critique de {$customer?->name}",
                'description' => "Feedback négatif reçu:\n\n{$this->feedbackRequest->feedback_text}\n\nRéponse IA générée:\n{$this->reply->content}",
                'priority' => Task::SEVERITY_CRITICAL,
                'status' => 'open',
                'due_date' => now()->addHours(4), // Due dans 4h
            ]);

            // 2️⃣ Assigne au manager/admin de l'entreprise
            if ($policy && $policy->escalate_to_role) {
                $manager = User::role($policy->escalate_to_role)
                    ->where('company_id', $company->id)
                    ->first();

                if ($manager) {
                    $task->update(['assigned_to' => $manager->id]);
                }
            }

            // 3️⃣ Envoie une notification email au manager
            if (isset($manager)) {
                Mail::send('emails.escalation-alert', [
                    'manager_name' => $manager->name,
                    'customer_name' => $customer?->name,
                    'feedback_text' => $this->feedbackRequest->feedback_text,
                    'ai_reply' => $this->reply->content,
                    'task_id' => $task->id,
                    'company_name' => $company->name,
                ], function ($message) use ($manager, $company) {
                    $message->to($manager->email)
                        ->subject("🔴 Alerte: Feedback critique - {$company->name}");
                });
            }

            // 4️⃣ Marque la réponse comme "escaladée"
            $this->reply->update(['status' => 'escalated']);

            Log::info('Negative feedback escalated successfully', [
                'task_id' => $task->id,
                'assigned_to' => $task->assigned_to,
                'reply_id' => $this->reply->id,
            ]);

        } catch (\Exception $e) {
            Log::error('Error in EscalateNegativeFeedbackJob', [
                'feedback_request_id' => $this->feedbackRequest->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }
}
