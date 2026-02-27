<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Services\GoogleOAuthService;
use App\Services\GoogleBusinessProfileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class GoogleAuthController extends Controller
{
    /**
     * Redirection vers Google OAuth
     */
    public function redirect(): \Illuminate\Http\RedirectResponse
    {
        $company = Auth::user()->company;

        if (!$company) {
            return redirect()->back()->with('error', 'No company found for user');
        }

        $oauthService = new GoogleOAuthService();
        $authUrl = $oauthService->getAuthorizationUrl();

        // Sauvegarder l'état pour éviter les attaques CSRF
        session(['google_oauth_state' => \Illuminate\Support\Str::random(40)]);

        return redirect($authUrl);
    }

    /**
     * Callback depuis Google OAuth
     */
    public function callback(Request $request): \Illuminate\Http\RedirectResponse
    {
        $company = Auth::user()->company;

        if (!$company) {
            return redirect()->route('settings.index')->with('error', 'No company found');
        }

        // Vérifier les erreurs de Google
        if ($request->has('error')) {
            Log::warning('Google OAuth error', [
                'error' => $request->get('error'),
                'error_description' => $request->get('error_description'),
            ]);

            return redirect()->route('settings.index')->with('error', 'Google OAuth rejected: ' . $request->get('error'));
        }

        // Obtenir le code d'autorisation
        $code = $request->get('code');

        if (!$code) {
            return redirect()->route('settings.index')->with('error', 'No authorization code received');
        }

        try {
            $oauthService = new GoogleOAuthService();
            $tokens = $oauthService->exchangeCodeForTokens($code);

            if (!$tokens) {
                return redirect()->route('settings.index')->with('error', 'Failed to exchange authorization code');
            }

            // Extraire les données Google (simplifié - en production utiliser le user API)
            $company->update([
                'google_oauth_token' => $tokens['access_token'],
                'google_oauth_refresh_token' => $tokens['refresh_token'] ?? $company->google_oauth_refresh_token,
                'google_oauth_expires_at' => now()->addSeconds($tokens['expires_in']),
                'google_business_profile_connected' => true,
            ]);

            Log::info('Google OAuth connected successfully', [
                'company_id' => $company->id,
            ]);

            return redirect()->route('settings.index')->with('success', 'Google Business Profile connected successfully!');
        } catch (\Exception $e) {
            Log::error('Failed to exchange Google OAuth token', [
                'error' => $e->getMessage(),
                'company_id' => $company->id,
            ]);

            return redirect()->route('settings.index')->with('error', 'Failed to connect Google: ' . $e->getMessage());
        }
    }

    /**
     * Déconnecter Google OAuth
     */
    public function disconnect(): \Illuminate\Http\RedirectResponse
    {
        $company = Auth::user()->company;

        if (!$company) {
            return redirect()->back()->with('error', 'No company found');
        }

        try {
            $oauthService = new GoogleOAuthService();

            // Révoquer le token si disponible
            if ($company->google_oauth_token) {
                $oauthService->revokeToken($company->google_oauth_token);
            }

            // Nettoyer les colonnes OAuth
            $company->update([
                'google_oauth_token' => null,
                'google_oauth_refresh_token' => null,
                'google_oauth_expires_at' => null,
                'google_business_profile_connected' => false,
                'google_business_profile_id' => null,
                'google_last_sync_at' => null,
            ]);

            Log::info('Google OAuth disconnected', [
                'company_id' => $company->id,
            ]);

            return redirect()->back()->with('success', 'Google Business Profile disconnected');
        } catch (\Exception $e) {
            Log::error('Failed to disconnect Google OAuth', [
                'error' => $e->getMessage(),
                'company_id' => $company->id,
            ]);

            return redirect()->back()->with('error', 'Failed to disconnect: ' . $e->getMessage());
        }
    }

    /**
     * Synchroniser les avis Google
     */
    public function syncReviews(): \Illuminate\Http\RedirectResponse
    {
        $company = Auth::user()->company;

        if (!$company || !$company->google_business_profile_connected) {
            return redirect()->back()->with('error', 'Google Business Profile not connected');
        }

        try {
            $service = new \App\Services\GoogleBusinessProfileService($company);
            $result = $service->syncReviews();

            return redirect()->back()->with('success', "Synced {$result['synced']} reviews, skipped {$result['skipped']}");
        } catch (\Exception $e) {
            Log::error('Failed to sync reviews', [
                'error' => $e->getMessage(),
                'company_id' => $company->id,
            ]);

            return redirect()->back()->with('error', 'Failed to sync reviews: ' . $e->getMessage());
        }
    }
}
