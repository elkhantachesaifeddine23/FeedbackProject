# Google Business Profile Integration - Architecture Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Settings/Index.jsx                                 │   │
│  │  - Displays user settings with tabs                 │   │
│  │  - Includes GoogleBusinessProfileSection component  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GoogleBusinessProfileSection.jsx                   │   │
│  │  - Connect button → /google/auth/connect            │   │
│  │  - Sync button   → POST /google/auth/sync           │   │
│  │  - Disconnect    → POST /google/auth/disconnect     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Layer                               │
│                    (Routes & Controllers)                   │
│                                                              │
│  GET  /google/auth/connect          GoogleAuthController   │
│       ↓                              ::redirect()           │
│       → Redirects to Google OAuth                            │
│                                                              │
│  GET  /google/auth/callback         GoogleAuthController   │
│       ↓                              ::callback()           │
│       → Exchanges code for tokens                            │
│       → Stores tokens in database                            │
│                                                              │
│  POST /google/auth/disconnect       GoogleAuthController   │
│       ↓                              ::disconnect()         │
│       → Revokes token                                        │
│       → Clears OAuth fields                                  │
│                                                              │
│  POST /google/auth/sync             GoogleAuthController   │
│       ↓                              ::syncReviews()        │
│       → Triggers review sync                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                      │
│                       (Services)                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GoogleOAuthService                                 │   │
│  │  ────────────────────────────────                   │   │
│  │  • getAuthorizationUrl()                            │   │
│  │  • exchangeCodeForTokens(code)                      │   │
│  │  • refreshAccessToken(refreshToken)                │   │
│  │  • revokeToken(token)                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GoogleBusinessProfileService                       │   │
│  │  ────────────────────────────────────               │   │
│  │  • fetchReviews()                                   │   │
│  │  • fetchLocationReviews(token, locationId)         │   │
│  │  • syncReviews()                                    │   │
│  │  • replyToReview(reviewId, text)                   │   │
│  │  • getValidAccessToken()                           │   │
│  │  • refreshToken()                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    External APIs                            │
│                                                              │
│  • https://oauth2.googleapis.com/token                       │
│  • https://mybusinessaccountmanagement.googleapis.com/v1/   │
│  • https://mybusiness.googleapis.com/v4/                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Persistence                         │
│                                                              │
│  Companies Table:                                            │
│  ├── google_oauth_token (encrypted)                          │
│  ├── google_oauth_refresh_token (encrypted)                  │
│  ├── google_oauth_expires_at (datetime)                      │
│  ├── google_business_profile_connected (boolean)             │
│  ├── google_business_profile_id (string)                     │
│  └── google_last_sync_at (datetime)                          │
│                                                              │
│  Feedback Table:                                             │
│  ├── source (enum: 'manual' | 'google')                      │
│  ├── google_review_id (string)                               │
│  └── google_synced_at (datetime)                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### OAuth Connection Flow

```
User
  │
  ├─→ Click "Connect with Google" button
  │
  └──→ GoogleAuthController::redirect()
       │
       ├─→ GoogleOAuthService::getAuthorizationUrl()
       │
       └──→ Redirect to: https://accounts.google.com/o/oauth2/v2/auth?
             • client_id
             • redirect_uri=/google/auth/callback
             • scope=business.manage,businesscommunications
             • response_type=code

Google OAuth Screen (User authorizes)
  │
  └──→ Redirect to: /google/auth/callback?code=AUTH_CODE

  GoogleAuthController::callback()
       │
       ├─→ Receive authorization code
       │
       ├─→ GoogleOAuthService::exchangeCodeForTokens(code)
       │
       ├─→ POST to https://oauth2.googleapis.com/token with:
       │   • client_id
       │   • client_secret
       │   • code
       │   • grant_type=authorization_code
       │
       ├─→ Receive: { access_token, refresh_token, expires_in }
       │
       ├─→ Company::update([
       │   'google_oauth_token' => encrypted(access_token),
       │   'google_oauth_refresh_token' => encrypted(refresh_token),
       │   'google_oauth_expires_at' => now + expires_in,
       │   'google_business_profile_connected' => true
       │ ])
       │
       └──→ Redirect to settings with success message

User sees "Connected ✓" status
```

