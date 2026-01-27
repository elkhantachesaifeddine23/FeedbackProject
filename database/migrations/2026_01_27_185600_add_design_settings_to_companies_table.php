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
        Schema::table('companies', function (Blueprint $table) {
            // Logo et branding
            $table->string('logo_url')->nullable()->after('google_review_url');
            
            // Paramètres de design (JSON)
            $table->json('design_settings')->nullable()->after('logo_url');
            
            // Exemple de design_settings:
            // {
            //   "primary_color": "#3b82f6",
            //   "secondary_color": "#1e40af",
            //   "star_style": "classic", // classic, modern, heart, thumbs
            //   "star_color": "#fbbf24",
            //   "font_family": "Inter",
            //   "background_color": "#f9fafb",
            //   "card_background": "#ffffff",
            //   "text_color": "#111827",
            //   "button_style": "rounded", // rounded, square, pill
            //   "show_logo": true,
            //   "custom_message": "Votre avis compte pour nous!"
            // }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['logo_url', 'design_settings']);
        });
    }
};
