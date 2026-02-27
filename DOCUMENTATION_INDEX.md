# Google Business Profile Integration - Documentation Index

## 📚 Complete Documentation Suite

This folder contains comprehensive documentation for the Google Business Profile integration. Use this index to navigate.

---

## 🚀 Quick Start

**New to this integration?** Start here:

1. **[GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)** - Setup and Configuration
   - Environment setup
   - Google Cloud Console configuration
   - Running migrations
   - First-time use guide

2. **[test-google-integration.sh](./test-google-integration.sh)** - System Check
   ```bash
   bash test-google-integration.sh
   ```
   Verify all components are properly installed

---

## 📖 Detailed Documentation

### For Developers

**[ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md)**
- System architecture diagrams
- Data flow visualization
- Class relationships
- File structure overview
- Technology stack
- Design decisions

**[GOOGLE_INTEGRATION_SUMMARY.md](./GOOGLE_INTEGRATION_SUMMARY.md)**
- Implementation checklist
- Data flow explanations
- Testing guide
- API endpoints
- Known limitations
- Next steps

### For Project Managers

**[CHANGELOG_GOOGLE_INTEGRATION.md](./CHANGELOG_GOOGLE_INTEGRATION.md)**
- Release notes
- Feature list
- Security enhancements
- UI improvements
- Deployment checklist

---

## 🔧 Implementation Details

### Services

**GoogleOAuthService** (`app/Services/GoogleOAuthService.php`)
```php
$oauth = new GoogleOAuthService();

// Generate Google OAuth URL
$url = $oauth->getAuthorizationUrl();

// Exchange auth code for tokens
$tokens = $oauth->exchangeCodeForTokens($code);

// Refresh expired token
$new_tokens = $oauth->refreshAccessToken($refresh_token);

// Revoke token (disconnect)
$oauth->revokeToken($token);
```

**GoogleBusinessProfileService** (`app/Services/GoogleBusinessProfileService.php`)
```php
$service = new GoogleBusinessProfileService($company);

// Fetch all reviews
$reviews = $service->fetchReviews();

// Sync to database
$result = $service->syncReviews();
// Returns: ['synced' => 5, 'skipped' => 2, 'errors' => []]

// Reply to a review
$service->replyToReview($reviewId, 'Thank you for your review!');
```

### Controllers

**GoogleAuthController** (`app/Http/Controllers/GoogleAuthController.php`)

Routes handled:
- `GET /google/auth/connect` → `redirect()` - Start OAuth flow
- `GET /google/auth/callback` → `callback()` - Handle OAuth callback
- `POST /google/auth/disconnect` → `disconnect()` - Revoke tokens
- `POST /google/auth/sync` → `syncReviews()` - Sync reviews

### Frontend Component

**GoogleBusinessProfileSection.jsx** (`resources/js/Components/GoogleBusinessProfileSection.jsx`)

Features:
- Display connection status
- Connect with Google button
- Manual sync button
- Disconnect button
- Last sync timestamp

Usage in React:
```jsx
import GoogleBusinessProfileSection from '@/Components/GoogleBusinessProfileSection';

<GoogleBusinessProfileSection company={company} auth={auth} />
```

---

## 🗄️ Database

### Companies Table Fields

```sql
-- OAuth Credentials
google_oauth_token              TEXT          -- Encrypted access token
google_oauth_refresh_token      TEXT          -- Encrypted refresh token
google_oauth_expires_at         TIMESTAMP     -- Token expiration time

-- Connection Status
google_business_profile_connected  BOOLEAN    -- Is OAuth connected?
google_business_profile_id      VARCHAR(255)  -- Google account/location ID
google_last_sync_at             TIMESTAMP     -- Last synchronization time
```

### Feedback Table Fields

```sql
-- Source Tracking
source                          ENUM          -- 'manual' or 'google'
google_review_id                VARCHAR(255)  -- Google's unique review ID
google_synced_at                TIMESTAMP     -- When imported from Google
```

---

## 🚀 Deployment

### Environment Variables

Add to your hosting platform (Render, Heroku, etc.):

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/google/auth/callback
```

### Pre-Deployment Checklist

- [ ] Environment variables set
- [ ] Google OAuth credentials created in Google Cloud Console
- [ ] OAuth consent screen configured
- [ ] Redirect URI registered in Google Console
- [ ] Database migrations ready
- [ ] Application tests passing
- [ ] test-google-integration.sh runs successfully

### Deployment Commands

```bash
# On your hosting platform:
php artisan migrate              # Run database migrations
php artisan cache:clear         # Clear caches if needed
bash test-google-integration.sh # Verify installation
```

---

## 🧪 Testing

### Manual Testing Workflow

1. **Login to application**
2. **Navigate to Settings** → Intégrations tab
3. **Click "Connect with Google"**
4. **Authorize the application** in Google OAuth screen
5. **Verify** connection status shows "Connected ✅"
6. **Click "Sync Reviews"** to test API integration
7. **Check Feedbacks list** for newly imported Google reviews

### Command-Line Testing

```bash
# Test sync for all connected companies
php artisan google:sync-reviews

