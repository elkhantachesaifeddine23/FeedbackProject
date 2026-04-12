<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Company;
use App\Models\Subscription;

return new class extends Migration
{
    public function up(): void
    {
        // Give every company without a subscription a Free plan
        $companiesWithoutSub = Company::whereDoesntHave('subscription')->get();

        foreach ($companiesWithoutSub as $company) {
            Subscription::create([
                'company_id'          => $company->id,
                'plan'                => 'free',
                'status'              => 'active',
                'monthly_email_limit' => 10,
                'monthly_sms_units'   => 0,
                'emails_sent_this_period'    => 0,
                'sms_units_used_this_period' => 0,
            ]);
        }

        // Ensure existing subscriptions have the new columns filled
        Subscription::whereNull('monthly_email_limit')
            ->where('plan', 'free')
            ->update([
                'monthly_email_limit' => 10,
                'monthly_sms_units'   => 0,
            ]);
    }

    public function down(): void
    {
        // No rollback needed
    }
};
