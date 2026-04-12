<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'sector',
        'google_place_id',
        'google_maps_name',
        'google_review_url',
        'logo_url',
        'design_settings',
        'google_oauth_token',
        'google_oauth_refresh_token',
        'google_oauth_expires_at',
        'google_business_profile_connected',
        'google_business_profile_id',
        'google_last_sync_at',
    ];

    protected $casts = [
        'design_settings' => 'array',
        'google_oauth_expires_at' => 'datetime',
        'google_last_sync_at' => 'datetime',
        'google_business_profile_connected' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function feedbackRequests()
    {
        return $this->hasMany(FeedbackRequest::class);
    }

    public function subscription()
    {
        return $this->hasOne(Subscription::class);
    }

    public function feedbackReplies()
    {
        return $this->hasMany(FeedbackReply::class);
    }

    public function responsePolicy()
    {
        return $this->hasOne(CompanyResponsePolicy::class);
    }

    public function feedbackTemplates()
    {
        return $this->hasMany(FeedbackTemplate::class);
    }

    public function smsAddonPurchases()
    {
        return $this->hasMany(SmsAddonPurchase::class);
    }

    public function smsUsageLogs()
    {
        return $this->hasMany(SmsUsageLog::class);
    }

    /* ── Billing helpers ── */

    public function activeSubscription(): ?Subscription
    {
        $sub = $this->subscription;
        return ($sub && $sub->isActive()) ? $sub : null;
    }

    public function currentPlan(): string
    {
        return $this->activeSubscription()?->plan ?? 'free';
    }

    public function hasFeature(string $feature): bool
    {
        return $this->activeSubscription()?->hasFeature($feature) ?? false;
    }

    /**
     * Total remaining SMS addon units (lifetime, across all purchases).
     */
    public function addonSmsUnitsRemaining(): int
    {
        return (int) $this->smsAddonPurchases()->sum('units_remaining');
    }

    /**
     * Total SMS units available = monthly remaining + addon remaining.
     */
    public function totalSmsUnitsAvailable(): float
    {
        $monthly = $this->activeSubscription()?->remainingMonthlySmsUnits() ?? 0;
        return $monthly + $this->addonSmsUnitsRemaining();
    }
}