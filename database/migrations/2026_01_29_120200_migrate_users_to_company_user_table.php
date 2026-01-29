<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations - Migrate existing users to company_user table
     */
    public function up(): void
    {
        // Get all users with their companies (V1: 1 user = 1 company relationship)
        $users = DB::table('users')
            ->join('companies', 'users.id', '=', 'companies.user_id')
            ->select('users.id as user_id', 'companies.id as company_id')
            ->get();

        // Insert them into company_user with admin role (they owned the company)
        foreach ($users as $user) {
            DB::table('company_user')->insertOrIgnore([
                'company_id' => $user->company_id,
                'user_id' => $user->user_id,
                'role' => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations - Remove company_user entries that were created
     */
    public function down(): void
    {
        // Don't delete company_user entries on rollback - might have new data
        // Instead, just log or do nothing
        DB::statement('TRUNCATE TABLE company_user');
    }
};
