<?php

namespace App\Services;

use App\Jobs\SendFeedbackReminderJob;
use App\Models\FeedbackRequest;

class ReminderService
{
    public function dispatch(FeedbackRequest $feedbackRequest): void
    {
        SendFeedbackReminderJob::dispatch($feedbackRequest);
    }

    public function sendNow(FeedbackRequest $feedbackRequest): void
    {
        $this->sendReminder($feedbackRequest);
    }

    public function sendReminder(FeedbackRequest $feedbackRequest): void
    {
        $brevo = app(BrevoService::class);

        if ($feedbackRequest->channel === 'sms') {
            $link = rtrim(config('app.url'), '/') . '/feedback/' . $feedbackRequest->token;
            $brevo->sendSms(
                $feedbackRequest->customer->phone,
                "Rappel 👋\nMerci de donner votre avis : " . $link
            );
            return;
        }

        $brevo->sendReminderEmail($feedbackRequest);
    }
}
