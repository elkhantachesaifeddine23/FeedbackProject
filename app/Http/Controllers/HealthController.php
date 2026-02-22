<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

/**
 * Health check endpoint for monitoring and load balancers
 */
class HealthController extends Controller
{
    /**
     * Basic health check
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'app_name' => config('app.name'),
        ]);
    }

    /**
     * Detailed health check for load balancers
     */
    public function detailed(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'queue' => $this->checkQueue(),
        ];

        $allHealthy = collect($checks)->every(fn ($check) => $check['status'] === 'ok');

        return response()->json([
            'status' => $allHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ], $allHealthy ? 200 : 503);
    }

    /**
     * Check database connectivity
     */
    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            return [
                'status' => 'ok',
                'message' => 'Database connected',
                'timestamp' => now()->toIso8601String(),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Database connection failed: ' . $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ];
        }
    }

    /**
     * Check Redis connectivity
     */
    private function checkRedis(): array
    {
        try {
            Cache::store('redis')->put('health_check', 'ok', 10);
            $value = Cache::store('redis')->get('health_check');
            
            if ($value === 'ok') {
                return [
                    'status' => 'ok',
                    'message' => 'Redis connected',
                    'timestamp' => now()->toIso8601String(),
                ];
            }
            
            return [
                'status' => 'error',
                'message' => 'Redis data mismatch',
                'timestamp' => now()->toIso8601String(),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'warning',
                'message' => 'Redis unavailable (non-critical): ' . $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ];
        }
    }

    /**
     * Check queue system
     */
    private function checkQueue(): array
    {
        try {
            $connection = config('queue.default');
            return [
                'status' => 'ok',
                'message' => "Queue driver: {$connection}",
                'timestamp' => now()->toIso8601String(),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Queue system error: ' . $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ];
        }
    }
}
