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
        Schema::table('feedback_requests', function (Blueprint $table) {
            $table->unsignedTinyInteger('reminder_count')
                ->default(0)
                ->after('responded_at');

            $table->timestamp('last_reminder_at')
                ->nullable()
                ->after('reminder_count');

            $table->timestamp('next_reminder_at')
                ->nullable()
                ->after('last_reminder_at');

            $table->index(['status', 'next_reminder_at'], 'feedback_requests_status_next_reminder_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('feedback_requests', function (Blueprint $table) {
            $table->dropIndex('feedback_requests_status_next_reminder_idx');
            $table->dropColumn(['reminder_count', 'last_reminder_at', 'next_reminder_at']);
        });
    }
};