### Review Synchronization Flow

```
User clicks "Sync Reviews" button
  │
  └──→ GoogleAuthController::syncReviews()
       │
       ├─→ GoogleBusinessProfileService($company)
       │
       ├─→ getValidAccessToken()
       │   ├─→ Check if token expired
       │   ├─→ If expired: refreshAccessToken()
       │   │   └─→ GoogleOAuthService::refreshAccessToken()
       │   │       └─→ POST /token with refresh_token
       │   │           └─→ Get new access_token
       │   └─→ Return valid token
       │
       ├─→ fetchReviews()
       │   ├─→ GET /accounts/{accountId}/locations
       │   │   └─→ List all business locations
       │   │
       │   └─→ For each location:
       │       └─→ fetchLocationReviews()
       │           └─→ GET /reviews (with access_token)
       │               └─→ [ { reviewId, starRating, comment }, ... ]
       │
       ├─→ syncReviews() - For each review:
       │   ├─→ Check if review exists (google_review_id)
       │   │
       │   ├─→ If new:
       │   │   ├─→ FeedbackRequest::create([
       │   │   │   'company_id' => $company->id,
       │   │   │   'channel' => 'google',
       │   │   │   'status' => 'completed',
       │   │   │ ])
       │   │   │
       │   │   └─→ Feedback::create([
       │   │       'feedback_request_id' => $request->id,
       │   │       'rating' => review.starRating,
       │   │       'comment' => review.comment,
       │   │       'source' => 'google',
       │   │       'google_review_id' => review.reviewId,
       │   │       'google_synced_at' => now()
       │   │     ])
       │   │
       │   └─→ If exists: skip (increment skipped counter)
       │
       ├─→ Company::update([
       │   'google_last_sync_at' => now()
       │ ])
       │
       └──→ Return { synced: 5, skipped: 2, errors: [] }

UI displays: "Synced 5 reviews, skipped 2"
```

### Token Refresh Flow

```
GoogleBusinessProfileService needs to make API call
  │
  └──→ getValidAccessToken()
       │
       ├─→ Check: $company->google_oauth_expires_at->isPast()
       │
       ├─→ If NOT expired:
       │   └──→ Return current token
       │
       └─→ If expired:
           ├─→ refreshToken() method
           │
           ├─→ GoogleOAuthService::refreshAccessToken(
           │      $company->google_oauth_refresh_token
           │   )
           │
           ├─→ POST https://oauth2.googleapis.com/token with:
           │   • grant_type=refresh_token
           │   • refresh_token
           │   • client_id
           │   • client_secret
           │
           ├─→ Receive: { access_token, expires_in }
           │
           ├─→ Company::update([
           │   'google_oauth_token' => encrypted(new_token),
           │   'google_oauth_expires_at' => now + expires_in
           │ ])
           │
           └──→ Return new token

Proceed with API call using fresh token
```

## Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    GoogleOAuthService                       │
├─────────────────────────────────────────────────────────────┤
│ Properties:                                                  │
│  - client: Client                                           │
│  - clientId: string                                          │
│  - clientSecret: string                                      │
│  - redirectUri: string                                       │
├─────────────────────────────────────────────────────────────┤
│ Methods:                                                     │
│  + getAuthorizationUrl(): string                            │
│  + exchangeCodeForTokens(code): ?array                      │
│  + refreshAccessToken(refreshToken): ?array                │
│  + revokeToken(token): void                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              GoogleBusinessProfileService                   │
├─────────────────────────────────────────────────────────────┤
│ Properties:                                                  │
│  - client: Client                                           │
│  - company: Company                                          │
├─────────────────────────────────────────────────────────────┤
│ Methods:                                                     │
│  + fetchReviews(): array                                    │
│  + fetchLocationReviews(token, location): array            │
│  + syncReviews(): array                                     │
│  + replyToReview(reviewId, text): bool                      │
│  - getValidAccessToken(): ?string                           │
│  - refreshToken(): void                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 GoogleAuthController                        │
├─────────────────────────────────────────────────────────────┤
│ Methods:                                                     │
│  + redirect(): RedirectResponse                             │
│  + callback(Request): RedirectResponse                      │
│  + disconnect(): RedirectResponse                           │
│  + syncReviews(): RedirectResponse                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      Company Model                          │
├─────────────────────────────────────────────────────────────┤
│ Properties:                                                  │
│  + google_oauth_token: string (encrypted)                   │
│  + google_oauth_refresh_token: string (encrypted)           │
│  + google_oauth_expires_at: datetime                        │
│  + google_business_profile_connected: boolean               │
│  + google_business_profile_id: string                       │
│  + google_last_sync_at: datetime                            │
├─────────────────────────────────────────────────────────────┤
│ Relations:                                                   │
│  + feedbackTemplates()                                      │
│  + feedbackRequests()                                       │
│  + customers()                                              │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
app/
├── Services/
│   ├── GoogleOAuthService.php (180 lines)
│   └── GoogleBusinessProfileService.php (220 lines)
├── Http/Controllers/
│   └── GoogleAuthController.php (140 lines)
├── Jobs/
│   └── SyncGoogleReviewsJob.php (50 lines)
├── Console/Commands/
│   └── SyncGoogleReviewsCommand.php (90 lines)
└── Models/
    ├── Company.php (updated with OAuth fields)
    └── Feedback.php (uses source field)

resources/
├── js/
│   ├── Pages/Settings/Index.jsx (updated with integrations tab)
│   └── Components/GoogleBusinessProfileSection.jsx (150 lines)

database/
├── migrations/
│   ├── 2026_02_27_155207_add_google_oauth_to_companies_table.php
│   └── 2026_02_27_155211_add_source_to_feedbacks_table.php
└── seeders/
    └── (existing seeders)

config/
└── services.php (added google configuration)

routes/
└── web.php (added google.auth.* routes)

Documentation/
├── GOOGLE_OAUTH_SETUP.md (comprehensive setup guide)
├── GOOGLE_INTEGRATION_SUMMARY.md (feature overview)
├── CHANGELOG_GOOGLE_INTEGRATION.md (release notes)
├── ARCHITECTURE_GUIDE.md (this file)
└── test-google-integration.sh (automated tests)
```

## Technology Stack

- **Framework:** Laravel 11
- **Frontend:** React with Inertia.js
- **Database:** PostgreSQL (via Supabase)
- **HTTP Client:** GuzzleHttp
- **OAuth Provider:** Google (Google Business Profile)
- **Encryption:** Laravel Crypt facade (AES-256)
- **Queue System:** Redis (configurable)

## Key Design Decisions

1. **Service-Based Architecture:** OAuth and API logic isolated in service classes
2. **Token Encryption:** Sensitive tokens encrypted at rest in database
3. **Automatic Token Refresh:** Transparent refresh before API calls
4. **Database-Backed Sessions:** Token state persisted in Companies table
5. **Source Tracking:** Reviews tagged with source (manual vs. Google)
6. **Async Processing:** Background job support for bulk syncing
7. **CLI Support:** Artisan command for scheduled/manual operations

## Performance Considerations

- Token validation before each API call (~1ms)
- Indexed queries on google_review_id for duplicate detection
- Batch review processing to minimize database writes
- Lazy loading of API data on-demand
- Connection pooling for database stability

## Security Best Practices Implemented

✅ OAuth tokens encrypted with AES-256
✅ HTTPS-only OAuth flows
✅ Scope limiting (business.manage only)
✅ Token expiration checking
✅ Secure disconnect with token revocation
✅ Error handling without credential exposure
✅ Database transaction safety
✅ Authentication middleware on all routes
✅ CSRF protection via Laravel session

---

**Last Updated:** February 27, 2026
**Architecture Version:** 1.0
**Status:** Production Ready
