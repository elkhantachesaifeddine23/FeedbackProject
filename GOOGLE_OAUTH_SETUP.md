# Google Business Profile Integration Setup

This document details the Google Business Profile API integration for the feedback system.

## Overview

The application integrates with Google Business Profile (formerly Google My Business) to:
- Allow companies to connect their Google accounts via OAuth 2.0
- Automatically fetch and sync reviews from Google Business Profile
- Track review sources (manual requests vs. Google imports)
- Enable replies to Google reviews

## Architecture

### Services

#### GoogleOAuthService (`app/Services/GoogleOAuthService.php`)
Handles OAuth 2.0 token management:
- **getAuthorizationUrl()** - Generate Google login/consent URL
- **exchangeCodeForTokens(code)** - Exchange authorization code for access/refresh tokens
- **refreshAccessToken(refreshToken)** - Refresh expired access tokens
- **revokeToken(token)** - Disconnect OAuth (revoke token)

#### GoogleBusinessProfileService (`app/Services/GoogleBusinessProfileService.php`)
Handles Google API interactions:
- **fetchReviews()** - Fetch all reviews from connected account
- **fetchLocationReviews(accessToken, locationId)** - Fetch reviews for specific location
- **syncReviews()** - Synchronize reviews to database as Feedback records
- **replyToReview(reviewId, replyText)** - Post reply to Google review

### Controllers

#### GoogleAuthController (`app/Http/Controllers/GoogleAuthController.php`)
Manages OAuth flow:
- **redirect()** - Redirect user to Google OAuth consent screen
- **callback()** - Handle OAuth callback and store tokens
- **disconnect()** - Revoke OAuth and clear tokens
- **syncReviews()** - Manually trigger review synchronization

### Database

#### Companies Table Additions
```sql
google_oauth_token         -- Encrypted access token
google_oauth_refresh_token -- Refresh token for renewal
google_oauth_expires_at    -- Token expiration timestamp
google_business_profile_connected -- Connection status boolean
google_business_profile_id -- Google account/location ID
google_last_sync_at        -- Last synchronization timestamp
```

#### Feedback Table Additions
```sql
source           -- enum('manual', 'google') - origin of review
google_review_id -- Google's unique review identifier
google_synced_at -- When review was imported from Google
```

### Routes

```
GET  /google/auth/connect          google.auth.connect
GET  /google/auth/callback         google.auth.callback
POST /google/auth/disconnect       google.auth.disconnect
POST /google/auth/sync             google.auth.sync
```

All routes require authentication (`auth`, `verified` middleware).

## Environment Setup

### 1. Google Cloud Console Setup

1. Create a new project in Google Cloud Console
2. Enable Google Business Profile API (or use a similar API for profile access)
3. Create OAuth 2.0 credentials (Desktop application)
4. Set authorized redirect URI: `{APP_URL}/google/auth/callback`
5. Configure OAuth consent screen with required scopes

### 2. Environment Variables

Add to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=${APP_URL}/google/auth/callback
```

### 3. Verify Configuration

Check that `config/services.php` has Google configuration:

```php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect_uri' => env('GOOGLE_REDIRECT_URI', env('APP_URL') . '/google/auth/callback'),
],
```

## Frontend Integration

### Settings Page Component

The `GoogleBusinessProfileSection.jsx` component is included in the Settings page under the "Intégrations" tab.

Features:
- **Connect Button** - Initiates OAuth flow with Google
- **Sync Reviews Button** - Manually trigger review synchronization
- **Disconnect Button** - Revoke OAuth and clear tokens
- **Connection Status** - Shows connected status and last sync timestamp

```jsx
import GoogleBusinessProfileSection from '@/Components/GoogleBusinessProfileSection';

