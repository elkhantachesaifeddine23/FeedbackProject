<?php









namespace App\Services;

use App\Models\Company;
use App\Models\FeedbackRequest;

class CreditConsumptionService
{
    private array $planQuotas = [
        'free' => 50,
        'starter' => 500,
        'pro' => 2000,
    ];

    private int $warningPercent = 20;
    private int $criticalPercent = 10;

    public function getSmsCredits(Company $company): array
    {
        $plan = $company->subscription?->plan ?? 'free';
        $quota = $this->planQuotas[$plan] ?? $this->planQuotas['free'];
        $addons = 0;

        $used = FeedbackRequest::where('company_id', $company->id)
            ->where('channel', 'sms')
            ->count();

        $total = $quota + $addons;
        $remaining = max(0, $total - $used);

        $warningThreshold = (int) ceil($total * ($this->warningPercent / 100));
        $criticalThreshold = (int) ceil($total * ($this->criticalPercent / 100));

        $status = 'ok';
        if ($remaining <= $criticalThreshold) {
            $status = 'critical';
        } elseif ($remaining <= $warningThreshold) {
            $status = 'warning';
        }

        return [
            'plan' => $plan,
            'quota' => $quota,
            'addons' => $addons,
            'used' => $used,
            'remaining' => $remaining,
            'warning_threshold' => $warningThreshold,
            'critical_threshold' => $criticalThreshold,
            'status' => $status,
        ];
    }
}
