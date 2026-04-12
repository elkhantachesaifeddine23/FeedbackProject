<?php

namespace App\Mail;

use App\Models\FeedbackReply;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class FeedbackReplyMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public FeedbackReply $reply) {}

    public function build()
    {
        $fromAddress = (string) config('mail.from.address');
        $platformFromName = (string) config('mail.from.name', 'Luminea');
        $companyName = $this->reply->feedback?->feedbackRequest?->company?->name;
        $fromName = $companyName ?: $platformFromName;
        $replyToEmail = $this->reply->feedback?->feedbackRequest?->company?->user?->email;
        $replyToName = $companyName ?: ($this->reply->feedback?->feedbackRequest?->company?->user?->name ?? $platformFromName);

        $mail = $this
            ->subject('Réponse à votre avis')
            ->view('emails.feedback-reply')
            ->with([
                'customerName' => $this->reply->feedback->feedbackRequest->customer->name,
                'replyContent' => $this->reply->content,
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
