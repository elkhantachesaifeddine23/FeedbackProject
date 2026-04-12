<?php

namespace App\Http\Controllers;

use App\Models\FeedbackRequest;
use App\Jobs\GenerateAIReplyJob;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use App\Mail\FeedbackRequestMail;
use App\Services\BrevoService;
use App\Services\AIReplyService;
use App\Services\QuotaService;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class FeedbackRequestController extends Controller
{
    /**
     * Envoyer une demande de feedback (Email ou SMS)
     */
    public function store(Request $request)
    {
        // 🔹 Log de l'arrivée de la requête
        Log::info('FeedbackRequest.store called', [
            'user_id' => Auth::id(),
            'company_id' => Auth::user()->company->id ?? null,
            'payload' => $request->all(),
        ]);

        // ✅ Validation
        $data = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'channel'     => 'required|in:email,sms',
        ]);

        // 🔹 Log après validation
        Log::info('FeedbackRequest validated', $data);

        $company = Auth::user()->company;

        // 🔁 Réutiliser la demande active si elle existe déjà (renvoi manuel)
        $existingRequest = FeedbackRequest::where('customer_id', $data['customer_id'])
            ->where('company_id', $company->id)
            ->where('channel', $data['channel'])
            ->whereIn('status', ['pending', 'sent'])
            ->latest('id')
            ->first();

        // ✅ Création de la demande si aucune active
        $feedbackRequest = $existingRequest ?? FeedbackRequest::create([
            'company_id'  => $company->id,
            'customer_id' => $data['customer_id'],
            'channel'     => $data['channel'],
            'token'       => Str::uuid(),
            'status'      => 'pending',
            'sent_at'     => null,
        ]);

        if ($existingRequest) {
            Log::info('FeedbackRequest manual resend on active request', [
                'id' => $existingRequest->id,
                'customer_id' => $data['customer_id'],
                'company_id' => $company->id,
            ]);
        }

        // 🔹 Log création
        Log::info('FeedbackRequest created', [
            'id' => $feedbackRequest->id,
            'status' => $feedbackRequest->status,
            'token' => $feedbackRequest->token,
        ]);

        /**
         * ==========================
         * QUOTA CHECK
         * ==========================
         */
        $quotaService = app(QuotaService::class);

        if ($data['channel'] === 'email' && !$quotaService->canSendEmail($company)) {
            return back()->withErrors([
                'quota' => 'Vous avez atteint la limite d\'emails de votre plan. Passez à un plan supérieur pour continuer.'
            ]);
        }

        if ($data['channel'] === 'sms') {
            if (!$company->hasFeature('sms')) {
                return back()->withErrors([
                    'plan' => 'L\'envoi SMS nécessite un plan Basic ou supérieur.'
                ]);
            }

            $phone = $feedbackRequest->customer->phone ?? '';
            if (!$quotaService->canSendSms($company, $phone)) {
                return back()->withErrors([
                    'quota' => 'Solde SMS insuffisant. Achetez un pack SMS ou passez à un plan supérieur.'
                ]);
            }
        }

        /**
         * ==========================
         * EMAIL
         * ==========================
         */
        if ($data['channel'] === 'email') {
            Log::info('Email flow triggered', [
                'to' => $feedbackRequest->customer->email,
            ]);

            try {
                app(BrevoService::class)->sendFeedbackEmail($feedbackRequest);

                $feedbackRequest->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                    'reminder_count' => 0,
                    'last_reminder_at' => null,
                    'next_reminder_at' => now()->addDay(),
                ]);

                // Track email usage
                $quotaService->recordEmailSent($company);

                Log::info('Email sent successfully (Sync)', [
                    'to' => $feedbackRequest->customer->email,
                ]);
            } catch (\Throwable $e) {
                $feedbackRequest->update([
                    'status' => 'failed',
                    'next_reminder_at' => null,
                ]);

                Log::error('Email failed', [
                    'to' => $feedbackRequest->customer->email,
                    'error' => $e->getMessage(),
                ]);

                return back()->withErrors([
                    'email' => 'Erreur lors de l’envoi de l’email : ' . $e->getMessage()
                ]);
            }
        }

        /**
         * ==========================
         * SMS
         * ==========================
         */
        if ($data['channel'] === 'sms') {
            // 🔐 Validation du numéro
            if (empty($feedbackRequest->customer->phone)) {
                Log::warning('Customer phone missing', [
                    'customer_id' => $feedbackRequest->customer_id,
                ]);

                return back()->withErrors([
                    'phone' => 'Le client ne possède pas de numéro de téléphone.'
                ]);
            }

            Log::info('SMS flow triggered', [
                'customer_id' => $feedbackRequest->customer_id,
                'phone' => $feedbackRequest->customer->phone,
            ]);

            try {
                $link = $this->buildFeedbackLink($feedbackRequest, $request);

                $sms = app(BrevoService::class)->sendSms(
                    $feedbackRequest->customer->phone,
                    "Bonjour 👋\nMerci de donner votre avis : " . $link
                );


                Log::info('Brevo response', $sms);

                // 📦 Tracking provider
                $feedbackRequest->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                    'reminder_count' => 0,
                    'last_reminder_at' => null,
                    'next_reminder_at' => now()->addDay(),
                    'provider' => 'brevo',
                    'provider_message_id' => $sms['messageId'] ?? null,
                    'provider_response' => json_encode($sms),
                ]);

                // 📊 Deduct SMS units
                $quotaService->deductSmsUnits($company, $feedbackRequest->customer->phone, $feedbackRequest->id);

            } catch (\Throwable $e) {
                $feedbackRequest->update([
                    'status' => 'failed',
                    'next_reminder_at' => null,
                ]);

                Log::error('Brevo SMS FAILED', [
                    'to' => $feedbackRequest->customer->phone,
                    'error' => $e->getMessage(),
                ]);

                return back()->withErrors([
                    'sms' => 'Erreur lors de l’envoi du SMS : ' . $e->getMessage()
                ]);
            }
        }

        Log::info('FeedbackRequest flow completed successfully', [
            'id' => $feedbackRequest->id,
            'channel' => $data['channel'],
        ]);

        // 🚀 NOUVEAU: Lance le Job de génération de réponse IA
        // Cela va:
        // 1. Détecter la langue du feedback quand il arrive
        // 2. Générer une réponse en cette langue
        // 3. Escalader automatiquement si note basse
        // Note: Le feedback_text sera rempli quand le client répond
        // Pour l'instant, on peut déclencher le job après réception du feedback
        // dispatch(new GenerateAIReplyJob($feedbackRequest, 4)); // À déclencher après réception

        return back()->with('success', 'Demande de feedback envoyée avec succès');
    }

    /**
     * Envoyer des demandes de feedback en masse
     */
    public function storeBulk(Request $request)
    {
        Log::info('FeedbackRequest.storeBulk called', [
            'user_id' => Auth::id(),
            'company_id' => Auth::user()->company->id ?? null,
            'payload' => $request->all(),
        ]);

        // ✅ Validation
        $data = $request->validate([
            'customer_ids' => 'required|array|min:1',
            'customer_ids.*' => 'exists:customers,id',
            'channel' => 'required|in:email,sms',
        ]);

        $company = Auth::user()->company;
        $successCount = 0;
        $skipCount = 0;
        $errorCount = 0;
        $errors = [];

        foreach ($data['customer_ids'] as $customerId) {
            // 🔁 Réutiliser une demande active pour renvoi manuel
            $existingRequest = FeedbackRequest::where('customer_id', $customerId)
                ->where('company_id', $company->id)
                ->where('channel', $data['channel'])
                ->whereIn('status', ['pending', 'sent'])
                ->latest('id')
                ->first();

            try {
                // ✅ Création de la demande
                $feedbackRequest = $existingRequest ?? FeedbackRequest::create([
                    'company_id' => $company->id,
                    'customer_id' => $customerId,
                    'channel' => $data['channel'],
                    'token' => Str::uuid(),
                    'status' => 'pending',
                    'sent_at' => null,
                ]);

                if ($existingRequest) {
                    Log::info('Bulk manual resend on active request', [
                        'feedback_request_id' => $existingRequest->id,
                        'customer_id' => $customerId,
                    ]);
                }

                // 📧 EMAIL
                if ($data['channel'] === 'email') {
                    try {
                        app(BrevoService::class)->sendFeedbackEmail($feedbackRequest);

                        $feedbackRequest->update([
                            'status' => 'sent',
                            'sent_at' => now(),
                            'reminder_count' => 0,
                            'last_reminder_at' => null,
                            'next_reminder_at' => now()->addDay(),
                        ]);
                        $successCount++;
                    } catch (\Throwable $e) {
                        $feedbackRequest->update([
                            'status' => 'failed',
                            'next_reminder_at' => null,
                        ]);

                        $errorCount++;
                        $errors[] = "Email pour {$feedbackRequest->customer->email}: {$e->getMessage()}";
                        Log::error('Bulk email failed', [
                            'customer_id' => $customerId,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                // 📱 SMS
                if ($data['channel'] === 'sms') {
                    if (empty($feedbackRequest->customer->phone)) {
                        $skipCount++;
                        Log::warning('Customer phone missing', ['customer_id' => $customerId]);
                        continue;
                    }

                    try {
                        $link = $this->buildFeedbackLink($feedbackRequest, $request);
                        $sms = app(BrevoService::class)->sendSms(
                            $feedbackRequest->customer->phone,
                            "Bonjour 👋\nMerci de donner votre avis : " . $link
                        );

                        $feedbackRequest->update([
                            'status' => 'sent',
                            'sent_at' => now(),
                            'reminder_count' => 0,
                            'last_reminder_at' => null,
                            'next_reminder_at' => now()->addDay(),
                            'provider' => 'brevo',
                            'provider_message_id' => $sms['messageId'] ?? null,
                            'provider_response' => json_encode($sms),
                        ]);

                        $successCount++;
                    } catch (\Throwable $e) {
                        $feedbackRequest->update([
                            'status' => 'failed',
                            'next_reminder_at' => null,
                        ]);

                        $errorCount++;
                        $errors[] = "SMS pour {$feedbackRequest->customer->phone}: {$e->getMessage()}";
                        Log::error('Bulk SMS failed', [
                            'customer_id' => $customerId,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                $errorCount++;
                $errors[] = "Client ID {$customerId}: {$e->getMessage()}";
                Log::error('Bulk feedback request creation failed', [
                    'customer_id' => $customerId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('FeedbackRequest.storeBulk completed', [
            'success' => $successCount,
            'skipped' => $skipCount,
            'errors' => $errorCount,
        ]);

        $message = "$successCount demandes envoyées avec succès";
        if ($skipCount > 0) {
            $message .= ", $skipCount ignorées (sans téléphone)";
        }
        if ($errorCount > 0) {
            $message .= ", $errorCount erreurs";
        }

        if ($errorCount > 0 && count($errors) > 0) {
            return back()->with('success', $message)->withErrors(['bulk_errors' => $errors]);
        }

        return back()->with('success', $message);
    }

    /**
     * Générer un QR code pour une demande de feedback
     */
    public function qrCode(FeedbackRequest $feedbackRequest)
    {
        // Vérifier que l'utilisateur a accès à cette demande
        if ($feedbackRequest->company_id !== Auth::user()->company->id) {
            abort(403, 'Accès non autorisé');
        }

        // Générer l'URL du formulaire de feedback
        $url = route('feedback.show', ['token' => $feedbackRequest->token]);

        // Créer le QR code (v6 utilise readonly class avec constructeur)
        $qrCode = new \Endroid\QrCode\QrCode(
            data: $url,
            size: 300,
            margin: 10
        );

        $writer = new \Endroid\QrCode\Writer\SvgWriter();
        $result = $writer->write($qrCode);

        // Retourner l'image
        return response($result->getString())
            ->header('Content-Type', $result->getMimeType());
    }

    /**
     * Page d'envoi de feedbacks avec templates
     */
    public function sendPage()
    {
        $company = Auth::user()->company;

        $customers = \App\Models\Customer::where('company_id', $company->id)
            ->with(['feedbackRequests' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('FeedbackRequests/Send', [
            'customers' => $customers,
            'companyName' => $company->name,
        ]);
    }

    /**
     * Envoyer des feedbacks avec template personnalisé
     */
    public function sendWithTemplate(Request $request)
    {
        $data = $request->validate([
            'customer_ids' => 'nullable|array|max:50',
            'customer_ids.*' => 'exists:customers,id',
            'recipients' => 'nullable|array|max:50',
            'recipients.*.name' => 'nullable|string|max:255',
            'recipients.*.email' => 'nullable|email|max:255',
            'recipients.*.phone' => 'nullable|string|max:30',
            'consent_confirmed' => 'nullable|boolean',
            'channel' => 'required|in:sms,email,qr',
            'message' => 'required|string',
            'subject' => 'nullable|string',
        ]);

        $customerIds = array_values($data['customer_ids'] ?? []);
        $recipients = array_values($data['recipients'] ?? []);
        $totalCount = count($customerIds) + count($recipients);

        if (empty($customerIds) && empty($recipients)) {
            return back()->withErrors([
                'send' => 'Ajoutez au moins un client enregistré ou un contact rapide.',
            ]);
        }

        if ($totalCount > 50) {
            return back()->withErrors([
                'send' => 'Maximum 50 contacts par envoi. Vous en avez sélectionné ' . $totalCount . '.',
            ]);
        }

        if (! empty($recipients) && ! ($data['consent_confirmed'] ?? false)) {
            return back()->withErrors([
                'consent_confirmed' => 'Vous devez confirmer l’autorisation d’envoi pour les contacts rapides.',
            ]);
        }

        $company = Auth::user()->company;
        $successCount = 0;
        $errorCount = 0;
        $errors = [];

        foreach ($customerIds as $customerId) {
            try {
                $customer = \App\Models\Customer::findOrFail($customerId);

                if ($customer->company_id !== $company->id) {
                    continue;
                }

                $feedbackRequest = $this->findOrCreateRequestForSavedCustomer(
                    companyId: $company->id,
                    customerId: (int) $customerId,
                    channel: $data['channel']
                );

                $result = $this->sendTemplatedFeedback(
                    feedbackRequest: $feedbackRequest,
                    channel: $data['channel'],
                    messageTemplate: $data['message'],
                    subjectTemplate: $data['subject'] ?? null,
                    displayName: $customer->name ?? 'Client',
                    email: $customer->email,
                    phone: $customer->phone,
                    companyName: $company->name,
                    request: $request
                );

                if ($result['ok']) {
                    $successCount++;
                } else {
                    $errorCount++;
                    $errors[] = $result['error'];
                }
            } catch (\Throwable $e) {
                $errorCount++;
                $errors[] = "Client ID {$customerId}: {$e->getMessage()}";
            }
        }

        foreach ($recipients as $recipient) {
            try {
                $displayName = trim((string) ($recipient['name'] ?? '')) ?: 'Client';
                $email = isset($recipient['email']) ? strtolower(trim((string) $recipient['email'])) : null;
                $phone = isset($recipient['phone']) ? trim((string) $recipient['phone']) : null;

                if ($data['channel'] === 'email' && empty($email)) {
                    $errorCount++;
                    $errors[] = "Contact {$displayName}: email manquant";
                    continue;
                }

                if ($data['channel'] === 'sms' && empty($phone)) {
                    $errorCount++;
                    $errors[] = "Contact {$displayName}: numéro manquant";
                    continue;
                }

                if ($data['channel'] === 'qr') {
                    $errorCount++;
                    $errors[] = "Contact {$displayName}: le canal QR est réservé aux clients enregistrés";
                    continue;
                }

                $feedbackRequest = $this->findOrCreateRequestForQuickRecipient(
                    companyId: $company->id,
                    channel: $data['channel'],
                    displayName: $displayName,
                    email: $email,
                    phone: $phone
                );

                $result = $this->sendTemplatedFeedback(
                    feedbackRequest: $feedbackRequest,
                    channel: $data['channel'],
                    messageTemplate: $data['message'],
                    subjectTemplate: $data['subject'] ?? null,
                    displayName: $displayName,
                    email: $email,
                    phone: $phone,
                    companyName: $company->name,
                    request: $request,
                    consentSource: 'quick_send'
                );

                if ($result['ok']) {
                    $successCount++;
                } else {
                    $errorCount++;
                    $errors[] = $result['error'];
                }
            } catch (\Throwable $e) {
                $errorCount++;
                $errors[] = 'Contact rapide: ' . $e->getMessage();
            }
        }

        $message = "$successCount demandes envoyées avec succès";
        if ($errorCount > 0) {
            $message .= ", $errorCount erreurs";
        }

        if ($errorCount > 0 && count($errors) > 0) {
            return back()->with('success', $message)->withErrors(['send_errors' => $errors]);
        }

        return back()->with('success', $message);
    }

    private function sendTemplatedFeedback(
        FeedbackRequest $feedbackRequest,
        string $channel,
        string $messageTemplate,
        ?string $subjectTemplate,
        string $displayName,
        ?string $email,
        ?string $phone,
        string $companyName,
        Request $request,
        ?string $consentSource = null
    ): array {
        $link = $this->buildFeedbackLink($feedbackRequest, $request);
        $company = $feedbackRequest->company;
        $quotaService = app(QuotaService::class);
        $variables = [
            'Nom' => $displayName,
            'Nom de l\'entreprise' => $companyName,
            'Votre lien' => $link,
        ];

        $message = str_replace('{Votre lien}', '', $messageTemplate);
        foreach ($variables as $key => $value) {
            $message = str_replace('{' . $key . '}', $value, $message);
        }
        $message = trim(preg_replace("/\n{3,}/", "\n\n", $message));

        if ($channel === 'email') {
            if (empty($email)) {
                return ['ok' => false, 'error' => "Contact {$displayName}: email manquant"];
            }

            // Check email quota
            if (!$quotaService->canSendEmail($company)) {
                return ['ok' => false, 'error' => "Limite d'emails atteinte pour votre plan"];
            }

            try {
                $subject = $subjectTemplate ?: 'Votre avis nous intéresse';
                foreach ($variables as $key => $value) {
                    $subject = str_replace('{' . $key . '}', $value, $subject);
                }

                \Illuminate\Support\Facades\Mail::send('emails.feedback-request-custom', [
                    'customer' => $displayName,
                    'company' => $companyName,
                    'messageBody' => $message,
                    'link' => $link,
                ], function ($mail) use ($email, $subject, $companyName, $request) {
                    $platformFromAddress = (string) config('mail.from.address');
                    $platformFromName = (string) config('mail.from.name', 'Luminea');
                    $fromName = $companyName ?: $platformFromName;

                    $mail->to($email)
                        ->subject($subject);

                    if (!empty($platformFromAddress)) {
                        $mail->from($platformFromAddress, $fromName);
                    }

                    $replyToEmail = $request->user()?->email;
                    $replyToName = $companyName ?: ($request->user()?->name ?? $platformFromName);
                    if (!empty($replyToEmail)) {
                        $mail->replyTo($replyToEmail, $replyToName);
                    }
                });

                $feedbackRequest->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                    'reminder_count' => 0,
                    'last_reminder_at' => null,
                    'next_reminder_at' => now()->addDay(),
                    'recipient_name' => $displayName,
                    'recipient_email' => $email,
                    'recipient_phone' => $phone,
                    'consent_at' => $consentSource ? now() : $feedbackRequest->consent_at,
                    'consent_source' => $consentSource ?? $feedbackRequest->consent_source,
                ]);

                // Track email usage
                $quotaService->recordEmailSent($company);

                return ['ok' => true];
            } catch (\Throwable $e) {
                $feedbackRequest->update([
                    'status' => 'failed',
                    'next_reminder_at' => null,
                ]);

                return ['ok' => false, 'error' => "Email pour {$email}: {$e->getMessage()}"];
            }
        }

        if ($channel === 'sms') {
            if (empty($phone)) {
                return ['ok' => false, 'error' => "Contact {$displayName}: numéro manquant"];
            }

            // Check SMS feature + quota
            if (!$company->hasFeature('sms')) {
                return ['ok' => false, 'error' => "L'envoi SMS nécessite un plan Basic ou supérieur"];
            }
            if (!$quotaService->canSendSms($company, $phone)) {
                return ['ok' => false, 'error' => "Solde SMS insuffisant pour {$displayName}"];
            }

            try {
                $sms = app(BrevoService::class)->sendSms($phone, $message);

                $feedbackRequest->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                    'reminder_count' => 0,
                    'last_reminder_at' => null,
                    'next_reminder_at' => now()->addDay(),
                    'recipient_name' => $displayName,
                    'recipient_email' => $email,
                    'recipient_phone' => $phone,
                    'consent_at' => $consentSource ? now() : $feedbackRequest->consent_at,
                    'consent_source' => $consentSource ?? $feedbackRequest->consent_source,
                    'provider' => 'brevo',
                    'provider_message_id' => $sms['messageId'] ?? null,
                    'provider_response' => json_encode($sms),
                ]);

                // Deduct SMS units
                $quotaService->deductSmsUnits($company, $phone, $feedbackRequest->id);

                return ['ok' => true];
            } catch (\Throwable $e) {
                $feedbackRequest->update([
                    'status' => 'failed',
                    'next_reminder_at' => null,
                ]);

                return ['ok' => false, 'error' => "SMS pour {$phone}: {$e->getMessage()}"];
            }
        }

        $feedbackRequest->update([
            'status' => 'sent',
            'sent_at' => now(),
            'next_reminder_at' => null,
        ]);

        return ['ok' => true];
    }

    private function findOrCreateRequestForSavedCustomer(int $companyId, int $customerId, string $channel): FeedbackRequest
    {
        $existing = FeedbackRequest::where('customer_id', $customerId)
            ->where('company_id', $companyId)
            ->where('channel', $channel)
            ->whereIn('status', ['pending', 'sent'])
            ->latest('id')
            ->first();

        if ($existing) {
            return $existing;
        }

        return FeedbackRequest::create([
            'company_id' => $companyId,
            'customer_id' => $customerId,
            'channel' => $channel,
            'token' => (string) Str::uuid(),
            'status' => 'pending',
            'sent_at' => null,
        ]);
    }

    private function findOrCreateRequestForQuickRecipient(
        int $companyId,
        string $channel,
        string $displayName,
        ?string $email,
        ?string $phone
    ): FeedbackRequest {
        $hash = $this->computeRecipientHash($channel, $email, $phone);

        $existing = FeedbackRequest::whereNull('customer_id')
            ->where('company_id', $companyId)
            ->where('channel', $channel)
            ->where('recipient_hash', $hash)
            ->whereIn('status', ['pending', 'sent'])
            ->latest('id')
            ->first();

        if ($existing) {
            return $existing;
        }

        return FeedbackRequest::create([
            'company_id' => $companyId,
            'customer_id' => null,
            'channel' => $channel,
            'token' => (string) Str::uuid(),
            'status' => 'pending',
            'sent_at' => null,
            'recipient_name' => $displayName,
            'recipient_email' => $email,
            'recipient_phone' => $phone,
            'recipient_hash' => $hash,
        ]);
    }

    private function computeRecipientHash(string $channel, ?string $email, ?string $phone): string
    {
        $normalizedEmail = strtolower(trim((string) $email));
        $normalizedPhone = preg_replace('/\s+/', '', trim((string) $phone));

        return hash('sha256', implode('|', [
            $channel,
            $normalizedEmail,
            $normalizedPhone,
        ]));
    }

    private function buildFeedbackLink(FeedbackRequest $feedbackRequest, ?Request $request = null): string
    {
        $url = route('feedback.show', ['token' => $feedbackRequest->token], true);

        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            return $url;
        }

        $baseUrl = rtrim((string) config('app.url', ''), '/');
        if ($baseUrl !== '') {
            return $baseUrl . '/feedback/' . $feedbackRequest->token;
        }

        if ($request) {
            return rtrim($request->getSchemeAndHttpHost(), '/') . '/feedback/' . $feedbackRequest->token;
        }

        return '/feedback/' . $feedbackRequest->token;
    }
}