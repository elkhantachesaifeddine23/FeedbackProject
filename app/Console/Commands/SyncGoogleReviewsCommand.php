<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Services\GoogleBusinessProfileService;
use Illuminate\Console\Command;

class SyncGoogleReviewsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'google:sync-reviews {--company-id= : Specific company ID to sync}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Google Business Profile reviews for all connected companies';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($companyId = $this->option('company-id')) {
            $company = Company::find($companyId);
            
            if (!$company) {
                $this->error("Company with ID {$companyId} not found");
                return 1;
            }

            return $this->syncCompany($company);
        }

        $companies = Company::where('google_business_profile_connected', true)->get();

        if ($companies->isEmpty()) {
            $this->info('No companies with connected Google Business Profile found');
            return 0;
        }

        $this->info("Found {$companies->count()} companies to sync");

        foreach ($companies as $company) {
            $this->syncCompany($company);
        }

        return 0;
    }

    private function syncCompany(Company $company): int
    {
        try {
            $this->info("Syncing reviews for {$company->name}...");

            $service = new GoogleBusinessProfileService($company);
            $result = $service->syncReviews();

            $this->info("✓ Synced {$result['synced']} reviews, skipped {$result['skipped']}");

            if (!empty($result['errors'])) {
                foreach ($result['errors'] as $error) {
                    $this->warn("  - {$error}");
                }
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("✗ Failed to sync {$company->name}: " . $e->getMessage());
            return 1;
        }
    }
}
