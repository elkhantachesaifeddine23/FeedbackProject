<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->text('google_oauth_token')->nullable();
            $table->text('google_oauth_refresh_token')->nullable();
            $table->timestamp('google_oauth_expires_at')->nullable();
            $table->boolean('google_business_profile_connected')->default(false);
            $table->string('google_business_profile_id')->nullable();
            $table->timestamp('google_last_sync_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'google_oauth_token',
                'google_oauth_refresh_token',
                'google_oauth_expires_at',
                'google_business_profile_connected',
                'google_business_profile_id',
                'google_last_sync_at',
            ]);
        });
    }
};
