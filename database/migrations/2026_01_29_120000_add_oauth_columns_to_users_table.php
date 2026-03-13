<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Migration already applied or not needed
        // Keeping as no-op to prevent RefreshDatabase errors
    }

    public function down(): void
    {
        // No-op
    }
};
