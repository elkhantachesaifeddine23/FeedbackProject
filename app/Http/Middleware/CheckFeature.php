<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckFeature
{
    /**
     * Middleware usage:  ->middleware('feature:ai_replies')
     */
    public function handle(Request $request, Closure $next, string $feature)
    {
        $company = Auth::user()?->company;

        if (!$company || !$company->hasFeature($feature)) {
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return back()->withErrors([
                    'plan' => $this->featureMessage($feature),
                ]);
            }

            abort(403, $this->featureMessage($feature));
        }

        return $next($request);
    }

    private function featureMessage(string $feature): string
    {
        return match ($feature) {
            'ai_replies' => 'Les réponses IA nécessitent un plan Basic ou supérieur.',
            'ai_radar'   => 'Le Radar IA nécessite un plan Pro.',
            'tasks'      => 'Les tâches nécessitent un plan Pro.',
            'sms'        => 'L\'envoi SMS nécessite un plan Basic ou supérieur.',
            default      => 'Cette fonctionnalité nécessite un plan supérieur.',
        };
    }
}
