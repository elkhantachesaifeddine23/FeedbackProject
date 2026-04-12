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
        $fromAddress = (string) config('mail.from.address');
        $platformFromName = (string) config('mail.from.name', 'Luminea');
        $companyName = $this->feedbackRequest->company?->name;
        $fromName = $companyName ?: $platformFromName;
        $replyToEmail = $this->feedbackRequest->company?->user?->email;
        $replyToName = $companyName ?: ($this->feedbackRequest->company?->user?->name ?? $platformFromName);

        $mail = $this
            ->subject('Rappel : nous attendons votre avis')
            ->view('emails.feedback-reminder')
            ->with([
                'link' => $link,
                'company' => $this->feedbackRequest->company->name,
                'customer' => $this->feedbackRequest->customer?->name
                    ?? $this->feedbackRequest->recipient_name
                    ?? 'Client',
            ]);

        if (!empty($fromAddress)) {
            $mail->from($fromAddress, $fromName);
        }

        if (!empty($replyToEmail)) {
            $mail->replyTo($replyToEmail, $replyToName);
        }

        return $mail;
    }
}
