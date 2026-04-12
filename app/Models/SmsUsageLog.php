<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsUsageLog extends Model
{
    protected $fillable = [
        'company_id',
        'feedback_request_id',
        'phone',
        'country_code',
        'units_deducted',
        'source',
        'addon_purchase_id',
    ];

    protected $casts = [
        'units_deducted' => 'decimal:2',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function feedbackRequest()
    {
        return $this->belongsTo(FeedbackRequest::class);
    }
}
