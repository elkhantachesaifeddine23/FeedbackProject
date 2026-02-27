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
        Schema::create('feedback_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->enum('channel', ['sms', 'email', 'qr']);
            $table->string('name')->default('Template par défaut');
            $table->text('subject')->nullable(); // Pour email uniquement
            $table->text('message');
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            // Un seul template par défaut par canal pour chaque entreprise
            $table->index(['company_id', 'channel', 'is_default']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback_templates');
    }
};
