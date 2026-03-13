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

        // 🔒 Sécurité : empêcher plusieurs feedbacks actifs
        $alreadySent = FeedbackRequest::where('customer_id', $data['customer_id'])
            ->where('company_id', $company->id)
            ->where('channel', $data['channel'])
            ->whereIn('status', ['pending', 'sent'])
            ->exists();

        if ($alreadySent) {
            Log::warning('FeedbackRequest already exists', [
                'customer_id' => $data['customer_id'],
                'company_id' => $company->id,
            ]);
            return back()->withErrors([
                'feedback' => 'Un feedback est déjà en attente pour ce client.'
            ]);
        }

        // ✅ Création de la demande (ne pas marquer "sent" avant l'envoi réel)
        $feedbackRequest = FeedbackRequest::create([
            'company_id'  => $company->id,
            'customer_id' => $data['customer_id'],
            'channel'     => $data['channel'],
            'token'       => Str::uuid(),
            'status'      => 'pending',
            'sent_at'     => null,
        ]);

        // 🔹 Log création
        Log::info('FeedbackRequest created', [
            'id' => $feedbackRequest->id,
            'status' => $feedbackRequest->status,
            'token' => $feedbackRequest->token,
        ]);

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
                ]);

                Log::info('Email sent successfully (Sync)', [
                    'to' => $feedbackRequest->customer->email,
                ]);
            } catch (\Throwable $e) {
                $feedbackRequest->update([
                    'status' => 'failed',
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
                    'provider' => 'brevo',
                    'provider_message_id' => $sms['messageId'] ?? null,
                    'provider_response' => json_encode($sms),
                ]);

            } catch (\Throwable $e) {
                $feedbackRequest->update([
                    'status' => 'failed',
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
            // 🔒 Vérifier si feedback déjà envoyé
            $alreadySent = FeedbackRequest::where('customer_id', $customerId)
                ->where('company_id', $company->id)
                ->where('channel', $data['channel'])
                ->whereIn('status', ['pending', 'sent'])
                ->exists();

            if ($alreadySent) {
                $skipCount++;
                Log::info('Skipping customer - feedback already exists', ['customer_id' => $customerId]);
                continue;
            }

            try {
                // ✅ Création de la demande
                $feedbackRequest = FeedbackRequest::create([
                    'company_id' => $company->id,
                    'customer_id' => $customerId,
                    'channel' => $data['channel'],
                    'token' => Str::uuid(),
                    'status' => 'pending',
                    'sent_at' => null,
                ]);

                // 📧 EMAIL
                if ($data['channel'] === 'email') {
                    try {
                        app(BrevoService::class)->sendFeedbackEmail($feedbackRequest);

                        $feedbackRequest->update([
                            'status' => 'sent',
                            'sent_at' => now(),
                        ]);
                        $successCount++;
                    } catch (\Throwable $e) {
                        $feedbackRequest->update([
                            'status' => 'failed',
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
                            'provider' => 'brevo',
                            'provider_message_id' => $sms['messageId'] ?? null,
                            'provider_response' => json_encode($sms),
                        ]);

                        $successCount++;
                    } catch (\Throwable $e) {
                        $feedbackRequest->update([
                            'status' => 'failed',
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
            $message .= ", $skipCount ignorées (déjà envoyées ou sans téléphone)";
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
            'customer_ids' => 'required|array|min:1',
            'customer_ids.*' => 'exists:customers,id',
            'channel' => 'required|in:sms,email,qr',
            'message' => 'required|string',
            'subject' => 'nullable|string',
        ]);

        $company = Auth::user()->company;
        $successCount = 0;
        $errorCount = 0;
        $errors = [];

        foreach ($data['customer_ids'] as $customerId) {
            try {
                $customer = \App\Models\Customer::findOrFail($customerId);

                // Vérifier que le client appartient à l'entreprise
                if ($customer->company_id !== $company->id) {
                    continue;
                }

                // Vérifier si un feedback est déjà en cours
                $alreadySent = FeedbackRequest::where('customer_id', $customerId)
                    ->where('company_id', $company->id)
                    ->where('channel', $data['channel'])
                    ->whereIn('status', ['pending', 'sent'])
                    ->exists();

                if ($alreadySent) {
                    continue;
                }

                // Créer la demande
                $feedbackRequest = FeedbackRequest::create([
                    'company_id' => $company->id,
                    'customer_id' => $customerId,
                    'channel' => $data['channel'],
                    'token' => \Illuminate\Support\Str::uuid(),
                    'status' => 'pending',
                    'sent_at' => null,
                ]);

                // Préparer les variables pour le template
                $link = $this->buildFeedbackLink($feedbackRequest, $request);
                $variables = [
                    'Nom' => $customer->name ?? 'Client',
                    'Nom de l\'entreprise' => $company->name,
                    'Votre lien' => $link,
                ];

                // Remplacer les variables dans le message
                $message = str_replace('{Votre lien}', '', $data['message']);
                foreach ($variables as $key => $value) {
                    $message = str_replace('{' . $key . '}', $value, $message);
                }
                $message = trim(preg_replace("/\n{3,}/", "\n\n", $message));

                // Envoyer selon le canal
                if ($data['channel'] === 'email') {
                    if (empty($customer->email)) {
                        $errorCount++;
                        $errors[] = "Client {$customer->name}: pas d'email";
                        continue;
                    }

                    try {
                        // Remplacer les variables dans le sujet
                        $subject = $data['subject'] ?? "Votre avis nous intéresse";
                        foreach ($variables as $key => $value) {
                            $subject = str_replace('{' . $key . '}', $value, $subject);
                        }

                        // Envoyer l'email en HTML avec bouton CTA
                        \Illuminate\Support\Facades\Mail::send('emails.feedback-request-custom', [
                            'customer' => $customer->name ?? 'Client',
                            'company' => $company->name,
                            'messageBody' => $message,
                            'link' => $link,
                        ], function ($mail) use ($customer, $subject) {
                            $mail->to($customer->email)
                                ->subject($subject);
                        });

                        $feedbackRequest->update([
                            'status' => 'sent',
                            'sent_at' => now(),
                        ]);

                        $successCount++;
                    } catch (\Throwable $e) {
                        $feedbackRequest->update(['status' => 'failed']);
                        $errorCount++;
                        $errors[] = "Email pour {$customer->email}: {$e->getMessage()}";
                    }
                } elseif ($data['channel'] === 'sms') {
                    if (empty($customer->phone)) {
                        $errorCount++;
                        $errors[] = "Client {$customer->name}: pas de téléphone";
                        continue;
                    }

                    try {
                        $sms = app(BrevoService::class)->sendSms($customer->phone, $message);

                        $feedbackRequest->update([
                            'status' => 'sent',
                            'sent_at' => now(),
                            'provider' => 'brevo',
                            'provider_message_id' => $sms['messageId'] ?? null,
                            'provider_response' => json_encode($sms),
                        ]);

                        $successCount++;
                    } catch (\Throwable $e) {
                        $feedbackRequest->update(['status' => 'failed']);
                        $errorCount++;
                        $errors[] = "SMS pour {$customer->phone}: {$e->getMessage()}";
                    }
                } elseif ($data['channel'] === 'qr') {
                    // Pour QR, on marque juste comme créé
                    $feedbackRequest->update([
                        'status' => 'sent',
                        'sent_at' => now(),
                    ]);
                    $successCount++;
                }
            } catch (\Throwable $e) {
                $errorCount++;
                $errors[] = "Client ID {$customerId}: {$e->getMessage()}";
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