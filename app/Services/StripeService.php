<?php

namespace App\Services;

use App\Models\Company;
use App\Models\SmsAddonPurchase;
use App\Models\SmsUsageLog;
use App\Models\Subscription;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Customer as StripeCustomer;
use Stripe\Webhook;
use Stripe\BillingPortal\Session as PortalSession;

class StripeService
{
    public function __construct()
    {
        Stripe::setApiKey(config('billing.stripe.secret'));
    }

    /* ================================================================
     *  CHECKOUT – Subscription
     * ================================================================ */

    /**
     * Create a Stripe Checkout Session for a subscription plan.
     */
    public function createSubscriptionCheckout(Company $company, string $plan, string $successUrl, string $cancelUrl): string
    {
        $planConfig = config("billing.plans.{$plan}");

        if (!$planConfig || !$planConfig['stripe_price_id']) {
            throw new \InvalidArgumentException("Plan '{$plan}' has no Stripe price configured.");
        }

        $customerId = $this->getOrCreateStripeCustomer($company);

        $session = StripeSession::create([
            'customer'   => $customerId,
            'mode'       => 'subscription',
            'line_items' => [[
                'price'    => $planConfig['stripe_price_id'],
                'quantity' => 1,
            ]],
            'metadata' => [
                'company_id' => $company->id,
                'plan'       => $plan,
            ],
            'subscription_data' => [
                'metadata' => [
                    'company_id' => (string) $company->id,
                    'plan'       => $plan,
                ],
            ],
            'success_url' => $successUrl . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url'  => $cancelUrl,
            'allow_promotion_codes' => true,
        ]);

        return $session->url;
    }

    /* ================================================================
     *  CHECKOUT – SMS Add-on (one-time)
     * ================================================================ */

    public function createAddonCheckout(Company $company, string $addonSlug, string $successUrl, string $cancelUrl): string
    {
        $addonConfig = config("billing.sms_addons.{$addonSlug}");

        if (!$addonConfig || !$addonConfig['stripe_price_id']) {
            throw new \InvalidArgumentException("Addon '{$addonSlug}' has no Stripe price configured.");
        }

        $customerId = $this->getOrCreateStripeCustomer($company);

        $session = StripeSession::create([
            'customer'   => $customerId,
            'mode'       => 'payment',
            'line_items' => [[
                'price'    => $addonConfig['stripe_price_id'],
                'quantity' => 1,
            ]],
            'metadata' => [
                'company_id' => $company->id,
                'addon_slug' => $addonSlug,
                'type'       => 'sms_addon',
            ],
            'success_url' => $successUrl . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url'  => $cancelUrl,
        ]);

        return $session->url;
    }

    /* ================================================================
     *  CUSTOMER PORTAL
     * ================================================================ */

    public function createPortalSession(Company $company, string $returnUrl): string
    {
        $customerId = $company->subscription?->stripe_customer_id;

        if (!$customerId) {
            throw new \RuntimeException('No Stripe customer found for this company.');
        }

        $session = PortalSession::create([
            'customer'   => $customerId,
            'return_url' => $returnUrl,
        ]);

        return $session->url;
    }

    /* ================================================================
     *  WEBHOOK HANDLING
     * ================================================================ */

    public function constructWebhookEvent(string $payload, string $sigHeader): \Stripe\Event
    {
        return Webhook::constructEvent(
            $payload,
            $sigHeader,
            config('billing.stripe.webhook_secret')
        );
    }

