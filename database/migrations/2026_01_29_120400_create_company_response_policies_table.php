<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_response_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->unique()->constrained('companies')->cascadeOnDelete();
            
            // Tone & Style
            $table->enum('tone', ['friendly', 'formal', 'professional'])->default('professional');
            $table->string('language_preference')->default('detect'); // detect, fr, ar, en, etc.
            
            // Auto-reply rules
            $table->boolean('auto_reply_enabled')->default(true);
            $table->integer('escalate_threshold')->default(2); // Si note <= 2, escalade
            $table->string('escalate_to_role')->default('admin'); // admin, manager
            
            // Template variables
            $table->string('company_name')->nullable();
            $table->string('support_email')->nullable();
            $table->string('support_phone')->nullable();
            
            // Customization
            $table->longText('custom_instructions')->nullable(); // Instructions spécifiques
            $table->longText('common_issues_context')->nullable(); // JSON avec contexte métier
            
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_response_policies');
    }
};
