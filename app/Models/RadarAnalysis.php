<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RadarAnalysis extends Model
{
    protected $fillable = [
        'company_id',
        'feedback_hash',
        'feedbacks_count',
        'feedbacks_with_comments',
        'analysis_data',
        'analyzed_at',
    ];

    protected $casts = [
        'analysis_data' => 'array',
        'analyzed_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
