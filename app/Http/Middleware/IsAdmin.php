<?php

namespace App\Http\Middleware;

use App\Helpers\AdminHelper;
use Closure;
use Illuminate\Http\Request;

class IsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Vérifie si c'est l'admin (celui qui a créé la plateforme)
        if (!AdminHelper::isAdmin($user)) {
            abort(403, 'Accès réservé aux administrateurs');
        }

        return $next($request);
    }
}
