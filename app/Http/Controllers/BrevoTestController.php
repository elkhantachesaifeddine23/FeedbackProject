<?php

namespace App\Http\Controllers;

use App\Models\FeedbackRequest;
use App\Services\BrevoService;
use App\Services\CreditConsumptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BrevoTestController extends Controller
{
    public function config(BrevoService $brevo)
    {
        return response()->json($brevo->diagnose());
    }

    public function account(BrevoService $brevo)
    {
        return response()->json($brevo->getAccountInfo());
    }

    public function smsCredits(BrevoService $brevo, CreditConsumptionService $credits)
    {
        $company = Auth::user()->company;

        return response()->json([
            'brevo' => $brevo->getSmsCredits(),
            'app' => $company ? $credits->getSmsCredits($company) : null,
        ]);
    }

    public function testEmail(Request $request, BrevoService $brevo)
    {
        $to = $request->query('to') ?? Auth::user()->email;
        $brevo->sendDiagnosticEmail($to);

        return response()->json([
            'ok' => true,
            'to' => $to,
        ]);
    }

    public function testSms(Request $request, BrevoService $brevo)
    {
        $to = $request->query('to');
        if (! $to) {
            return response()->json(['error' => 'Paramètre "to" manquant'], 422);
        }

        $response = $brevo->sendSms($to, 'Brevo SMS test: votre intégration fonctionne ✅');

        return response()->json([
            'ok' => true,
            'response' => $response,
        ]);
    }

    public function testReminder(BrevoService $brevo)
    {
        $company = Auth::user()->company;
        $feedbackRequest = FeedbackRequest::where('company_id', $company->id)
            ->latest()
            ->first();

        if (! $feedbackRequest) {
            return response()->json(['error' => 'Aucune demande de feedback trouvée'], 422);
        }

        if ($feedbackRequest->channel === 'sms') {
            $phone = $feedbackRequest->customer?->phone ?? $feedbackRequest->recipient_phone;
            if (empty($phone)) {
                return response()->json(['error' => 'Aucun numéro disponible pour ce rappel'], 422);
            }

            $link = rtrim(config('app.url'), '/') . '/feedback/' . $feedbackRequest->token;
            $brevo->sendSms(
                $phone,
                "Rappel 👋\nMerci de donner votre avis : " . $link
            );
        } else {
            $brevo->sendReminderEmail($feedbackRequest);
        }

        return response()->json([
            'ok' => true,
            'feedback_request_id' => $feedbackRequest->id,
        ]);
    }
}