    /**
     * Handle checkout.session.completed
     *
     * IMPORTANT: Stripe does NOT copy checkout session metadata to the subscription.
     * We must save the subscription here using the session metadata (company_id, plan).
     */
    public function handleCheckoutCompleted(\Stripe\Event $event): void
    {
        $session = $event->data->object;
        $metadata = $session->metadata;
        $companyId = $metadata->company_id ?? null;

        Log::info('Checkout session completed', [
            'session_id'     => $session->id,
            'mode'           => $session->mode,
            'payment_status' => $session->payment_status,
            'company_id'     => $companyId,
            'type'           => $metadata->type ?? 'plan',
            'metadata'       => method_exists($metadata, 'toArray') ? $metadata->toArray() : (array)$metadata,
        ]);

        if (!$companyId) {
            Log::warning('Stripe webhook: missing company_id in metadata', ['session_id' => $session->id]);
            return;
        }

        $company = Company::find($companyId);
        if (!$company) {
            Log::warning('Stripe webhook: company not found', ['company_id' => $companyId]);
            return;
        }

        // SMS Addon purchase
        if (($metadata->type ?? null) === 'sms_addon') {
            $this->fulfillAddonPurchase($company, $session);
            return;
        }

        // ── Subscription checkout ──
        $plan = $metadata->plan ?? null;
        $stripeSubscriptionId = $session->subscription ?? null;

        if (!$plan || !$stripeSubscriptionId) {
            Log::warning('Stripe checkout: missing plan or subscription', [
                'company_id' => $companyId,
                'plan'       => $plan,
                'subscription' => $stripeSubscriptionId,
            ]);
            return;
        }

        // Fetch full Stripe subscription for period info
        $stripeSubscription = \Stripe\Subscription::retrieve($stripeSubscriptionId);

        // Copy metadata to Stripe subscription for future invoice.paid events
        try {
            \Stripe\Subscription::update($stripeSubscriptionId, [
                'metadata' => [
                    'company_id' => $companyId,
                    'plan'       => $plan,
                ],
            ]);
        } catch (\Exception $e) {
            Log::warning('Could not update Stripe subscription metadata', ['error' => $e->getMessage()]);
        }

        $planConfig = config("billing.plans.{$plan}");
        if (!$planConfig) {
            Log::error('Stripe checkout: unknown plan slug', ['plan' => $plan]);
            return;
        }

        $priceId = $stripeSubscription->items->data[0]->price->id ?? null;
        $period = $this->extractPeriod($stripeSubscription);

        $subscription = Subscription::updateOrCreate(
            ['company_id' => $companyId],
            [
                'stripe_subscription_id' => $stripeSubscriptionId,
                'stripe_customer_id'     => $session->customer,
                'stripe_price_id'        => $priceId,
                'plan'   => $plan,
                'status' => 'active',
                'monthly_email_limit' => $planConfig['monthly_email_limit'],
                'monthly_sms_units'   => $planConfig['monthly_sms_units'],
                'emails_sent_this_period'    => 0,
                'sms_units_used_this_period' => 0,
                'current_period_start' => $period['start'],
                'current_period_end'   => $period['end'],
                'ends_at'              => null,
            ]
        );

        Log::info('Subscription activated via checkout', [
            'company_id' => $companyId,
            'plan'       => $plan,
            'period_end' => $subscription->current_period_end,
        ]);
    }

