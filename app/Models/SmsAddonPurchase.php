<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsAddonPurchase extends Model
{
    protected $fillable = [
        'company_id',
        'stripe_payment_id',
        'addon_slug',
        'units_purchased',
        'units_remaining',
        'amount_cents',
    ];

    protected $casts = [
        'units_purchased'  => 'integer',
        'units_remaining'  => 'integer',
        'amount_cents'     => 'integer',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
