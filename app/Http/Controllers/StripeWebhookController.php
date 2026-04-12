<?php

namespace App\Http\Controllers;

use App\Services\StripeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StripeWebhookController extends Controller
{
    public function __construct(private StripeService $stripe) {}

    public function handle(Request $request)
    {
        $payload   = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        if (!$sigHeader) {
            Log::warning('Stripe webhook: missing Stripe-Signature header');
            return response('Missing signature', 400);
        }

        try {
            $event = $this->stripe->constructWebhookEvent($payload, $sigHeader);
        } catch (\UnexpectedValueException $e) {
            Log::error('Stripe webhook: invalid payload', ['error' => $e->getMessage()]);
            return response('Invalid payload', 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            Log::error('Stripe webhook: invalid signature', ['error' => $e->getMessage()]);
            return response('Invalid signature', 400);
        }

        Log::info('Stripe webhook received', ['type' => $event->type]);

        try {
            match ($event->type) {
                'checkout.session.completed'       => $this->stripe->handleCheckoutCompleted($event),
                'invoice.paid'                     => $this->stripe->handleInvoicePaid($event),
                'customer.subscription.updated'    => $this->stripe->handleSubscriptionUpdated($event),
                'customer.subscription.deleted'    => $this->stripe->handleSubscriptionDeleted($event),
                default => Log::info('Stripe webhook unhandled', ['type' => $event->type]),
            };
        } catch (\Throwable $e) {
            Log::error('Stripe webhook handler failure', [
                'type' => $event->type,
                'error' => $e->getMessage(),
            ]);

            return response('Webhook handler error', 500);
        }

        return response('OK', 200);
    }
}
