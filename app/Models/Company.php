<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'sector',
        'google_place_id',
        'google_review_url',
        'logo_url',
        'design_settings',
    ];

    protected $casts = [
        'design_settings' => 'array',
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
}