<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Feedback;
use App\Models\FeedbackRequest;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class GoogleBusinessProfileService
{
    private Client $client;
    private Company $company;

    // Places API (New) — fonctionne immédiatement
    private const PLACES_API_NEW = 'https://places.googleapis.com/v1';
    // Places API Legacy — supporte reviews_sort=newest
    private const PLACES_API_LEGACY = 'https://maps.googleapis.com/maps/api/place';
    // GBP APIs (nécessitent approbation Google)
    private const ACCOUNT_API = 'https://mybusinessaccountmanagement.googleapis.com/v1';
    private const BUSINESS_API = 'https://mybusinessbusinessinformation.googleapis.com/v1';
    private const MY_BUSINESS_API = 'https://mybusiness.googleapis.com/v4';

    public function __construct(Company $company)
    {
        $this->client = new Client(['http_errors' => false]);
        $this->company = $company;
    }

    // ─── Helpers ────────────────────────────────────────

    private function mapStarRating($starRating): ?int
    {
        if (is_int($starRating) || is_float($starRating)) {
            $v = (int) $starRating;
            return ($v >= 1 && $v <= 5) ? $v : null;
        }
        return match ($starRating) {
            'ONE' => 1, 'TWO' => 2, 'THREE' => 3, 'FOUR' => 4, 'FIVE' => 5,
            default => null,
        };
    }

    private function getApiKey(): ?string
    {
        return config('services.google.api_key');
    }

    private function getValidAccessToken(): ?string
    {
        if (!$this->company->google_oauth_token) return null;
        if ($this->company->google_oauth_expires_at && $this->company->google_oauth_expires_at->isPast()) {
            if ($this->company->google_oauth_refresh_token) {
                $this->refreshToken();
            } else {
                return null;
            }
        }
        return $this->company->google_oauth_token;
    }

    private function refreshToken(): void
    {
        $oauthService = new GoogleOAuthService();
        $result = $oauthService->refreshAccessToken($this->company->google_oauth_refresh_token);
        if ($result) {
            $this->company->update([
                'google_oauth_token' => $result['access_token'],
                'google_oauth_expires_at' => now()->addSeconds($result['expires_in']),
            ]);
            $this->company->refresh();
        }
    }

    /**
     * Nom à chercher sur Google Maps : google_maps_name > name
     */
    private function getSearchName(): string
    {
        return $this->company->google_maps_name ?: $this->company->name;
    }

    // ═══════════════════════════════════════════════════════
    //  ÉTAPE 1 : RÉSOUDRE LE PLACE ID
    //  Chercher l'établissement sur Google Maps par nom
    // ═══════════════════════════════════════════════════════

    public function resolveOrSearchPlaceId(): ?string
    {
        // Si on a déjà un place_id, on le réutilise
        if ($this->company->google_place_id) {
            return $this->company->google_place_id;
        }

        // Chercher par nom
        return $this->searchPlaceId();
    }

    /**
     * Chercher un établissement via Places API (New) — Text Search
     */
    public function searchPlaceId(?string $query = null): ?string
    {
        $apiKey = $this->getApiKey();
        if (!$apiKey) {
            throw new \RuntimeException("Clé API Google non configurée (GOOGLE_API_KEY dans .env)");
        }

        $searchQuery = $query ?? $this->getSearchName();

        $response = $this->client->post(self::PLACES_API_NEW . '/places:searchText', [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Goog-Api-Key' => $apiKey,
                'X-Goog-FieldMask' => 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount',
            ],
            'json' => [
                'textQuery' => $searchQuery,
                'maxResultCount' => 1,
            ],
        ]);

        $statusCode = $response->getStatusCode();
        $body = json_decode($response->getBody(), true);

        Log::info('Places searchText', ['query' => $searchQuery, 'status' => $statusCode]);

        if ($statusCode !== 200) {
            $errMsg = $body['error']['message'] ?? "HTTP {$statusCode}";
            if (str_contains($errMsg, 'Billing') || str_contains($errMsg, 'billing')) {
                throw new \RuntimeException(
                    "Activez la facturation Google Cloud (gratuit: \$200/mois) : "
                    . "https://console.cloud.google.com/billing/linkedaccount"
                );
            }
            if ($statusCode === 403) {
                throw new \RuntimeException(
                    "Activez 'Places API (New)' : "
                    . "https://console.developers.google.com/apis/api/places.googleapis.com/overview"
                );
            }
            throw new \RuntimeException("Erreur Places API: {$errMsg}");
        }

        $places = $body['places'] ?? [];
        if (empty($places)) {
            throw new \RuntimeException(
                "Aucun établissement trouvé pour '{$searchQuery}'. "
                . "Configurez le nom exact de votre business Google Maps dans les paramètres."
            );
        }

        $placeId = $places[0]['id'];
        $placeName = $places[0]['displayName']['text'] ?? $searchQuery;

        // Sauvegarder
        $this->company->update(['google_place_id' => $placeId]);
        $this->company->refresh();

        Log::info('Place found and saved', [
            'place_id' => $placeId,
            'name' => $placeName,
            'rating' => $places[0]['rating'] ?? null,
            'total_reviews' => $places[0]['userRatingCount'] ?? null,
        ]);

        return $placeId;
    }

    // ═══════════════════════════════════════════════════════
    //  ÉTAPE 2 : RÉCUPÉRER TOUS LES AVIS POSSIBLES
    //  Combine Places API New + Legacy API (most_relevant + newest)
    //  pour maximiser la couverture des avis récupérés
    // ═══════════════════════════════════════════════════════

    public function fetchReviews(): array
    {
        $placeId = $this->resolveOrSearchPlaceId();
        if (!$placeId) {
            throw new \RuntimeException("Aucun Place ID configuré. Allez dans Paramètres > Intégrations.");
        }

        $apiKey = $this->getApiKey();
        if (!$apiKey) {
            throw new \RuntimeException("Clé API Google non configurée (GOOGLE_API_KEY dans .env)");
        }

        $allReviews = [];
        $seenKeys = [];

        // ─── Source 1 : Places API (New) — avis les plus pertinents ───
        try {
            $reviews1 = $this->fetchReviewsFromPlacesNew($placeId, $apiKey);
            foreach ($reviews1 as $r) {
                $key = $this->reviewDeduplicationKey($r);
                if (!isset($seenKeys[$key])) {
                    $seenKeys[$key] = true;
                    $allReviews[] = $r;
                }
            }
            Log::info('Places API New: ' . count($reviews1) . ' reviews');
        } catch (\Exception $e) {
            Log::warning('Places API New failed', ['error' => $e->getMessage()]);
        }

        // ─── Source 2 : Legacy API — most_relevant ───
        try {
            $reviews2 = $this->fetchReviewsFromLegacy($placeId, $apiKey, 'most_relevant');
            foreach ($reviews2 as $r) {
                $key = $this->reviewDeduplicationKey($r);
                if (!isset($seenKeys[$key])) {
                    $seenKeys[$key] = true;
                    $allReviews[] = $r;
                }
            }
            Log::info('Legacy most_relevant: ' . count($reviews2) . ' reviews');
        } catch (\Exception $e) {
            Log::warning('Legacy most_relevant failed', ['error' => $e->getMessage()]);
        }

        // ─── Source 3 : Legacy API — newest (pour capter les nouveaux avis) ───
        try {
            $reviews3 = $this->fetchReviewsFromLegacy($placeId, $apiKey, 'newest');
            foreach ($reviews3 as $r) {
                $key = $this->reviewDeduplicationKey($r);
                if (!isset($seenKeys[$key])) {
                    $seenKeys[$key] = true;
                    $allReviews[] = $r;
                }
            }
            Log::info('Legacy newest: ' . count($reviews3) . ' reviews');
        } catch (\Exception $e) {
            Log::warning('Legacy newest failed', ['error' => $e->getMessage()]);
        }

        Log::info('Total unique reviews fetched', ['count' => count($allReviews)]);

        if (empty($allReviews)) {
            throw new \RuntimeException("Aucun avis trouvé. Vérifiez que votre établissement a des avis sur Google Maps.");
        }

        return $allReviews;
    }

    /**
     * Clé de déduplication basée sur auteur + note + début du commentaire
     */
    private function reviewDeduplicationKey(array $review): string
    {
        $author = $review['reviewer']['displayName'] ?? '';
        $rating = $review['starRating'] ?? '';
        $comment = mb_substr($review['comment'] ?? '', 0, 50);
        return md5($author . '|' . $rating . '|' . $comment);
    }

    /**
     * Places API (New) — retourne jusqu'à 5 avis pertinents
     */
    private function fetchReviewsFromPlacesNew(string $placeId, string $apiKey): array
    {
        $response = $this->client->get(self::PLACES_API_NEW . "/places/{$placeId}", [
            'headers' => [
                'X-Goog-Api-Key' => $apiKey,
                'X-Goog-FieldMask' => 'id,displayName,rating,userRatingCount,reviews',
            ],
        ]);

        $statusCode = $response->getStatusCode();
        $body = json_decode($response->getBody(), true);
        if ($statusCode !== 200) return [];

        $formatted = [];
        foreach ($body['reviews'] ?? [] as $review) {
            $authorName = $review['authorAttribution']['displayName'] ?? 'Client Google';
            $publishTime = $review['publishTime'] ?? null;
            $text = $review['originalText']['text'] ?? $review['text']['text'] ?? null;

            $formatted[] = [
                'reviewer' => [
                    'displayName' => $authorName,
                    'profilePhotoUrl' => $review['authorAttribution']['photoUri'] ?? null,
                ],
                'starRating' => $review['rating'] ?? null,
                'comment' => $text,
                'createTime' => $publishTime,
                '_source' => 'places_new',
                '_googleName' => $review['name'] ?? null,
            ];
        }
        return $formatted;
    }

    /**
     * Legacy Places API — supporte reviews_sort=newest|most_relevant
     * Retourne jusqu'à 5 avis par sort order
     */
    private function fetchReviewsFromLegacy(string $placeId, string $apiKey, string $sort = 'most_relevant'): array
    {
        $url = self::PLACES_API_LEGACY . "/details/json";
        $response = $this->client->get($url, [
            'query' => [
                'place_id' => $placeId,
                'fields' => 'name,rating,user_ratings_total,reviews',
                'reviews_sort' => $sort,
                'reviews_no_translations' => 'true',
                'key' => $apiKey,
            ],
        ]);

        $statusCode = $response->getStatusCode();
        $body = json_decode($response->getBody(), true);
        if ($statusCode !== 200 || ($body['status'] ?? '') !== 'OK') return [];

        $formatted = [];
        foreach ($body['result']['reviews'] ?? [] as $review) {
            $formatted[] = [
                'reviewer' => [
                    'displayName' => $review['author_name'] ?? 'Client Google',
                    'profilePhotoUrl' => $review['profile_photo_url'] ?? null,
                ],
                'starRating' => $review['rating'] ?? null,
                'comment' => $review['text'] ?? null,
                'createTime' => isset($review['time']) ? date('c', $review['time']) : null,
                '_source' => 'places_legacy_' . $sort,
                '_googleName' => null,
            ];
        }
        return $formatted;
    }

    // ═══════════════════════════════════════════════════════
    //  ÉTAPE 3 : SYNCHRONISATION EN BASE DE DONNÉES
    // ═══════════════════════════════════════════════════════

    public function syncReviews(): array
    {
        $reviews = $this->fetchReviews();
        $synced = 0;
        $skipped = 0;
        $errors = [];

        foreach ($reviews as $review) {
            try {
                $reviewerName = $review['reviewer']['displayName'] ?? 'Client Google';
                $comment = $review['comment'] ?? null;
                $rating = $this->mapStarRating($review['starRating'] ?? null);
                $createTime = $review['createTime'] ?? null;

                // ID unique stable : auteur + note + date (si dispo) + début commentaire
                $uniqueKey = $reviewerName . '|' . ($rating ?? '') . '|' . ($createTime ?? '') . '|' . mb_substr($comment ?? '', 0, 100);
                $uniqueId = 'grev_' . md5($uniqueKey);

                // Vérifier doublon
                $existing = Feedback::where('google_review_id', $uniqueId)->first();
                if ($existing) {
                    $skipped++;
                    continue;
                }

                // Vérifier aussi par contenu (au cas où l'ID aurait changé entre syncs)
                $existingByContent = Feedback::where('comment', $comment)
                    ->where('rating', $rating)
                    ->where('source', 'google')
                    ->whereHas('feedbackRequest', function ($q) use ($reviewerName) {
                        $q->where('company_id', $this->company->id)
                          ->where('recipient_name', $reviewerName);
                    })
                    ->first();

                if ($existingByContent) {
                    $skipped++;
                    continue;
                }

                $feedbackRequest = FeedbackRequest::create([
                    'company_id' => $this->company->id,
                    'customer_id' => null,
                    'channel' => 'google',
                    'token' => \Illuminate\Support\Str::uuid(),
                    'status' => 'completed',
                    'sent_at' => $createTime ? \Carbon\Carbon::parse($createTime) : now(),
                    'responded_at' => $createTime ? \Carbon\Carbon::parse($createTime) : now(),
                    'feedback_text' => $comment,
                    'recipient_name' => $reviewerName,
                ]);

                Feedback::create([
                    'feedback_request_id' => $feedbackRequest->id,
                    'rating' => $rating,
                    'comment' => $comment,
                    'source' => 'google',
                    'google_review_id' => $uniqueId,
                    'google_synced_at' => now(),
                ]);

                $synced++;
                Log::info('Review synced', ['reviewer' => $reviewerName, 'rating' => $rating]);
            } catch (\Exception $e) {
                $errors[] = ($review['reviewer']['displayName'] ?? 'unknown') . ': ' . $e->getMessage();
                Log::error('Failed to sync review', ['error' => $e->getMessage()]);
            }
        }

        $this->company->update(['google_last_sync_at' => now()]);

        Log::info('Sync completed', [
            'company_id' => $this->company->id,
            'synced' => $synced,
            'skipped' => $skipped,
            'errors' => count($errors),
        ]);

        return ['synced' => $synced, 'skipped' => $skipped, 'errors' => $errors];
    }

    // ─── Répondre à un avis (GBP only — nécessite approbation) ───

    public function replyToReview(string $reviewName, string $replyText): bool
    {
        $accessToken = $this->getValidAccessToken();
        if (!$accessToken) return false;

        try {
            $url = self::MY_BUSINESS_API . "/{$reviewName}/reply";
            $response = $this->client->put($url, [
                'headers' => [
                    'Authorization' => "Bearer {$accessToken}",
                    'Content-Type' => 'application/json',
                ],
                'json' => ['comment' => $replyText],
            ]);
            return $response->getStatusCode() >= 200 && $response->getStatusCode() < 300;
        } catch (\Exception $e) {
            Log::error('Reply failed', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
