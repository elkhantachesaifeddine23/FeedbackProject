<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

/**
 * Wrapper pour AIReplyService avec fallback et rate limiting
 * Assure la stabilité même si Gemini API est down
 */
class GeminiGateway
{
    private AIReplyService $aiService;

    public function __construct(AIReplyService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Génère une réponse IA avec fallback automatique
     * 
     * @return array ['content' => string, 'language' => string, 'is_fallback' => bool]
     */
    public function generateWithFallback(
        string $feedbackContent,
        ?int $rating = null,
        ?string $customerName = null,
        ?string $detectedLanguage = null,
        ?string $tone = 'professional',
        ?string $customInstructions = null
    ): array {
        $user = Auth::user();
        $companyId = $user?->company_id ?? 'unknown';
        
        // Vérifier le rate limit (100 appels par minute par company)
        $limited = RateLimiter::attempt(
            "gemini-company-{$companyId}",
            100,
            function () {
                return false; // Pas encore limité
            },
            60 // 60 secondes
        );

        if (!$limited) {
            Log::warning('Gemini rate limit exceeded', ['company_id' => $companyId]);
            return $this->getFallbackResponse($feedbackContent, $rating, $customerName, $detectedLanguage);
        }

        try {
            // Vérifier si Gemini API est en panne (simple health check via cache)
            if (Cache::get('gemini_api_down', false)) {
                Log::info('Using cached Gemini API down status', ['company_id' => $companyId]);
                return $this->getFallbackResponse($feedbackContent, $rating, $customerName, $detectedLanguage);
            }

            // Appeler Gemini
            $result = $this->aiService->generateMultilingual(
                $feedbackContent,
                $rating,
                $customerName,
                $detectedLanguage,
                $tone,
                $customInstructions
            );

            // Succès : reset le flag "API down"
            Cache::forget('gemini_api_down');

            return array_merge($result, ['is_fallback' => false]);

        } catch (\Exception $e) {
            Log::error('Gemini API call failed', [
                'company_id' => $companyId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Marquer l'API comme down pendant 5 minutes
            Cache::put('gemini_api_down', true, now()->addMinutes(5));

            // Retourner une réponse fallback élégante
            return $this->getFallbackResponse($feedbackContent, $rating, $customerName, $detectedLanguage);
        }
    }

    /**
     * Réponses fallback adaptées au rating
     */
    private function getFallbackResponse(
        string $feedbackContent,
        ?int $rating = null,
        ?string $customerName = null,
        ?string $language = null
    ): array {
        $language = $language ?? 'fr';
        $greeting = $this->getGreeting($language);
        $name = $customerName ? ", {$customerName}" : '';

        // Réponses fallback adaptées à la langue et au rating
        $responses = [
            'fr' => [
                5 => "Merci beaucoup{$name} pour ce retour positif ! Votre satisfaction est notre priorité absolue. Nous apprécions vraiment votre confiance.",
                4 => "Merci{$name} pour votre retour ! Nous sommes ravis que vous ayez apprécié. Nous continuons à nous améliorer.",
                3 => "Merci{$name} pour votre feedback. Nous l'avons bien noté et nous l'utiliserons pour améliorer notre service.",
                2 => "Merci{$name} d'avoir partagé vos préoccupations. Nous prenons votre retour au sérieux et allons y remédier rapidement.",
                1 => "Nous regrettons sincèrement cette expérience{$name}. Votre satisfaction est importante pour nous. Nous nous engageons à résoudre ce problème.",
                'default' => "Merci{$name} pour votre feedback. Nous l'avons reçu et nous l'étudierons attentivement.",
            ],
            'en' => [
                5 => "Thank you so much{$name} for this positive feedback! Your satisfaction is our top priority.",
                4 => "Thank you{$name} for your feedback! We're glad you enjoyed. We continue to improve.",
                3 => "Thank you{$name} for your feedback. We've noted it and will use it to improve our service.",
                2 => "Thank you{$name} for sharing your concerns. We take your feedback seriously and will address it quickly.",
                1 => "We sincerely regret this experience{$name}. Your satisfaction is important to us. We are committed to resolving this.",
                'default' => "Thank you{$name} for your feedback. We have received it and will study it carefully.",
            ],
            'es' => [
                5 => "¡Muchas gracias{$name} por este feedback positivo! Tu satisfacción es nuestra máxima prioridad.",
                4 => "Gracias{$name} por tu feedback. Nos alegra que te haya gustado. Seguimos mejorando.",
                3 => "Gracias{$name} por tu feedback. Lo hemos anotado y lo usaremos para mejorar nuestro servicio.",
                2 => "Gracias{$name} por compartir tus preocupaciones. Tomamos tu feedback muy en serio y lo resolveremos rápidamente.",
                1 => "Lamentamos sinceramente esta experiencia{$name}. Tu satisfacción es importante para nosotros.",
                'default' => "Gracias{$name} por tu feedback. Lo hemos recibido y lo estudiaremos cuidadosamente.",
            ],
            'ar' => [
                5 => "شكراً جزيلاً{$name} على هذا التعليق الإيجابي! رضاك هو أولويتنا الأولى.",
                4 => "شكراً{$name} على تعليقك! نحن سعداء بأنك استمتعت. نستمر في التحسن.",
                3 => "شكراً{$name} على تعليقك. لقد أخذناها في الاعتبار وسنستخدمها لتحسين خدمتنا.",
                2 => "شكراً{$name} على مشاركة مخاوفك. نأخذ تعليقك على محمل الجد وسنعالجه بسرعة.",
                1 => "نأسف بشدة على هذه التجربة{$name}. رضاك مهم لنا ونحن ملتزمون بحل هذا.",
                'default' => "شكراً{$name} على تعليقك. تلقيناه وسندرسه بعناية.",
            ],
        ];

        $langResponses = $responses[$language] ?? $responses['en'];
        $response = $langResponses[$rating] ?? $langResponses['default'];

        return [
            'content' => $response,
            'language' => $language,
            'is_fallback' => true,
        ];
    }

    /**
     * Get language-specific greeting
     */
    private function getGreeting(string $language): string
    {
        $greetings = [
            'ar' => 'السلام عليكم',
            'fr' => 'Bonjour',
            'en' => 'Hello',
            'es' => 'Hola',
            'de' => 'Hallo',
            'it' => 'Ciao',
            'pt' => 'Olá',
            'ja' => 'こんにちは',
            'zh' => '你好',
        ];

        return $greetings[$language] ?? 'Hello';
    }
}
