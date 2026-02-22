<?php

namespace App\Services;

use App\Models\RadarAnalysis;
use Illuminate\Support\Facades\Log;

/**
 * Service pour gérer le quota des analyses Radar IA
 * Limite : 4 analyses par jour par company (même en Pro)
 */
class RadarQuotaService
{
    private const DAILY_LIMIT = 4;

    /**
     * Vérifie si la company a le droit de faire une analyse aujourd'hui
     *
     * @param int $companyId
     * @return array ['allowed' => bool, 'remaining' => int, 'reset_at' => Carbon]
     */
    public function checkQuota(int $companyId): array
    {
        $today = now()->startOfDay();
        $tomorrow = now()->addDay()->startOfDay();

        $analysesCount = RadarAnalysis::where('company_id', $companyId)
            ->where('created_at', '>=', $today)
            ->where('created_at', '<', $tomorrow)
            ->count();

        $remaining = max(0, self::DAILY_LIMIT - $analysesCount);
        $allowed = $remaining > 0;

        if (!$allowed) {
            Log::info('Radar quota exceeded', [
                'company_id' => $companyId,
                'today_analyses' => $analysesCount,
                'limit' => self::DAILY_LIMIT,
                'reset_at' => $tomorrow,
            ]);
        }

        return [
            'allowed' => $allowed,
            'remaining' => $remaining,
            'daily_limit' => self::DAILY_LIMIT,
            'analyses_today' => $analysesCount,
            'reset_at' => $tomorrow,
        ];
    }

    /**
     * Obtient le nombre d'analyses restantes pour aujourd'hui
     */
    public function getRemaining(int $companyId): int
    {
        return $this->checkQuota($companyId)['remaining'];
    }

    /**
     * Vérifie et lève une exception si quota dépassé
     *
     * @throws \App\Exceptions\RadarQuotaExceededException
     */
    public function validateQuota(int $companyId): void
    {
        $quota = $this->checkQuota($companyId);

        if (!$quota['allowed']) {
            throw new \Exception(
                "Quota d'analyses Radar dépassé pour aujourd'hui. "
                . "Vous avez atteint la limite de {$quota['daily_limit']} analyses/jour. "
                . "Réessayez à partir de demain à " . $quota['reset_at']->format('H:i'),
                409 // Conflict HTTP status
            );
        }
    }

    /**
     * Log une nouvelle analyse (à appeler après création)
     */
    public function logAnalysis(int $companyId): void
    {
        $quota = $this->checkQuota($companyId);
        
        Log::info('Radar analysis logged', [
            'company_id' => $companyId,
            'remaining_today' => $quota['remaining'] - 1,
            'limit' => self::DAILY_LIMIT,
        ]);
    }
}
