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

    /**
     * All users in this company
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'company_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Admin users of this company
     */
    public function admins()
    {
        return $this->belongsToMany(User::class, 'company_user')
            ->where('role', 'admin')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Get user role in this company
     */
    public function getUserRole(User $user): ?string
    {
        return $this->users()
            ->where('user_id', $user->id)
            ->first()?->pivot?->role;
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
}