# Test sync for specific company
php artisan google:sync-reviews --company-id=1

# Check system health
bash test-google-integration.sh
```

### Artisan Tinker Testing

```php
php artisan tinker

// Test OAuth service
$oauth = new App\Services\GoogleOAuthService();
$url = $oauth->getAuthorizationUrl();
echo $url; // Verify URL format

// Test Business Profile service
$company = App\Models\Company::first();
$service = new App\Services\GoogleBusinessProfileService($company);
// ... service method calls
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue: "Invalid authorization code" error**
- Verify `GOOGLE_REDIRECT_URI` matches exactly in:
  - Environment variables
  - Google Cloud Console
  - config/services.php

**Issue: No reviews syncing**
- Check: `Company.google_business_profile_connected == true`
- Verify: Access token not expired
- Confirm: Google account has published reviews
- Check: Application logs for API errors

**Issue: Token refresh failing**
- Solution: Disconnect and reconnect via OAuth
- Reason: Refresh token may have been revoked by user

**Issue: Database migration errors**
- Check: Table name is `feedback` (singular), not `feedbacks`
- Verify: All dependencies installed via Composer

---

## 📊 Monitoring

### Key Metrics to Monitor

- **Sync Success Rate:** Check `google_last_sync_at` timestamps
- **Token Refresh Count:** Log entries showing token refreshes
- **API Failures:** Error logs from GoogleBusinessProfileService
- **Review Count:** COUNT(*) WHERE source = 'google'

### Logging

Check logs for Google integration events:

```bash
tail -f storage/logs/laravel.log | grep -i google
```

Log patterns to look for:
- `Google reviews synced successfully`
- `Failed to fetch Google reviews`
- `Failed to sync Google reviews`
- `Failed to exchange Google OAuth token`

---

## 🔐 Security

### Token Storage

- All OAuth tokens encrypted with AES-256
- Encryption key in `APP_KEY` environment variable
- Tokens never logged or exposed in errors

### OAuth Scopes

Application only requests:
- `business.manage` - Manage business information
- `businesscommunications` - Business communications

### Session Management

- OAuth flow uses Laravel sessions
- CSRF protection enabled by default
- Tokens expire and are refreshed automatically

---

## 📞 Support & Resources

### Internal Documentation
- `GOOGLE_OAUTH_SETUP.md` - Setup guide
- `GOOGLE_INTEGRATION_SUMMARY.md` - Feature overview
- `ARCHITECTURE_GUIDE.md` - Technical architecture
- `CHANGELOG_GOOGLE_INTEGRATION.md` - Release notes

### Code Files
- `app/Services/GoogleOAuthService.php` - OAuth logic
- `app/Services/GoogleBusinessProfileService.php` - API logic
- `app/Http/Controllers/GoogleAuthController.php` - Controller
- `resources/js/Components/GoogleBusinessProfileSection.jsx` - UI

### External Resources
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Business Profile API](https://developers.google.com/my-business)
- [Laravel Encryption Documentation](https://laravel.com/docs/encryption)

---

## ✅ Quick Reference

### Routes

```
GET  /google/auth/connect       - Initiate OAuth
GET  /google/auth/callback      - OAuth callback
POST /google/auth/disconnect    - Revoke OAuth
POST /google/auth/sync          - Sync reviews
```

### Commands

```bash
php artisan google:sync-reviews              # Sync all companies
php artisan google:sync-reviews --company-id=1  # Sync specific company
bash test-google-integration.sh              # System check
```

### Models

```php
$company->google_oauth_token                    // Encrypted access token
$company->google_business_profile_connected     // Boolean: is connected?
$company->google_last_sync_at                   // Last sync timestamp

$feedback->source                               // 'manual' or 'google'
$feedback->google_review_id                     // Google's review ID
$feedback->google_synced_at                     // Import timestamp
```

### Environment Variables

```env
GOOGLE_CLIENT_ID                    # OAuth client ID
GOOGLE_CLIENT_SECRET                # OAuth client secret
GOOGLE_REDIRECT_URI                 # OAuth callback URL
```

---

## 📈 Roadmap

### Version 2.3.1 (Planned)
- [ ] Scheduled sync command
- [ ] Multi-location support
- [ ] Review analytics

### Version 2.4.0 (Future)
- [ ] Automated response templates
- [ ] Sentiment analysis
- [ ] Review escalation workflows

---

**Last Updated:** February 27, 2026
**Integration Version:** 2.3.0
**Status:** ✅ Production Ready

**Questions?** Check the relevant documentation file or review the code comments.
