<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'stripe_subscription_id',
        'stripe_customer_id',
        'stripe_price_id',
        'plan',
        'status',
        'monthly_email_limit',
        'monthly_sms_units',
        'emails_sent_this_period',
        'sms_units_used_this_period',
        'current_period_start',
        'current_period_end',
        'trial_ends_at',
        'ends_at',
    ];

    protected $casts = [
        'trial_ends_at'        => 'datetime',
        'ends_at'              => 'datetime',
        'current_period_start' => 'datetime',
        'current_period_end'   => 'datetime',
        'monthly_email_limit'  => 'integer',
        'monthly_sms_units'    => 'integer',
        'emails_sent_this_period'    => 'integer',
        'sms_units_used_this_period' => 'integer',
    ];

    /* ── Relationships ── */

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /* ── Plan helpers ── */

    public function planConfig(): array
    {
        return config("billing.plans.{$this->plan}", config('billing.plans.free'));
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['active', 'trialing']);
    }

    public function isPlan(string $plan): bool
    {
        return $this->plan === $plan && $this->isActive();
    }

    /* ── Feature gates ── */

    public function hasFeature(string $feature): bool
    {
        return data_get($this->planConfig(), "features.{$feature}", false);
    }

    public function canUseAiReplies(): bool
    {
        return $this->hasFeature('ai_replies');
    }

    public function canUseRadar(): bool
    {
        return $this->hasFeature('ai_radar');
    }

    public function canUseTasks(): bool
    {
        return $this->hasFeature('tasks');
    }

    public function canUseSms(): bool
    {
        return $this->hasFeature('sms');
    }

    /* ── Quota helpers ── */

    public function canSendEmail(): bool
    {
        $limit = $this->monthly_email_limit;

        // null = unlimited
        if (is_null($limit)) {
            return true;
        }

        return $this->emails_sent_this_period < $limit;
    }

    public function remainingEmails(): ?int
    {
        if (is_null($this->monthly_email_limit)) {
            return null; // unlimited
        }

        return max(0, $this->monthly_email_limit - $this->emails_sent_this_period);
    }

    public function remainingMonthlySmsUnits(): float
    {
        return max(0, $this->monthly_sms_units - $this->sms_units_used_this_period);
    }

    public function incrementEmailCount(): void
    {
        $this->increment('emails_sent_this_period');
    }

    public function resetPeriodCounters(): void
    {
        $this->update([
            'emails_sent_this_period'    => 0,
            'sms_units_used_this_period' => 0,
        ]);
    }
}