// In Settings page
<GoogleBusinessProfileSection company={company} auth={auth} />
```

## Usage

### Manual OAuth Connection

1. User clicks "Connect with Google" in Settings → Intégrations
2. Redirected to Google OAuth consent screen
3. User authorizes the application
4. Tokens stored in `companies` table (encrypted)
5. Connection status updated to `true`

### Review Synchronization

#### Via Frontend
- Click "Sync Reviews" button in Settings

#### Via Artisan Command
```bash
# Sync all connected companies
php artisan google:sync-reviews

# Sync specific company
php artisan google:sync-reviews --company-id=1
```

#### Via Job
```php
dispatch(new SyncGoogleReviewsJob($company));
```

### Review Data Structure

Synced reviews create:
1. **FeedbackRequest** - parent container with metadata
2. **Feedback** - actual review with rating/comment and source tracking

```php
$feedback = Feedback::where('source', 'google')
    ->where('google_review_id', $reviewId)
    ->first();
```

## API Scopes

The application requests the following OAuth scopes:
- `https://www.googleapis.com/auth/business.manage` - Manage business information
- `https://www.googleapis.com/auth/businesscommunications` - Business communications

## Token Management

### Automatic Refresh
- Tokens are checked before each API call
- Expired tokens are automatically refreshed using refresh token
- Refresh tokens are stored encrypted in database

### Token Expiration
- Access tokens typically expire in 1 hour
- `google_oauth_expires_at` tracks expiration
- Refresh tokens don't expire but can be revoked

### Token Security
- All tokens are encrypted using Laravel's `Crypt` facade
- Company model `fillable` includes OAuth columns
- Sensitive data not exposed in frontend props

## Error Handling

All services include comprehensive error logging:

```php
Log::info('Google reviews synced', [
    'company_id' => $company->id,
    'synced' => $synced,
    'skipped' => $skipped,
]);

Log::error('Failed to fetch Google reviews', [
    'company_id' => $company->id,
    'error' => $e->getMessage(),
]);
```

## Troubleshooting

### "Invalid authorization code" error
- Redirect URI mismatch between code generation and token exchange
- Verify `GOOGLE_REDIRECT_URI` environment variable matches Google Console

### "Undefined table: feedbacks" migration error
- Feedback table is named `feedback` (singular), not `feedbacks`
- Migrations reference correct table name: `Schema::table('feedback', ...)`

### No reviews syncing
1. Verify company has `google_business_profile_connected = true`
2. Check access token is valid and not expired
3. Confirm Google account has published reviews
4. Check application logs for API errors

### Token refresh failing
- Refresh token may have been revoked by user in Google settings
- User must re-connect via OAuth flow
- Click "Disconnect" then "Connect with Google" to re-authorize

## Migration Files

```
database/migrations/
├── 2026_02_27_155207_add_google_oauth_to_companies_table.php
└── 2026_02_27_155211_add_source_to_feedbacks_table.php
```

Run migrations:
```bash
php artisan migrate
```

## API Endpoints Called

- `https://oauth2.googleapis.com/token` - Token exchange and refresh
- `https://mybusinessaccountmanagement.googleapis.com/v1/accounts/{accountId}/locations` - List locations
- `https://mybusiness.googleapis.com/v4/{locationId}/reviews` - Get reviews
- `https://mybusiness.googleapis.com/v4/reviews/{reviewId}/reply` - Post review reply

## Related Files

- [GoogleOAuthService](app/Services/GoogleOAuthService.php)
- [GoogleBusinessProfileService](app/Services/GoogleBusinessProfileService.php)
- [GoogleAuthController](app/Http/Controllers/GoogleAuthController.php)
- [SyncGoogleReviewsJob](app/Jobs/SyncGoogleReviewsJob.php)
- [SyncGoogleReviewsCommand](app/Console/Commands/SyncGoogleReviewsCommand.php)
- [GoogleBusinessProfileSection Component](resources/js/Components/GoogleBusinessProfileSection.jsx)
- [Settings Page](resources/js/Pages/Settings/Index.jsx)
