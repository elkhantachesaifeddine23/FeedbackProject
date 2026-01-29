<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeedbackReply extends Model
{
    use HasFactory;

    protected $fillable = [
        'feedback_id',
        'responder_type',
        'responder_id',
        'content',
        'status',
        'provider',
        'provider_response',
    ];

    public function feedback()
    {
        return $this->belongsTo(Feedback::class);
    }

    public function responder()
    {
        return $this->belongsTo(User::class, 'responder_id');
    }

    public function isAIGenerated(): bool
    {
        return $this->responder_type === 'ai';
    }

    public function isAdminResponse(): bool
    {
        return $this->responder_type === 'admin';
    }
}