    /**
     * Handle invoice.paid (subscription renewal or first payment)
     */
    public function handleInvoicePaid(\Stripe\Event $event): void
    {
        $invoice = $event->data->object;
        $stripeSubscriptionId = $invoice->subscription;

        if (!$stripeSubscriptionId) {
            return; // one-time payment, not a subscription
        }

        // Fetch the Stripe subscription to get metadata
        $stripeSubscription = \Stripe\Subscription::retrieve($stripeSubscriptionId);
        $companyId = $stripeSubscription->metadata->company_id ?? null;

        if (!$companyId) {
            // Try to find by stripe_subscription_id
            $sub = Subscription::where('stripe_subscription_id', $stripeSubscriptionId)->first();
            $companyId = $sub?->company_id;
        }

        if (!$companyId) {
            // Fallback: find by Stripe customer id (created during checkout)
            $sub = Subscription::where('stripe_customer_id', $stripeSubscription->customer)->first();
            $companyId = $sub?->company_id;
        }

        if (!$companyId) {
            Log::warning('Stripe invoice.paid: cannot find company', [
                'subscription_id' => $stripeSubscriptionId,
                'customer'        => $stripeSubscription->customer,
            ]);
            return;
        }

        $plan = $stripeSubscription->metadata->plan ?? null;

        if (!$plan) {
            // Try to determine plan from price
            $priceId = $stripeSubscription->items->data[0]->price->id ?? null;
            foreach (config('billing.plans') as $slug => $cfg) {
                if ($cfg['stripe_price_id'] === $priceId) {
                    $plan = $slug;
                    break;
                }
            }
        }

        if (!$plan) {
            // Last resort: check existing local subscription
            $existingSub = Subscription::where('company_id', $companyId)->first();
            $plan = $existingSub?->plan;
        }

        if (!$plan || $plan === 'free') {
            // If still free/unknown, try to match from price
            $priceId = $stripeSubscription->items->data[0]->price->id ?? null;
            foreach (config('billing.plans') as $slug => $cfg) {
                if ($cfg['stripe_price_id'] === $priceId) {
                    $plan = $slug;
                    break;
                }
            }
        }

        if (!$plan || $plan === 'free') {
            Log::warning('Stripe invoice.paid: cannot determine plan', [
                'subscription_id' => $stripeSubscriptionId,
            ]);
            return;
        }

        $planConfig = config("billing.plans.{$plan}");
        $period = $this->extractPeriod($stripeSubscription);

        $subscription = Subscription::updateOrCreate(
            ['company_id' => $companyId],
            [
                'stripe_subscription_id' => $stripeSubscriptionId,
                'stripe_customer_id'     => $stripeSubscription->customer,
                'stripe_price_id'        => $stripeSubscription->items->data[0]->price->id ?? null,
                'plan'   => $plan,
                'status' => 'active',
                'monthly_email_limit' => $planConfig['monthly_email_limit'],
                'monthly_sms_units'   => $planConfig['monthly_sms_units'],
                'emails_sent_this_period'    => 0,
                'sms_units_used_this_period' => 0,
                'current_period_start' => $period['start'],
                'current_period_end'   => $period['end'],
                'ends_at'              => null,
            ]
        );

        Log::info('Subscription activated/renewed', [
            'company_id' => $companyId,
            'plan'       => $plan,
            'period_end' => $subscription->current_period_end,
        ]);
    }

    /**
     * Handle customer.subscription.updated (plan change, cancellation)
     */
    public function handleSubscriptionUpdated(\Stripe\Event $event): void
    {
        $stripeSubscription = $event->data->object;
        $sub = Subscription::where('stripe_subscription_id', $stripeSubscription->id)->first();

        if (!$sub) {
            return;
        }

        $status = $stripeSubscription->status; // active, past_due, canceled, etc.

        if ($stripeSubscription->cancel_at_period_end) {
            $period = $this->extractPeriod($stripeSubscription);
            $sub->update([
                'status'  => 'canceled',
                'ends_at' => $period['end'],
            ]);
        } else {
            // Might be a plan change
            $priceId = $stripeSubscription->items->data[0]->price->id ?? null;
            $newPlan = null;

            foreach (config('billing.plans') as $slug => $cfg) {
                if ($cfg['stripe_price_id'] === $priceId) {
                    $newPlan = $slug;
                    break;
                }
            }

            if ($newPlan && $newPlan !== $sub->plan) {
                $planConfig = config("billing.plans.{$newPlan}");
                $sub->update([
                    'plan'   => $newPlan,
                    'status' => $status === 'active' ? 'active' : $status,
                    'stripe_price_id'     => $priceId,
                    'monthly_email_limit' => $planConfig['monthly_email_limit'],
                    'monthly_sms_units'   => $planConfig['monthly_sms_units'],
                    'ends_at'             => null,
                ]);
            } else {
                $sub->update([
                    'status'  => $status === 'active' ? 'active' : $status,
                    'ends_at' => null,
                ]);
            }
        }
    }

    /**
     * Handle customer.subscription.deleted
     */
    public function handleSubscriptionDeleted(\Stripe\Event $event): void
    {
        $stripeSubscription = $event->data->object;
        $sub = Subscription::where('stripe_subscription_id', $stripeSubscription->id)->first();

        if ($sub) {
            $sub->update([
                'status'  => 'canceled',
                'plan'    => 'free',
                'ends_at' => now(),
                'monthly_email_limit' => 10,
                'monthly_sms_units'   => 0,
            ]);

            Log::info('Subscription canceled → free', ['company_id' => $sub->company_id]);
        }
    }

