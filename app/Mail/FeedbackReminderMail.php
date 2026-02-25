<?php

namespace App\Mail;

use App\Models\FeedbackRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class FeedbackReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public FeedbackRequest $feedbackRequest
    ) {}

    public function build()
    {
        $link = route('feedback.show', $this->feedbackRequest->token, true);

        return $this
            ->subject('Rappel : nous attendons votre avis')
            ->view('emails.feedback-reminder')
            ->with([
                'link' => $link,
                'company' => $this->feedbackRequest->company->name,
                'customer' => $this->feedbackRequest->customer->name,
            ]);
    }
}
