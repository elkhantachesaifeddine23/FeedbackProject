<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class FeedbackRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'customer_id',
        'token',
        'channel',
        'status',
        'provider',
        'provider_message_id',
        'provider_response',
        'sent_at',
        'responded_at',
        'detected_language',
        'feedback_text',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function feedback()
    {
        return $this->hasOne(Feedback::class);
    }

    public function replies()
    {
        return $this->hasManyThrough(
            FeedbackReply::class,
            Feedback::class,
            'feedback_request_id',
            'feedback_id'
        );
    }

    public function lastReply()
    {
        return $this->hasOneThrough(
            FeedbackReply::class,
            Feedback::class,
            'feedback_request_id',
            'feedback_id'
        )->latestOfMany();
    }
}
