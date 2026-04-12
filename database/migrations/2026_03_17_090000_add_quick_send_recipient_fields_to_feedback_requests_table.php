<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('feedback_requests', function (Blueprint $table) {
            $table->string('recipient_name')->nullable()->after('next_reminder_at');
            $table->string('recipient_email')->nullable()->after('recipient_name');
            $table->string('recipient_phone')->nullable()->after('recipient_email');
            $table->string('recipient_hash')->nullable()->after('recipient_phone');
            $table->timestamp('consent_at')->nullable()->after('recipient_hash');
            $table->string('consent_source')->nullable()->after('consent_at');

            $table->index(['company_id', 'channel', 'recipient_hash'], 'feedback_requests_company_channel_recipient_hash_idx');
        });

        DB::statement('ALTER TABLE feedback_requests ALTER COLUMN customer_id DROP NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DELETE FROM feedback_requests WHERE customer_id IS NULL');
        DB::statement('ALTER TABLE feedback_requests ALTER COLUMN customer_id SET NOT NULL');

        Schema::table('feedback_requests', function (Blueprint $table) {
            $table->dropIndex('feedback_requests_company_channel_recipient_hash_idx');
            $table->dropColumn([
                'recipient_name',
                'recipient_email',
                'recipient_phone',
                'recipient_hash',
                'consent_at',
                'consent_source',
            ]);
        });
    }
};
