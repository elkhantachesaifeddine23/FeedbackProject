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
        Schema::table('feedback_replies', function (Blueprint $table) {
            $table->timestamp('google_published_at')->nullable()->after('provider_response');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('feedback_replies', function (Blueprint $table) {
            $table->dropColumn('google_published_at');
        });
    }
};
