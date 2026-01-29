<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CompanyResponsePolicy extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'tone',
        'language_preference',
        'auto_reply_enabled',
        'escalate_threshold',
        'escalate_to_role',
        'company_name',
        'support_email',
        'support_phone',
        'custom_instructions',
        'common_issues_context',
    ];

    protected $casts = [
        'auto_reply_enabled' => 'boolean',
        'common_issues_context' => 'array',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function shouldAutoReply(): bool
    {
        return $this->auto_reply_enabled;
    }

    public function shouldEscalate(int $rating): bool
    {
        return $rating <= $this->escalate_threshold;
    }
}
