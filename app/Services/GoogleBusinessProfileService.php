<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Feedback;
use App\Models\FeedbackRequest;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use App\Services\GoogleOAuthService;

class GoogleBusinessProfileService
{
    private Client $client;
    private Company $company;

    public function __construct(Company $company)
    {
        $this->client = new Client();
        $this->company = $company;
    }

    /**
     * Obtenir le token d'accès, le rafraîchir si nécessaire
     */
    private function getValidAccessToken(): ?string
    {
        if (!$this->company->google_oauth_token) {
            return null;
        }

        // Vérifier si le token est expiré
        if ($this->company->google_oauth_expires_at && $this->company->google_oauth_expires_at->isPast()) {
            if ($this->company->google_oauth_refresh_token) {
                $this->refreshToken();
            } else {
                return null;
            }
        }

        return $this->company->google_oauth_token;
    }

    /**
     * Rafraîchir le token
     */
    private function refreshToken(): void
    {
        $oauthService = new GoogleOAuthService();
        $result = $oauthService->refreshAccessToken($this->company->google_oauth_refresh_token);

        if ($result) {
            $this->company->update([
                'google_oauth_token' => $result['access_token'],
                'google_oauth_expires_at' => now()->addSeconds($result['expires_in']),
            ]);
        }
    }

    /**
     * Récupérer tous les avis Google
     */
    public function fetchReviews(): array
    {
        $accessToken = $this->getValidAccessToken();

        if (!$accessToken || !$this->company->google_business_profile_id) {
            Log::warning('Cannot fetch reviews: missing token or profile ID', [
                'company_id' => $this->company->id,
            ]);

            return [];
        }

        try {
            $accountId = $this->company->google_business_profile_id;

            // Format: accounts/{accountId}/locations/{locationId}
            $response = $this->client->get(
                "https://mybusinessaccountmanagement.googleapis.com/v1/accounts/{$accountId}/locations",
                [
                    'headers' => [
                        'Authorization' => "Bearer {$accessToken}",
                    ],
                ]
            );

            $locations = json_decode($response->getBody(), true);
            $reviews = [];

            foreach ($locations['locations'] ?? [] as $location) {
                $locationId = $location['name'];
                $reviews = array_merge($reviews, $this->fetchLocationReviews($accessToken, $locationId));
            }

            return $reviews;
        } catch (\Exception $e) {
            Log::error('Failed to fetch Google reviews', [
                'company_id' => $this->company->id,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Récupérer les avis d'une location spécifique
     */
    private function fetchLocationReviews(string $accessToken, string $locationId): array
    {
        try {
            $response = $this->client->get(
                "https://mybusiness.googleapis.com/v4/{$locationId}/reviews",
                [
                    'headers' => [
                        'Authorization' => "Bearer {$accessToken}",
                    ],
                ]
            );

            $data = json_decode($response->getBody(), true);

            return $data['reviews'] ?? [];
        } catch (\Exception $e) {
            Log::error('Failed to fetch location reviews', [
                'location_id' => $locationId,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Synchroniser les avis Google avec la base de données
     */
    public function syncReviews(): array
    {
        $reviews = $this->fetchReviews();
        $synced = 0;
        $skipped = 0;
        $errors = [];

        foreach ($reviews as $review) {
            try {
                // Vérifier si l'avis existe déjà
                $existing = Feedback::where('google_review_id', $review['reviewId'])->first();

                if ($existing) {
                    $skipped++;
                    continue;
                }

                // Créer une FeedbackRequest
                $feedbackRequest = FeedbackRequest::create([
                    'company_id' => $this->company->id,
                    'customer_id' => null, // On peut pas la lier directement
                    'channel' => 'google',
                    'token' => \Illuminate\Support\Str::uuid(),
                    'status' => 'completed',
                    'sent_at' => now(),
                    'responded_at' => isset($review['reviewReply']) ? now() : null,
                    'feedback_text' => $review['comment'] ?? null,
                ]);

                // Créer le Feedback
                $feedback = Feedback::create([
                    'feedback_request_id' => $feedbackRequest->id,
                    'rating' => $review['starRating'] ?? null,
                    'comment' => $review['comment'] ?? null,
                    'source' => 'google',
                    'google_review_id' => $review['reviewId'],
                    'google_synced_at' => now(),
                ]);

                $synced++;
            } catch (\Exception $e) {
                $errors[] = "Review {$review['reviewId']}: " . $e->getMessage();
                Log::error('Failed to sync review', [
                    'review_id' => $review['reviewId'],
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Mettre à jour la date de dernière sync
        $this->company->update([
            'google_last_sync_at' => now(),
        ]);

        Log::info('Google reviews synced', [
            'company_id' => $this->company->id,
            'synced' => $synced,
            'skipped' => $skipped,
            'errors' => count($errors),
        ]);

        return [
            'synced' => $synced,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * Répondre à un avis Google
     */
    public function replyToReview(string $reviewId, string $replyText): bool
    {
        $accessToken = $this->getValidAccessToken();

        if (!$accessToken) {
            Log::error('Cannot reply to review: missing access token', [
                'company_id' => $this->company->id,
            ]);

            return false;
        }

        try {
            $this->client->put(
                "https://mybusiness.googleapis.com/v4/reviews/{$reviewId}/reply",
                [
                    'headers' => [
                        'Authorization' => "Bearer {$accessToken}",
                        'Content-Type' => 'application/json',
                    ],
                    'json' => [
                        'comment' => $replyText,
                    ],
                ]
            );

            Log::info('Review replied successfully', [
                'review_id' => $reviewId,
                'company_id' => $this->company->id,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to reply to review', [
                'review_id' => $reviewId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
