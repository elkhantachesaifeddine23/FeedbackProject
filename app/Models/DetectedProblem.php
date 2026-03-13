<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DetectedProblem extends Model
{
    use HasFactory;
    protected $fillable = [
        'company_id',
        'title',
        'detail',
        'solution',
        'effort',
        'impact',
        'urgency',
        'status',
        'type',
        'resolved_at',
        'ai_hash',
        'feedbacks_count',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'feedbacks_count' => 'integer',
    ];

    // ── Status constants ──
    public const STATUS_OPEN = 'open';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_RESOLVED = 'resolved';

    // ── Type constants ──
    public const TYPE_PROBLEM = 'problem';
    public const TYPE_DECISION = 'decision';

    // ── Relations ──

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function feedbacks(): BelongsToMany
    {
        return $this->belongsToMany(Feedback::class, 'detected_problem_feedback')
            ->withTimestamps();
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    // ── Scopes ──

    public function scopeOpen($query)
    {
        return $query->where('status', self::STATUS_OPEN);
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', self::STATUS_IN_PROGRESS);
    }

    public function scopeResolved($query)
    {
        return $query->where('status', self::STATUS_RESOLVED);
    }

    public function scopeNotResolved($query)
    {
        return $query->where('status', '!=', self::STATUS_RESOLVED);
    }

    public function scopeProblems($query)
    {
        return $query->where('type', self::TYPE_PROBLEM);
    }

    public function scopeDecisions($query)
    {
        return $query->where('type', self::TYPE_DECISION);
    }

    // ── Actions ──

    /**
     * Resolve this problem and optionally cascade to linked feedbacks
     */
    public function markResolved(bool $cascadeToFeedbacks = true): void
    {
        $this->update([
            'status' => self::STATUS_RESOLVED,
            'resolved_at' => now(),
        ]);

        if ($cascadeToFeedbacks) {
            $this->feedbacks()
                ->whereNull('resolved_at')
                ->each(function (Feedback $feedback) {
                    $feedback->update([
                        'resolved_at' => now(),
                        'resolution_note' => 'Résolu via Radar IA (problème: ' . $this->title . ')',
                    ]);
                });
        }
    }

    /**
     * Reopen a resolved problem
     */
    public function reopen(): void
    {
        $this->update([
            'status' => self::STATUS_OPEN,
            'resolved_at' => null,
        ]);
    }

    /**
     * Generate a unique AI hash from title for deduplication
     */
    public static function generateHash(string $title, int $companyId): string
    {
        $normalized = mb_strtolower(trim($title));
        return hash('sha256', "{$companyId}:{$normalized}");
    }

    // ── Accessors ──

    public function getIsResolvedAttribute(): bool
    {
        return $this->status === self::STATUS_RESOLVED;
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_OPEN => 'Ouvert',
            self::STATUS_IN_PROGRESS => 'En cours',
            self::STATUS_RESOLVED => 'Résolu',
            default => $this->status,
        };
    }
}
