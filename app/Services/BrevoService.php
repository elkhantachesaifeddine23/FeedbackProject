<?php

namespace App\Services;

use App\Mail\FeedbackRequestMail;
use App\Mail\FeedbackReminderMail;
use App\Models\FeedbackRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class BrevoService
{
    public function diagnose(): array
    {
        return [
            'mail' => [
                'mailer' => config('mail.default'),
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
                'username_set' => !empty(config('mail.mailers.smtp.username')),
                'password_set' => !empty(config('mail.mailers.smtp.password')),
                'encryption' => config('mail.mailers.smtp.encryption'),
                'from' => [
                    'address' => config('mail.from.address'),
                    'name' => config('mail.from.name'),
                ],
            ],
            'brevo' => [
                'api_key_set' => !empty(config('services.brevo.api_key')),
                'sms_sender_set' => !empty(config('services.brevo.sms_sender')),
            ],
        ];
    }

    public function sendFeedbackEmail(FeedbackRequest $feedbackRequest): void
    {
        Log::info('Brevo SMTP send (feedback)', [
            'to' => $feedbackRequest->customer->email,
            'mailer' => config('mail.default'),
            'host' => config('mail.mailers.smtp.host'),
            'port' => config('mail.mailers.smtp.port'),
            'username' => config('mail.mailers.smtp.username'),
            'from' => config('mail.from.address'),
        ]);

        Mail::to($feedbackRequest->customer->email)
            ->send(new FeedbackRequestMail($feedbackRequest));
    }

    public function sendReminderEmail(FeedbackRequest $feedbackRequest): void
    {
        Log::info('Brevo SMTP send (reminder)', [
            'to' => $feedbackRequest->customer->email,
            'mailer' => config('mail.default'),
            'host' => config('mail.mailers.smtp.host'),
            'port' => config('mail.mailers.smtp.port'),
            'username' => config('mail.mailers.smtp.username'),
            'from' => config('mail.from.address'),
        ]);

        Mail::to($feedbackRequest->customer->email)
            ->send(new FeedbackReminderMail($feedbackRequest));
    }

    public function sendDiagnosticEmail(string $to): void
    {
        Mail::raw('Brevo SMTP diagnostic email.', function ($message) use ($to) {
            $message->to($to)
                ->subject('Brevo SMTP Test');
        });
    }

    public function sendSms(string $to, string $message): array
    {
        Log::info('Brevo SMS send', [
            'to' => $to,
            'sender' => config('services.brevo.sms_sender'),
            'api_key_set' => !empty(config('services.brevo.api_key')),
        ]);

        return app(SmsService::class)->send($to, $message);
    }

    public function getAccountInfo(): array
    {
        $apiKey = $this->requireApiKey();

        $response = Http::withHeaders([
            'api-key' => $apiKey,
            'accept' => 'application/json',
        ])->get('https://api.brevo.com/v3/account');

        if (! $response->successful()) {
            Log::error('Brevo account info failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Brevo account info error: ' . $response->body());
        }

        return $response->json();
    }

    public function getSmsCredits(): array
    {
        $apiKey = $this->requireApiKey();

        $response = Http::withHeaders([
            'api-key' => $apiKey,
            'accept' => 'application/json',
        ])->get('https://api.brevo.com/v3/sms/credits');

        if (! $response->successful()) {
            Log::error('Brevo sms credits failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Brevo SMS credits error: ' . $response->body());
        }

        return $response->json();
    }

    private function requireApiKey(): string
    {
        $apiKey = config('services.brevo.api_key');
        if (empty($apiKey)) {
            throw new \RuntimeException('Brevo API key manquante (BREVO_API_KEY).');
        }

        return $apiKey;
    }
}
