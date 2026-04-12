<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\Subscription;
use Illuminate\Console\Command;
use Stripe\Stripe;

class SyncStripeSubscription extends Command
{
    protected $signature = 'stripe:sync {company_id? : The company ID to sync}';
    protected $description = 'Sync subscription data from Stripe for a company (or all companies with a stripe_customer_id)';

    public function handle(): int
    {
        Stripe::setApiKey(config('billing.stripe.secret'));

        $companyId = $this->argument('company_id');

        if ($companyId) {
            $subscriptions = Subscription::where('company_id', $companyId)->get();
        } else {
            $subscriptions = Subscription::whereNotNull('stripe_customer_id')->get();
        }

        if ($subscriptions->isEmpty()) {
            // If no subscription found but company_id given, look up by Stripe customer
            if ($companyId) {
                $this->info("No local subscription found for company {$companyId}. Searching Stripe...");
                return $this->syncFromStripeCustomers($companyId);
            }
            $this->warn('No subscriptions with Stripe customer IDs found.');
            return 0;
        }

        foreach ($subscriptions as $sub) {
            $this->syncSubscription($sub);
        }

        return 0;
    }

    private function syncFromStripeCustomers(int $companyId): int
    {
        $company = Company::find($companyId);
        if (!$company) {
            $this->error("Company {$companyId} not found.");
            return 1;
        }

        // Search Stripe customers by company metadata
        $customers = \Stripe\Customer::search([
            'query' => "metadata['company_id']:'{$companyId}'",
        ]);

        if (count($customers->data) === 0) {
            $this->warn("No Stripe customer found for company {$companyId}.");
            return 1;
        }

        foreach ($customers->data as $customer) {
            $this->info("Found Stripe customer: {$customer->id} ({$customer->email})");

            // List active subscriptions for this customer
            $stripeSubs = \Stripe\Subscription::all([
                'customer' => $customer->id,
                'status'   => 'active',
                'limit'    => 1,
            ]);

            if (count($stripeSubs->data) === 0) {
                // Try all statuses
                $stripeSubs = \Stripe\Subscription::all([
                    'customer' => $customer->id,
                    'limit'    => 1,
                ]);
            }

            foreach ($stripeSubs->data as $stripeSub) {
                $this->info("  Stripe subscription: {$stripeSub->id} (status: {$stripeSub->status})");

                $priceId = $stripeSub->items->data[0]->price->id ?? null;
                $plan = null;

                // Determine plan from price ID
                foreach (config('billing.plans') as $slug => $cfg) {
                    if ($cfg['stripe_price_id'] === $priceId) {
                        $plan = $slug;
                        break;
                    }
                }

                // Also try from subscription metadata
                if (!$plan) {
                    $plan = $stripeSub->metadata->plan ?? null;
                }

                if (!$plan) {
                    $this->warn("  Cannot determine plan for price {$priceId}. Skipping.");
                    $this->info("  Configured prices:");
                    foreach (config('billing.plans') as $slug => $cfg) {
                        $this->info("    {$slug}: {$cfg['stripe_price_id']}");
                    }
                    continue;
                }

                $planConfig = config("billing.plans.{$plan}");

                // Period dates live in items.data[0] in Stripe API >= 2025-12-15
                $item = $stripeSub->items->data[0] ?? null;
                $periodStart = $item->current_period_start ?? $stripeSub->start_date ?? $stripeSub->created;
                $periodEnd = $item->current_period_end ?? null;

                $localSub = Subscription::updateOrCreate(
                    ['company_id' => $companyId],
                    [
                        'stripe_subscription_id' => $stripeSub->id,
                        'stripe_customer_id'     => $customer->id,
                        'stripe_price_id'        => $priceId,
                        'plan'   => $plan,
                        'status' => $stripeSub->status === 'active' ? 'active' : $stripeSub->status,
                        'monthly_email_limit' => $planConfig['monthly_email_limit'],
                        'monthly_sms_units'   => $planConfig['monthly_sms_units'],
                        'emails_sent_this_period'    => 0,
                        'sms_units_used_this_period' => 0,
                        'current_period_start' => $periodStart ? \Carbon\Carbon::createFromTimestamp($periodStart) : now(),
                        'current_period_end'   => $periodEnd ? \Carbon\Carbon::createFromTimestamp($periodEnd) : now()->addMonth(),
                        'ends_at'              => $stripeSub->cancel_at_period_end && $periodEnd
                            ? \Carbon\Carbon::createFromTimestamp($periodEnd)
                            : null,
                    ]
                );

                // Also update Stripe subscription metadata for future webhooks
                try {
                    \Stripe\Subscription::update($stripeSub->id, [
                        'metadata' => [
                            'company_id' => $companyId,
                            'plan'       => $plan,
                        ],
                    ]);
                    $this->info("  Updated Stripe subscription metadata.");
                } catch (\Exception $e) {
                    $this->warn("  Could not update Stripe metadata: {$e->getMessage()}");
                }

                $this->info("  ✅ Synced: plan={$plan}, status={$localSub->status}, period_end={$localSub->current_period_end}");
            }
        }

        return 0;
    }

    private function syncSubscription(Subscription $sub): void
    {
        if (!$sub->stripe_customer_id) {
            $this->warn("Company {$sub->company_id}: no Stripe customer ID. Skipping.");
            return;
        }

        $this->info("Syncing company {$sub->company_id} (customer: {$sub->stripe_customer_id})...");

        try {
            // Get active subscriptions from Stripe
            $stripeSubs = \Stripe\Subscription::all([
                'customer' => $sub->stripe_customer_id,
                'status'   => 'active',
                'limit'    => 1,
            ]);

            if (count($stripeSubs->data) === 0) {
                $this->warn("  No active Stripe subscription found.");
                return;
            }

            $stripeSub = $stripeSubs->data[0];
            $priceId = $stripeSub->items->data[0]->price->id ?? null;
            $plan = $stripeSub->metadata->plan ?? null;

            if (!$plan) {
                foreach (config('billing.plans') as $slug => $cfg) {
                    if ($cfg['stripe_price_id'] === $priceId) {
                        $plan = $slug;
                        break;
                    }
                }
            }

            if (!$plan) {
                $this->warn("  Cannot determine plan for price {$priceId}.");
                return;
            }

            $planConfig = config("billing.plans.{$plan}");

            // Period dates live in items.data[0] in Stripe API >= 2025-12-15
            $item = $stripeSub->items->data[0] ?? null;
            $periodStart = $item->current_period_start ?? $stripeSub->start_date ?? $stripeSub->created;
            $periodEnd = $item->current_period_end ?? null;

            $sub->update([
                'stripe_subscription_id' => $stripeSub->id,
                'stripe_price_id'        => $priceId,
                'plan'   => $plan,
                'status' => 'active',
                'monthly_email_limit' => $planConfig['monthly_email_limit'],
                'monthly_sms_units'   => $planConfig['monthly_sms_units'],
                'current_period_start' => $periodStart ? \Carbon\Carbon::createFromTimestamp($periodStart) : now(),
                'current_period_end'   => $periodEnd ? \Carbon\Carbon::createFromTimestamp($periodEnd) : now()->addMonth(),
                'ends_at'              => null,
            ]);

            $this->info("  ✅ Synced: plan={$plan}, period_end={$sub->fresh()->current_period_end}");

        } catch (\Exception $e) {
            $this->error("  Error: {$e->getMessage()}");
        }
    }
}
