<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class GoogleOAuthService
{
    private Client $client;
    private string $clientId;
    private string $clientSecret;
    private string $redirectUri;

    public function __construct()
    {
        $this->client = new Client();
        $this->clientId = config('services.google.client_id');
        $this->clientSecret = config('services.google.client_secret');
        $this->redirectUri = config('services.google.redirect_uri');
    }

    /**
     * Générer l'URL d'authentification Google
     */
    public function getAuthorizationUrl(): string
    {
        $params = [
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => implode(' ', [
                'https://www.googleapis.com/auth/business.manage',
                'https://www.googleapis.com/auth/businesscommunications',
            ]),
            'access_type' => 'offline',
            'prompt' => 'consent',
        ];

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
    }

    /**
     * Échanger le code pour obtenir les tokens
     */
    public function exchangeCodeForTokens(string $code): ?array
    {
        try {
            $response = $this->client->post('https://oauth2.googleapis.com/token', [
                'form_params' => [
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                    'code' => $code,
                    'grant_type' => 'authorization_code',
                    'redirect_uri' => $this->redirectUri,
                ],
            ]);

            $data = json_decode($response->getBody(), true);

            Log::info('Google OAuth tokens exchanged successfully');

            return [
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'expires_in' => $data['expires_in'] ?? 3600,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to exchange code for tokens', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Rafraîchir le token d'accès
     */
    public function refreshAccessToken(string $refreshToken): ?array
    {
        try {
            $response = $this->client->post('https://oauth2.googleapis.com/token', [
                'form_params' => [
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                    'refresh_token' => $refreshToken,
                    'grant_type' => 'refresh_token',
                ],
            ]);

            $data = json_decode($response->getBody(), true);

            Log::info('Google OAuth token refreshed successfully');

            return [
                'access_token' => $data['access_token'],
                'expires_in' => $data['expires_in'] ?? 3600,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to refresh token', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Révoquer le token (déconnecter)
     */
    public function revokeToken(string $token): bool
    {
        try {
            $this->client->post('https://oauth2.googleapis.com/revoke', [
                'form_params' => [
                    'token' => $token,
                ],
            ]);

            Log::info('Google OAuth token revoked successfully');

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to revoke token', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
