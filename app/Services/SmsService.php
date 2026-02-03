<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SmsService
{
    public function send(string $to, string $message): array
    {
        $to = $this->normalizePhoneNumber($to);
        $apiKey = config('services.brevo.api_key');
        $sender = config('services.brevo.sms_sender');

        if (empty($apiKey) || empty($sender)) {
            throw new \RuntimeException('Brevo SMS config manquante (BREVO_API_KEY ou BREVO_SMS_SENDER).');
        }

        $response = Http::withHeaders([
            'api-key' => $apiKey,
            'accept' => 'application/json',
            'content-type' => 'application/json',
        ])->post('https://api.brevo.com/v3/transactionalSMS/sms', [
            'sender' => $sender,
            'recipient' => $to,
            'content' => $message,
            'type' => 'transactional',
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Brevo SMS error: ' . $response->body());
        }

        return [
            'messageId' => $response->json('messageId'),
            'status' => $response->status(),
            'response' => $response->json(),
        ];
    }

    private function normalizePhoneNumber(string $phone): string
    {
        $phone = trim($phone);

        if ($phone === '') {
            return $phone;
        }

        // Keep a leading + if present, remove all other non-digits.
        $normalized = preg_replace('/(?!^\+)[^\d]/', '', $phone) ?? $phone;

        // Collapse multiple leading + signs if any.
        $normalized = preg_replace('/^\++/', '+', $normalized) ?? $normalized;

        return $normalized;
    }
}
