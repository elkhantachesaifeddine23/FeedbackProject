<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeedbackTemplate extends Model
{
    protected $fillable = [
        'company_id',
        'channel',
        'name',
        'subject',
        'message',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Remplacer les variables dynamiques dans le message
     */
    public function parseMessage(array $variables = []): string
    {
        $message = $this->message;

        foreach ($variables as $key => $value) {
            $message = str_replace('{' . $key . '}', $value, $message);
        }

        return $message;
    }

    /**
     * Remplacer les variables dynamiques dans le sujet (email)
     */
    public function parseSubject(array $variables = []): string
    {
        if (!$this->subject) {
            return '';
        }

        $subject = $this->subject;

        foreach ($variables as $key => $value) {
            $subject = str_replace('{' . $key . '}', $value, $subject);
        }

        return $subject;
    }

    /**
     * Obtenir le template par défaut pour un canal
     */
    public static function getDefaultForChannel(int $companyId, string $channel): ?self
    {
        return self::where('company_id', $companyId)
            ->where('channel', $channel)
            ->where('is_default', true)
            ->first();
    }
}

