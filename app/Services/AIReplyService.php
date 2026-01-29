<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIReplyService
{
    /**
     * Détecte la langue du feedback
     */
    public function detectLanguage(string $text): string
    {
        // Patterns simples pour détection rapide (avant appel API)
        $patterns = [
            'ar' => '/[\x{0600}-\x{06FF}]+/u', // Caractères arabes
            'zh' => '/[\x{4E00}-\x{9FFF}]+/u', // Caractères chinois
            'ja' => '/[\x{3040}-\x{30FF}]+/u', // Hiragana/Katakana
        ];

        foreach ($patterns as $lang => $pattern) {
            if (preg_match($pattern, $text)) {
                return $lang;
            }
        }

        // Utilise Gemini pour détection fine
        $apiKey = config('services.gemini.api_key');
        $model = config('services.gemini.model') ?? 'models/gemini-2.5-flash:generateContent';

        $url = 'https://generativelanguage.googleapis.com/v1beta/' . $model
            . '?key=' . urlencode($apiKey);

        $prompt = <<<PROMPT
Detect the language of the following text and respond with ONLY the ISO 639-1 language code (ar, fr, en, es, de, it, pt, ja, zh, etc.). 
No explanation, just the code.

Text:
"$text"
PROMPT;

        try {
            $response = Http::post($url, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
            ]);

            if ($response->successful()) {
                $lang = trim($response->json('candidates.0.content.parts.0.text'));
                // Valide que c'est un code à 2 caractères
                if (preg_match('/^[a-z]{2}$/', $lang)) {
                    return $lang;
                }
            }
        } catch (\Exception $e) {
            Log::warning('Language detection failed', ['error' => $e->getMessage()]);
        }

        return 'en';
    }

    /**
     * Génère une réponse IA multilingue
     */
    public function generateMultilingual(
        string $feedbackContent,
        ?int $rating = null,
        ?string $customerName = null,
        ?string $detectedLanguage = null,
        ?string $tone = 'professional',
        ?string $customInstructions = null
    ): array {
        // Détecte la langue si non fournie
        $language = $detectedLanguage ?? $this->detectLanguage($feedbackContent);

        $languageMap = [
            'ar' => ['name' => 'arabe', 'greeting' => 'السلام عليكم'],
            'fr' => ['name' => 'français', 'greeting' => 'Bonjour'],
            'en' => ['name' => 'anglais', 'greeting' => 'Hello'],
            'es' => ['name' => 'espagnol', 'greeting' => 'Hola'],
            'de' => ['name' => 'allemand', 'greeting' => 'Hallo'],
            'it' => ['name' => 'italien', 'greeting' => 'Ciao'],
            'pt' => ['name' => 'portugais', 'greeting' => 'Olá'],
            'ja' => ['name' => 'japonais', 'greeting' => 'こんにちは'],
            'zh' => ['name' => 'chinois', 'greeting' => '你好'],
        ];

        $langInfo = $languageMap[$language] ?? ['name' => 'anglais', 'greeting' => 'Hello'];
        $langName = $langInfo['name'];
        
        $customerLine = $customerName ? "Client: $customerName\n\n" : '';
        $contextLine = $customInstructions ? "Special instructions: $customInstructions\n\n" : '';
        $toneDesc = $tone === 'friendly' ? 'friendly and warm'
                  : ($tone === 'formal' ? 'formal and professional'
                  : 'professional and courteous');

        // Prompt en anglais pour clarté, mais la réponse doit être dans la langue cible
        $prompt = <<<PROMPT
You are a professional customer support representative for a SaaS application.

Customer feedback:
"{$feedbackContent}"

Rating: {$rating}/5
Tone: $toneDesc

==================================================
⚠️ CRITICAL INSTRUCTION ⚠️
YOUR RESPONSE MUST BE IN: $langName
DO NOT use any other language. ONLY use $langName.
Start with: {$langInfo['greeting']}
==================================================

Write a $toneDesc response in $langName only:
- Keep it short and concise (2-4 sentences)
- Acknowledge their feedback with empathy
- Adapt tone to rating (sympathetic if low, grateful if high)
- Use appropriate greetings and closings for $langName culture
- If customer name provided, address them

Your response in $langName:
PROMPT;

        $apiKey = config('services.gemini.api_key');
        $model = config('services.gemini.model') ?? 'models/gemini-2.5-flash:generateContent';

        $url = 'https://generativelanguage.googleapis.com/v1beta/' . $model
            . '?key=' . urlencode($apiKey);

        $response = Http::post($url, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt],
                    ],
                ],
            ],
        ]);

        if (!$response->successful()) {
            throw new \Exception('Erreur Gemini API : ' . $response->body());
        }

        $replyContent = trim($response->json('candidates.0.content.parts.0.text'));

        return [
            'content' => $replyContent,
            'language' => $language,
            'provider_response' => json_encode($response->json()),
        ];
    }

    /**
     * Backward compatibility - génère en français par défaut (ancien comportement)
     */
    public function generate(string $feedbackContent, ?int $rating = null, ?string $customerName = null, ?string $context = null): string
    {
        $result = $this->generateMultilingual(
            $feedbackContent,
            $rating,
            $customerName,
            'fr',
            'professional',
            $context
        );

        return $result['content'];
    }
}

