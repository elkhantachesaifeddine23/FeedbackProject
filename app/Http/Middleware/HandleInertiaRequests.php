<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $company = $user?->company;
        $sub = $company?->subscription;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'billing' => fn () => $sub ? [
                'plan'     => $sub->plan,
                'status'   => $sub->status,
                'features' => $sub->planConfig()['features'] ?? [],
            ] : [
                'plan'     => 'free',
                'status'   => 'active',
                'features' => config('billing.plans.free.features', []),
            ],
        ];
    }
}
