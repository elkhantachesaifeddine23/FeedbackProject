<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feedback_requests', function (Blueprint $table) {
            $table->string('detected_language')->default('en')->after('token'); // Langue détectée
            $table->string('feedback_text')->nullable()->after('detected_language'); // Texte du feedback si fourni
        });
    }

    public function down(): void
    {
        Schema::table('feedback_requests', function (Blueprint $table) {
            $table->dropColumn(['detected_language', 'feedback_text']);
        });
    }
};
