<?php

namespace App\Services;

use App\Jobs\SendFeedbackReminderJob;
use App\Models\FeedbackRequest;
use Illuminate\Support\Facades\Log;

class ReminderService
{
    public function dispatchDueReminders(int $limit = 200): int
    {
        $ids = FeedbackRequest::query()
            ->where('status', 'sent')
            ->whereNull('responded_at')
            ->whereIn('channel', ['email', 'sms'])
            ->where('reminder_count', '<', FeedbackRequest::MAX_REMINDERS)
            ->whereNotNull('next_reminder_at')
            ->where('next_reminder_at', '<=', now())
            ->orderBy('next_reminder_at')
            ->limit($limit)
            ->pluck('id');

        foreach ($ids as $id) {
            SendFeedbackReminderJob::dispatch((int) $id);
        }

        return $ids->count();
    }

    public function dispatch(FeedbackRequest $feedbackRequest): void
    {
        SendFeedbackReminderJob::dispatch($feedbackRequest->id);
    }

    public function sendNow(FeedbackRequest $feedbackRequest): void
    {
        $this->sendReminder($feedbackRequest);
    }

    public function sendReminderById(int $feedbackRequestId): void
    {
        $feedbackRequest = FeedbackRequest::with(['customer', 'company'])->find($feedbackRequestId);

        if (! $feedbackRequest) {
            return;
        }

        $this->sendReminder($feedbackRequest);
    }

    public function sendReminder(FeedbackRequest $feedbackRequest): void
    {
        $feedbackRequest->loadMissing(['customer', 'company']);

        if (! $this->isEligibleForReminder($feedbackRequest)) {
            return;
        }

        // Claim atomique pour éviter les doublons en cas de workers parallèles.
        $claimed = FeedbackRequest::query()
            ->whereKey($feedbackRequest->id)
            ->where('status', 'sent')
            ->whereNull('responded_at')
            ->where('reminder_count', '<', FeedbackRequest::MAX_REMINDERS)
            ->whereNotNull('next_reminder_at')
            ->where('next_reminder_at', '<=', now())
            ->update([
                'next_reminder_at' => now()->addMinutes(10),
            ]);

        if ($claimed === 0) {
            return;
        }

        $brevo = app(BrevoService::class);

        if ($feedbackRequest->channel === 'sms') {
            $phone = $feedbackRequest->customer?->phone ?? $feedbackRequest->recipient_phone;
            if (empty($phone)) {
                Log::warning('Reminder skipped: customer phone missing', [
                    'feedback_request_id' => $feedbackRequest->id,
                ]);

                $feedbackRequest->update([
                    'next_reminder_at' => null,
                ]);
                return;
            }

            $link = rtrim(config('app.url'), '/') . '/feedback/' . $feedbackRequest->token;
            $brevo->sendSms(
                $phone,
                "Rappel 👋\nMerci de donner votre avis : " . $link
            );
        } else {
            $brevo->sendReminderEmail($feedbackRequest);
        }

        $feedbackRequest->refresh();
        $newCount = (int) $feedbackRequest->reminder_count + 1;

        $feedbackRequest->update([
            'reminder_count' => $newCount,
            'last_reminder_at' => now(),
            'next_reminder_at' => $newCount >= FeedbackRequest::MAX_REMINDERS
                ? null
                : now()->addDay(),
        ]);
    }

    private function isEligibleForReminder(FeedbackRequest $feedbackRequest): bool
    {
        return $feedbackRequest->status === 'sent'
            && $feedbackRequest->responded_at === null
            && in_array($feedbackRequest->channel, ['email', 'sms'], true)
            && (int) $feedbackRequest->reminder_count < FeedbackRequest::MAX_REMINDERS
            && $feedbackRequest->next_reminder_at !== null
            && $feedbackRequest->next_reminder_at->lte(now());
    }
}
