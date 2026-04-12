<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\SmsAddonPurchase;
use Illuminate\Console\Command;
use Stripe\Stripe;

class SyncStripeAddons extends Command
{
    protected $signature = 'stripe:sync-addons {company_id? : The company ID to sync addons for} {--dry-run : Show what would be synced without writing}';
    protected $description = 'Recover missed SMS addon purchases from Stripe checkout sessions';

    public function handle(): int
    {
        Stripe::setApiKey(config('billing.stripe.secret'));

        $companyId = $this->argument('company_id');
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('🔍 DRY RUN — no records will be created.');
        }

        // Fetch completed checkout sessions of mode=payment (addons are one-time payments)
        $this->info('Fetching completed payment checkout sessions from Stripe...');

        $params = [
            'limit' => 100,
            'status' => 'complete',
        ];

        $sessions = \Stripe\Checkout\Session::all($params);
        $synced = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($sessions->autoPagingIterator() as $session) {
            // Only process one-time payments with sms_addon type
            if ($session->mode !== 'payment') {
                continue;
            }

            $metadata = $session->metadata;
            $type = $metadata->type ?? null;
            $sessionCompanyId = $metadata->company_id ?? null;
            $addonSlug = $metadata->addon_slug ?? null;

            if ($type !== 'sms_addon' || !$sessionCompanyId || !$addonSlug) {
                continue;
            }

            // Filter by company if specified
            if ($companyId && (string)$sessionCompanyId !== (string)$companyId) {
                continue;
            }

            $paymentIntent = $session->payment_intent;

            // Check if already fulfilled
            if (SmsAddonPurchase::where('stripe_payment_id', $paymentIntent)->exists()) {
                $this->line("  ✅ Already fulfilled: {$addonSlug} for company {$sessionCompanyId} (PI: {$paymentIntent})");
                $skipped++;
                continue;
            }

            $addonConfig = config("billing.sms_addons.{$addonSlug}");
            if (!$addonConfig) {
                $this->error("  ❌ Unknown addon slug: {$addonSlug}");
                $errors++;
                continue;
            }

            $company = Company::find($sessionCompanyId);
            if (!$company) {
                $this->error("  ❌ Company not found: {$sessionCompanyId}");
                $errors++;
                continue;
            }

            if ($session->payment_status !== 'paid') {
                $this->warn("  ⚠️  Payment not completed for {$addonSlug} (company {$sessionCompanyId}): status={$session->payment_status}");
                $skipped++;
                continue;
            }

            $this->info("  🔄 Syncing: {$addonSlug} ({$addonConfig['units']} units) for company {$sessionCompanyId}");
            $this->line("     Payment Intent: {$paymentIntent}");
            $this->line("     Amount: {$addonConfig['price_eur']}€");

            if (!$dryRun) {
                SmsAddonPurchase::create([
                    'company_id'        => $sessionCompanyId,
                    'stripe_payment_id' => $paymentIntent,
                    'addon_slug'        => $addonSlug,
                    'units_purchased'   => $addonConfig['units'],
                    'units_remaining'   => $addonConfig['units'],
                    'amount_cents'      => $addonConfig['price_eur'] * 100,
                ]);
                $this->info("     ✅ Created!");
            } else {
                $this->info("     (dry-run, skipped)");
            }

            $synced++;
        }

        $this->newLine();
        $this->info("Summary: {$synced} synced, {$skipped} skipped, {$errors} errors");

        return $errors > 0 ? 1 : 0;
    }
}
