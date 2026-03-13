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
        Schema::create('detected_problems', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('detail')->nullable();
            $table->text('solution')->nullable();
            $table->string('effort')->nullable(); // faible, moyen, élevé
            $table->string('impact')->nullable(); // faible, moyen, fort
            $table->string('urgency')->nullable(); // immédiat, court_terme, moyen_terme
            $table->string('status')->default('open'); // open, in_progress, resolved
            $table->string('type')->default('problem'); // problem, decision
            $table->timestamp('resolved_at')->nullable();
            $table->string('ai_hash', 64)->nullable()->index(); // SHA256 to deduplicate across analyses
            $table->unsignedInteger('feedbacks_count')->default(0); // denormalized count for perf
            $table->timestamps();

            $table->index(['company_id', 'status']);
            $table->index(['company_id', 'type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detected_problems');
    }
};
