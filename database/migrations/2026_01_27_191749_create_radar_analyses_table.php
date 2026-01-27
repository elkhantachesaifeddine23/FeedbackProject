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
        Schema::create('radar_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            
            // Hash SHA256 des feedback IDs pour détecter les changements
            $table->string('feedback_hash', 64)->index();
            
            // Nombre de feedbacks analysés
            $table->integer('feedbacks_count');
            
            // Données d'analyse en JSON
            $table->json('analysis_data');
            
            // Nombre de feedbacks avec commentaires
            $table->integer('feedbacks_with_comments');
            
            // Timestamp de création de l'analyse
            $table->timestamp('analyzed_at')->useCurrent();
            
            // Index composé pour récupérer rapidement
            $table->index(['company_id', 'feedback_hash']);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('radar_analyses');
    }
};
