<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Upgrade subscriptions table ──
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('stripe_customer_id')->nullable()->after('stripe_subscription_id');
            $table->string('stripe_price_id')->nullable()->after('stripe_customer_id');
            $table->integer('monthly_email_limit')->nullable()->after('stripe_price_id');      // null = unlimited
            $table->integer('monthly_sms_units')->default(0)->after('monthly_email_limit');
            $table->integer('emails_sent_this_period')->default(0)->after('monthly_sms_units');
            $table->integer('sms_units_used_this_period')->default(0)->after('emails_sent_this_period');
            $table->timestamp('current_period_start')->nullable()->after('sms_units_used_this_period');
            $table->timestamp('current_period_end')->nullable()->after('current_period_start');
        });

        // ── SMS addon purchases (lifetime) ──
        Schema::create('sms_addon_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('stripe_payment_id')->nullable();
            $table->string('addon_slug');           // sms_starter, sms_business
            $table->integer('units_purchased');
            $table->integer('units_remaining');
            $table->integer('amount_cents');         // price in cents
            $table->timestamps();

            $table->index(['company_id', 'units_remaining']);
        });

        // ── SMS usage log ──
        Schema::create('sms_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('feedback_request_id')->nullable()->constrained()->nullOnDelete();
            $table->string('phone');
            $table->string('country_code', 5)->nullable();
            $table->decimal('units_deducted', 8, 2);
            $table->string('source');               // monthly_quota | addon
            $table->unsignedBigInteger('addon_purchase_id')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_usage_logs');
        Schema::dropIfExists('sms_addon_purchases');

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn([
                'stripe_customer_id',
                'stripe_price_id',
                'monthly_email_limit',
                'monthly_sms_units',
                'emails_sent_this_period',
                'sms_units_used_this_period',
                'current_period_start',
                'current_period_end',
            ]);
        });
    }
};
