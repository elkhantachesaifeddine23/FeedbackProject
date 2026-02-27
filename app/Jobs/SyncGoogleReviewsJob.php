<?php

namespace App\Jobs;

use App\Models\Company;
use App\Services\GoogleBusinessProfileService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SyncGoogleReviewsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Company $company
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (!$this->company->google_business_profile_connected) {
            Log::info('Google Business Profile not connected for company', [
                'company_id' => $this->company->id,
            ]);
            return;
        }

        try {
            $service = new GoogleBusinessProfileService($this->company);
            $result = $service->syncReviews();

            Log::info('Google reviews synced successfully', [
                'company_id' => $this->company->id,
                'synced' => $result['synced'],
                'skipped' => $result['skipped'],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to sync Google reviews', [
                'company_id' => $this->company->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
