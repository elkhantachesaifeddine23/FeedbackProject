<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Helpers\AdminHelper;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use App\Mail\AdminTwoFACodeMail;


class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        Log::info('Tentative de login pour : '.$request->email);

        if (AdminHelper::isAdminEmail($request->email)) {
            return $this->startAdminTwoFactorFlow($request);
        }

        try {
            $request->authenticate();
            Log::info('Authentification réussie pour : '.$request->email);
        } catch (\Exception $e) {
            Log::error('Erreur d\'authentification : '.$e->getMessage());
            return back()->withErrors([
                'email' => 'Identifiants incorrects ou problème de session.',
            ]);
        }

        // Regénérer la session
        $request->session()->regenerate();
        Log::info('Session ID après login : '.$request->session()->getId());

        $user = Auth::user();

        // Vérifier si c'est l'admin et rediriger vers le dashboard admin
        if (AdminHelper::isAdmin($user)) {
            return redirect()->intended(route('admin.dashboard', absolute: false));
        }

        // Sinon, rediriger vers le dashboard normal (entreprises)
        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Déclenche le flux 2FA pour l'admin sans créer de session complète.
     */
    private function startAdminTwoFactorFlow(LoginRequest $request): RedirectResponse
    {
        // Appliquer le même rate limiting que LoginRequest::authenticate
        $request->ensureIsNotRateLimited();

        $credentials = $request->only('email', 'password');

        if (! Auth::validate($credentials)) {
            RateLimiter::hit($request->throttleKey());

            return back()->withErrors([
                'email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($request->throttleKey());

        $code = (string) random_int(100000, 999999);

        // Stockage éphémère du code (hashé) pour 30s
        Cache::put(
            $this->twoFactorCacheKey($credentials['email']),
            ['hash' => Hash::make($code)],
            now()->addSeconds(30)
        );

        // On mémorise l'intention de connexion pour la phase 2FA
        $request->session()->put('admin_2fa_pending', [
            'email' => $credentials['email'],
            'remember' => $request->boolean('remember'),
        ]);

        Mail::to(AdminHelper::ADMIN_EMAIL)->send(new AdminTwoFACodeMail($code));

        Log::info('Code 2FA envoyé pour : '.$credentials['email']);

        return redirect()->route('admin.2fa.show')->with('status', 'Code de vérification envoyé par email (valide 30 secondes).');
    }

    private function twoFactorCacheKey(string $email): string
    {
        return 'admin_2fa_code_'.md5(strtolower($email));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
