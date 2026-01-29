<?php

namespace App\Http\Controllers;

use App\Models\FeedbackRequest;
use App\Jobs\GenerateAIReplyJob;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use App\Mail\FeedbackRequestMail;
use App\Services\SmsService;
use App\Services\AIReplyService;
use Illuminate\Support\Facades\Log;

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

        // ✅ Création de la demande
        $feedbackRequest = FeedbackRequest::create([
            'company_id'  => $company->id,
            'customer_id' => $data['customer_id'],
            'channel'     => $data['channel'],
            'token'       => Str::uuid(),
            'status'      => 'sent',
            'sent_at'     => now(),
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
                // Utilisation de send() au lieu de queue() pour passer outre le Worker
                Mail::to($feedbackRequest->customer->email)
                    ->send(new FeedbackRequestMail($feedbackRequest));

                Log::info('Email sent successfully (Sync)', [
                    'to' => $feedbackRequest->customer->email,
                ]);
            } catch (\Throwable $e) {
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
                $link = rtrim(config('app.url'), '/') . '/feedback/' . $feedbackRequest->token;

                $sms = app(SmsService::class)->send(
                    $feedbackRequest->customer->phone,
                    "Bonjour 👋\nMerci de donner votre avis : " . $link
                );


                Log::info('Twilio response', $sms);

                // 📦 Tracking provider
                $feedbackRequest->update([
                    'provider'             => 'twilio',
                    'provider_message_id'  => $sms['sid'] ?? null,
                    'provider_response'    => json_encode($sms),
                ]);

            } catch (\Throwable $e) {
                Log::error('Twilio SMS FAILED', [
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
                    'status' => 'sent',
                    'sent_at' => now(),
                ]);

                // 📧 EMAIL
                if ($data['channel'] === 'email') {
                    try {
                        Mail::to($feedbackRequest->customer->email)
                            ->queue(new FeedbackRequestMail($feedbackRequest));
                        $successCount++;
                    } catch (\Throwable $e) {
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
                        $link = rtrim(config('app.url'), '/') . '/feedback/' . $feedbackRequest->token;
                        $sms = app(SmsService::class)->send(
                            $feedbackRequest->customer->phone,
                            "Bonjour 👋\nMerci de donner votre avis : " . $link
                        );

                        $feedbackRequest->update([
                            'provider' => 'twilio',
                            'provider_message_id' => $sms['sid'] ?? null,
                            'provider_response' => json_encode($sms),
                        ]);

                        $successCount++;
                    } catch (\Throwable $e) {
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
    }}