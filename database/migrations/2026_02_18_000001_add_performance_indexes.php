<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ajoute des indexes de performance sans crash sur tables existantes
     */
    public function up(): void
    {
        // Index sur feedback (table singular) pour requêtes récurrentes
        if (Schema::hasTable('feedback')) {
            Schema::table('feedback', function (Blueprint $table) {
                try {
                    if (!Schema::hasIndex('feedback', 'idx_feedback_request_id')) {
                        $table->index('feedback_request_id', 'idx_feedback_request_id');
                    }
                } catch (\Exception $e) {
                    // Index already exists
                }
                try {
                    if (!Schema::hasIndex('feedback', 'feedback_created_at_idx')) {
                        $table->index('created_at', 'feedback_created_at_idx');
                    }
                } catch (\Exception $e) {
                    // Index already exists
                }
            });
        }

        // Index sur feedback_requests pour les queries par company
        if (Schema::hasTable('feedback_requests')) {
            Schema::table('feedback_requests', function (Blueprint $table) {
                try {
                    if (!Schema::hasIndex('feedback_requests', 'requests_company_created_idx')) {
                        $table->index(['company_id', 'created_at'], 'requests_company_created_idx');
                    }
                } catch (\Exception $e) {
                    // Index already exists
                }
            });
        }

        // Index sur radar_analyses
        if (Schema::hasTable('radar_analyses')) {
            Schema::table('radar_analyses', function (Blueprint $table) {
                try {
                    if (!Schema::hasIndex('radar_analyses', 'radar_company_created_idx')) {
                        $table->index(['company_id', 'created_at'], 'radar_company_created_idx');
                    }
                } catch (\Exception $e) {
                    // Index already exists
                }
            });
        }

        // Index sur users
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                try {
                    if (!Schema::hasIndex('users', 'users_company_id_idx')) {
                        $table->index('company_id', 'users_company_id_idx');
                    }
                } catch (\Exception $e) {
                    // Index already exists
                }
            });
        }

        // Index sur customers
        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table) {
                try {
                    // customer_company_id_idx already exists from base migration
                } catch (\Exception $e) {
                    // Index already exists
                }
            });
        }

        // Index sur review_platforms
        if (Schema::hasTable('review_platforms')) {
            Schema::table('review_platforms', function (Blueprint $table) {
                try {
                    if (!Schema::hasIndex('review_platforms', 'platforms_company_id_idx')) {
                        $table->index('company_id', 'platforms_company_id_idx');
                    }
                } catch (\Exception $e) {
                    // Index already exists
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('feedback')) {
            Schema::table('feedback', function (Blueprint $table) {
                try { $table->dropIndex('idx_feedback_request_id'); } catch (\Exception $e) {}
                try { $table->dropIndex('feedback_created_at_idx'); } catch (\Exception $e) {}
            });
        }

        if (Schema::hasTable('feedback_requests')) {
            Schema::table('feedback_requests', function (Blueprint $table) {
                try { $table->dropIndex('requests_company_created_idx'); } catch (\Exception $e) {}
            });
        }

        if (Schema::hasTable('radar_analyses')) {
            Schema::table('radar_analyses', function (Blueprint $table) {
                try { $table->dropIndex('radar_company_created_idx'); } catch (\Exception $e) {}
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                try { $table->dropIndex('users_company_id_idx'); } catch (\Exception $e) {}
            });
        }

        if (Schema::hasTable('review_platforms')) {
            Schema::table('review_platforms', function (Blueprint $table) {
                try { $table->dropIndex('platforms_company_id_idx'); } catch (\Exception $e) {}
            });
        }
    }
};
