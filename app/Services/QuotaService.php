<?php

namespace App\Services;

use App\Models\Company;
use App\Models\SmsAddonPurchase;
use App\Models\SmsUsageLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QuotaService
{
    /**
     * Determine the SMS unit cost for a phone number.
     */
    public function smsUnitCost(string $phone): float
    {
        $costs = config('billing.sms_unit_costs', []);

        foreach ($costs as $prefix => $cost) {
            if (str_starts_with($phone, $prefix)) {
                return (float) $cost;
            }
        }

        return (float) config('billing.sms_unit_cost_default', 2);
    }

    /**
     * Check if a company can send an SMS (has enough units).
     */
    public function canSendSms(Company $company, string $phone): bool
    {
        $sub = $company->activeSubscription();

        if (!$sub || !$sub->canUseSms()) {
            return false;
        }

        $cost = $this->smsUnitCost($phone);

        return $company->totalSmsUnitsAvailable() >= $cost;
    }

    /**
     * Deduct SMS units after a successful send.
     * Priority: monthly quota first, then addon purchases (FIFO).
     *
     * @return SmsUsageLog[]
     */
    public function deductSmsUnits(Company $company, string $phone, ?int $feedbackRequestId = null): array
    {
        $cost = $this->smsUnitCost($phone);
        $remaining = $cost;
        $logs = [];

        $countryCode = $this->extractCountryCode($phone);

        DB::transaction(function () use ($company, $phone, $feedbackRequestId, $countryCode, &$remaining, &$logs) {
            $sub = $company->activeSubscription();

            // 1) Deduct from monthly quota
            if ($sub && $sub->remainingMonthlySmsUnits() > 0) {
                $fromMonthly = min($remaining, $sub->remainingMonthlySmsUnits());
                $sub->increment('sms_units_used_this_period', $fromMonthly);
                $remaining -= $fromMonthly;

                $logs[] = SmsUsageLog::create([
                    'company_id'          => $company->id,
                    'feedback_request_id' => $feedbackRequestId,
                    'phone'               => $phone,
                    'country_code'        => $countryCode,
                    'units_deducted'      => $fromMonthly,
                    'source'              => 'monthly_quota',
                    'addon_purchase_id'   => null,
                ]);
            }

            // 2) Deduct from addon purchases (oldest first)
            if ($remaining > 0) {
                $addons = SmsAddonPurchase::where('company_id', $company->id)
                    ->where('units_remaining', '>', 0)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();

                foreach ($addons as $addon) {
                    if ($remaining <= 0) break;

                    $fromAddon = min($remaining, $addon->units_remaining);
                    $addon->decrement('units_remaining', $fromAddon);
                    $remaining -= $fromAddon;

                    $logs[] = SmsUsageLog::create([
                        'company_id'          => $company->id,
                        'feedback_request_id' => $feedbackRequestId,
                        'phone'               => $phone,
                        'country_code'        => $countryCode,
                        'units_deducted'      => $fromAddon,
                        'source'              => 'addon',
                        'addon_purchase_id'   => $addon->id,
                    ]);
                }
            }
        });

        if ($remaining > 0) {
            Log::warning('SMS deduction incomplete — not enough units', [
                'company_id' => $company->id,
                'phone'      => $phone,
                'shortfall'  => $remaining,
            ]);
        }

        return $logs;
    }

    /**
     * Check if company can send an email.
     */
    public function canSendEmail(Company $company): bool
    {
        $sub = $company->activeSubscription();

        if (!$sub) {
            return false;
        }

        return $sub->canSendEmail();
    }

    /**
     * Record an email sent.
     */
    public function recordEmailSent(Company $company): void
    {
        $sub = $company->activeSubscription();
        $sub?->incrementEmailCount();
    }

    /**
     * Check if company can use a specific feature.
     */
    public function canUseFeature(Company $company, string $feature): bool
    {
        return $company->hasFeature($feature);
    }

    /**
     * Get billing summary for a company.
     */
    public function getBillingSummary(Company $company): array
    {
        $sub = $company->subscription;
        $plan = $sub?->plan ?? 'free';
        $planConfig = config("billing.plans.{$plan}", config('billing.plans.free'));

        return [
            'plan'        => $plan,
            'plan_label'  => $planConfig['label'],
            'price_eur'   => $planConfig['price_eur'],
            'status'      => $sub?->status ?? 'active',
            'features'    => $planConfig['features'],
            'ends_at'     => $sub?->ends_at,
            'current_period_end' => $sub?->current_period_end,

            // Email quotas
            'email_limit'     => $sub?->monthly_email_limit,
            'emails_sent'     => $sub?->emails_sent_this_period ?? 0,
            'emails_remaining' => $sub?->remainingEmails(),

            // SMS quotas
            'monthly_sms_units'         => $sub?->monthly_sms_units ?? 0,
            'monthly_sms_used'          => $sub?->sms_units_used_this_period ?? 0,
            'monthly_sms_remaining'     => $sub?->remainingMonthlySmsUnits() ?? 0,
            'addon_sms_remaining'       => $company->addonSmsUnitsRemaining(),
            'total_sms_available'       => $company->totalSmsUnitsAvailable(),
        ];
    }

    /* ── Private ── */

    private function extractCountryCode(string $phone): ?string
    {
        // Simple extraction — matches +33, +212, +1, etc.
        if (preg_match('/^(\+\d{1,3})/', $phone, $matches)) {
            return $matches[1];
        }
        return null;
    }
}
