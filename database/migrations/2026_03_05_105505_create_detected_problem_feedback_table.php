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
        Schema::create('detected_problem_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('detected_problem_id')->constrained()->cascadeOnDelete();
            $table->foreignId('feedback_id')->constrained('feedback')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['detected_problem_id', 'feedback_id'], 'dp_feedback_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detected_problem_feedback');
    }
};
