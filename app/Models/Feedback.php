<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    use HasFactory;

    protected $fillable = [
        'feedback_request_id',
        'rating',
        'comment',
        'is_public',
        'is_pinned',
        'resolved_at',
        'resolution_note',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_public' => 'boolean',
        'is_pinned' => 'boolean',
        'resolved_at' => 'datetime',
    ];

    public function feedbackRequest()
    {
        return $this->belongsTo(FeedbackRequest::class);
    }

    public function replies()
    {
        return $this->hasMany(FeedbackReply::class);
    }

    // Scopes
    public function scopeNotResolved($query)
    {
        return $query->whereNull('resolved_at');
    }

    public function scopeResolved($query)
    {
        return $query->whereNotNull('resolved_at');
    }

    // Accessors
    public function isResolved(): bool
    {
        return $this->resolved_at !== null;
    }

}