    /* ================================================================
     *  PRIVATE HELPERS
     * ================================================================ */

    /**
     * Extract current_period_start/end from a Stripe Subscription.
     * In API >= 2025-12-15 these moved to items.data[0].
     */
    private function extractPeriod($stripeSubscription): array
    {
        $item = $stripeSubscription->items->data[0] ?? null;

        $start = $stripeSubscription->current_period_start
            ?? ($item->current_period_start ?? $stripeSubscription->start_date ?? $stripeSubscription->created);

        $end = $stripeSubscription->current_period_end
            ?? ($item->current_period_end ?? null);

        return [
            'start' => $start ? \Carbon\Carbon::createFromTimestamp($start) : now(),
            'end'   => $end   ? \Carbon\Carbon::createFromTimestamp($end)   : now()->addMonth(),
        ];
    }

    private function getOrCreateStripeCustomer(Company $company): string
    {
        $sub = $company->subscription;

        if ($sub && $sub->stripe_customer_id) {
            return $sub->stripe_customer_id;
        }

        $user = $company->user;
        $customer = StripeCustomer::create([
            'email'    => $user->email,
            'name'     => $company->name,
            'metadata' => [
                'company_id' => $company->id,
                'user_id'    => $user->id,
            ],
        ]);

        // Store customer id in subscription (create if needed)
        Subscription::updateOrCreate(
            ['company_id' => $company->id],
            [
                'stripe_customer_id' => $customer->id,
                'plan'   => $sub?->plan ?? 'free',
                'status' => $sub?->status ?? 'active',
            ]
        );

        return $customer->id;
    }

    private function fulfillAddonPurchase(Company $company, $session): void
    {
        $addonSlug = $session->metadata->addon_slug ?? null;
        $paymentIntent = $session->payment_intent;

        Log::info('SMS addon fulfillment started', [
            'company_id'     => $company->id,
            'addon_slug'     => $addonSlug,
            'payment_intent' => $paymentIntent,
            'session_id'     => $session->id,
            'payment_status' => $session->payment_status ?? 'unknown',
        ]);

        if (!$addonSlug) {
            Log::error('SMS addon: missing addon_slug in metadata', [
                'company_id' => $company->id,
                'session_id' => $session->id,
            ]);
            return;
        }

        $addonConfig = config("billing.sms_addons.{$addonSlug}");

        if (!$addonConfig) {
            Log::error('SMS addon: unknown addon slug', [
                'slug'       => $addonSlug,
                'company_id' => $company->id,
            ]);
            return;
        }

        if (!$paymentIntent) {
            Log::error('SMS addon: missing payment_intent', [
                'company_id' => $company->id,
                'session_id' => $session->id,
            ]);
            return;
        }

        // Prevent duplicate fulfillment (idempotency via payment_intent)
        if (SmsAddonPurchase::where('stripe_payment_id', $paymentIntent)->exists()) {
            Log::info('SMS addon: already fulfilled (duplicate webhook)', [
                'payment_intent' => $paymentIntent,
                'company_id'     => $company->id,
            ]);
            return;
        }

        $purchase = SmsAddonPurchase::create([
            'company_id'        => $company->id,
            'stripe_payment_id' => $paymentIntent,
            'addon_slug'        => $addonSlug,
            'units_purchased'   => $addonConfig['units'],
            'units_remaining'   => $addonConfig['units'],
            'amount_cents'      => $addonConfig['price_eur'] * 100,
        ]);

        Log::info('SMS addon fulfilled successfully', [
            'company_id'  => $company->id,
            'purchase_id' => $purchase->id,
            'addon'       => $addonSlug,
            'units'       => $addonConfig['units'],
            'amount_eur'  => $addonConfig['price_eur'],
        ]);
    }
}
