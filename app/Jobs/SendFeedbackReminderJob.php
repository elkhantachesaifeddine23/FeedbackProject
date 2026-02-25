<?php

namespace App\Jobs;

use App\Models\FeedbackRequest;
use App\Services\ReminderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendFeedbackReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public FeedbackRequest $feedbackRequest
    ) {}

    public function handle(ReminderService $reminderService): void
    {
        $reminderService->sendReminder($this->feedbackRequest);
    }
}
