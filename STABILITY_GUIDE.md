# STABILITY & PRODUCTION DEPLOYMENT GUIDE

**Phase critique - Optimisations de stabilité implémentées**

## ✅ Implementations Complètes (Priority 1 & 2)

### 1. Database Optimization ✅
**Migration créée:** `database/migrations/2026_02_18_000001_add_performance_indexes.php`

**Indexes ajoutés:**
- `feedbacks`: index sur `feedback_request_id`
- `feedback_requests`: index composé `(company_id, created_at)` et `(company_id, status)`
- `radar_analyses`: index composé `(company_id, created_at)`
- `users`, `customers`, `review_platforms`: index sur `company_id`
- `feedback_replies`: index sur `feedback_id`

**À faire:**
```bash
php artisan migrate
# Vérifier les indexes créés
php artisan tinker
>>> DB::select("SELECT * FROM information_schema.statistics WHERE table_name = 'feedbacks'")
```

---

### 2. Error Tracking (Sentry) ✅
**Files créés/modifiés:**
- `.env.example`: Ajout de `SENTRY_LARAVEL_DSN`
- `config/sentry.php`: Configuration complète

**À faire:**
```bash
# 1. Installer Sentry
composer require sentry/sentry-laravel

# 2. Setup Sentry (choisir les options)
php artisan sentry:publish

# 3. Mettre à jour .env
SENTRY_LARAVEL_DSN=https://YOUR_KEY@sentry.io/PROJECT_ID
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=0.1

# 4. Test
php artisan tinker
>>> \Sentry\captureMessage('Test message');
```

**Vérification:** Aller sur https://sentry.io et créer un compte gratuit

---

### 3. Redis Cache ✅
**Files modifiés:**
- `config/cache.php`: Default store → `redis`
- `.env.example`: Ajout de `CACHE_STORE=redis`
- `docker-compose.yml`: Service Redis ajouté

**À faire:**
```bash
# 1. Mettre à jour .env
CACHE_STORE=redis
REDIS_HOST=redis  # Si Docker
REDIS_PORT=6379

# 2. Tester Redis
php artisan tinker
>>> Cache::put('test', 'value', 3600)
>>> Cache::get('test')
```

**Vérification en production:**
- Les queries fréquentes sont mises en cache
- Dashboard stats = cachés 1h
- Feedback trend = cachés 1h

---

### 4. Gemini API Fallback & Rate Limiting ✅
**Services créés:**
- `app/Services/GeminiGateway.php`: Wrapper avec fallback automatique
- `app/Services/RadarQuotaService.php`: Gestion quota 4 analyses/jour

**Features:**
- ✅ Rate limit: 100 appels/minute par company
- ✅ Fallback responses élégantes si API down
- ✅ Cache du statut "API down" pendant 5 min
- ✅ Réponses adaptées au rating (1-5 stars)
- ✅ Support multilingue (FR, EN, ES, AR)

**À faire:**
```bash
# Utiliser dans les jobs/controllers:
$gateway = app(GeminiGateway::class);
$result = $gateway->generateWithFallback(
    feedbackContent: $feedback->comment,
    rating: $feedback->rating,
    customerName: $feedback->customer_name,
    detectedLanguage: 'fr'
);
// Retourne: ['content' => string, 'is_fallback' => bool, ...]
```

---

### 5. Radar Quota Service ✅
**Service créé:** `app/Services/RadarQuotaService.php`

**Quota:** 4 analyses/jour par company (même en Pro)

**À faire dans DashboardController:**
```php
use App\Services\RadarQuotaService;

public function radar(RadarAnalysisService $radarService, RadarQuotaService $quotaService)
{
    $company = Auth::user()->company;
    
    // Vérifier le quota
    try {
        $quotaService->validateQuota($company->id);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 409);
    }
    
    // ... continuer l'analyse
}
```

---

### 6. Dashboard Optimization ✅
**Changements dans DashboardController:**

**Avant (N+1 queries, pas de pagination):**
```php
$customers = Customer::get();  // 1 query
foreach($customers as $c) {
    // 1 query par customer pour feedbackRequests
}
$feedbacks = FeedbackRequest::get();  // Charge TOUS les feedbacks
```

**Après (Eager loading + Pagination + Cache):**
```php
// Pagination: max 50 customers par page
$customers = Customer::paginate(50);

// Eager loading: 1 query au lieu de N
$feedbacks = FeedbackRequest::with(['customer:id,name', 'feedback:id,rating'])
    ->paginate(50);

// Cache: stats cachées 1h
Cache::remember("dashboard-stats-{$companyId}", 3600, fn() => ...);
```

**Impact:** 
- Avant: ~50 queries pour 50 customers
- Après: 2-3 queries + cache hit

---

### 7. Docker Compose for Production ✅
**Fichier modifié:** `docker-compose.yml`

**Ajouts:**
- ✅ Redis service (port 6379)
- ✅ Queue worker service (background jobs)
- ✅ Health checks sur tous les services
- ✅ Volumes persistants pour Redis & PostgreSQL
- ✅ Network pour la communication inter-services

**À faire:**
```bash
# Lancer les services
docker-compose up -d

# Vérifier les services
docker-compose ps

# Voir les logs du queue worker
docker-compose logs queue-worker
```

---

### 8. Health Check Endpoint ✅
**Controller créé:** `app/Http/Controllers/HealthController.php`
**Routes ajoutées** dans `routes/web.php`

**Endpoints:**
- `GET /health` → Simple health check
- `GET /health/detailed` → Health check complet (DB, Redis, Queue)

**À faire:**
```bash
# Test
curl http://localhost/health
curl http://localhost/health/detailed

# Output attendu:
{
  "status": "ok",
  "timestamp": "2026-02-18T10:30:00Z",
  "checks": {
    "database": { "status": "ok" },
    "redis": { "status": "ok" },
    "queue": { "status": "ok" }
  }
}
```

---

## 🚀 NEXT STEPS - À FAIRE MAINTENANT

### Étape 1: Migration Database (URGENT)
```bash
cd inertia-crud
php artisan migrate
```

### Étape 2: Installation Sentry
```bash
composer require sentry/sentry-laravel
php artisan sentry:publish
# Mettre à jour .env avec ta clé Sentry
```

### Étape 3: Tester Redis localement
```bash
# Si tu veux tester Redis avant deployment
# Installation locale (MacOS):
brew install redis
redis-server

# Dans Laravel:
php artisan tinker
>>> Cache::put('test', 'ok')
```

### Étape 4: Rebuild Assets
```bash
npm run build
```

### Étape 5: Update Deployment Instructions
```bash
# Sur Render.com ou ton serveur:
php artisan config:cache
php artisan migrate --force
php artisan queue:restart
```

---

## 📊 MONITORING CHECKLIST

Avant de passer en production:

- [ ] Database indexes créés et vérifiés
- [ ] Sentry setup avec DSN valide
- [ ] Redis running et testée
- [ ] Health endpoints testés (`/health`)
- [ ] Queue worker running en background
- [ ] Cache working (`php artisan tinker` → Cache::get())
- [ ] Gemini fallback testé (simule une erreur API)
- [ ] Quota Radar testé (4 analyses/jour)
- [ ] Pagination testée sur Dashboard
- [ ] Logs centralisés configurés
- [ ] Backup automatique PostgreSQL configurée

---

## 🔥 TROUBLESHOOTING

### Redis Connection Error
```bash
# Vérifier que Redis est running
docker-compose ps redis

# Redémarrer Redis
docker-compose restart redis

# Tester la connexion
redis-cli ping
```

### Database Slow Queries
```bash
# Activer le query log
php artisan tinker
>>> DB::enableQueryLog()
>>> // ... exécute une query
>>> collect(DB::getQueryLog())->pluck('query')
```

### Queue Jobs Stuck
```bash
# Restart queue worker
docker-compose restart queue-worker

# Monitor queue
php artisan queue:monitor
```

---

## 💰 COÛTS ESTIMATION

| Service | Gratuit | Payant | Usage |
|---------|---------|--------|-------|
| Sentry | ✅ 5k events/mth | $29/mth | Error tracking |
| Redis | ✅ Docker | $10/mth | Cache + Queue |
| PostgreSQL | ✅ 1GB | $15/mth | Database |
| Render | ✅ (limité) | $25-50/mth | Hosting |
| **Total** | **$0** | **~$50-100/mth** | |

---

## 📝 NOTES DE SÉCURITÉ

1. **Production vs Local:**
   - APP_DEBUG=false en production
   - APP_ENV=production
   - SENTRY_PROFILES_SAMPLE_RATE=0.1 (pas 1.0)

2. **Redis:**
   - Ajouter mot de passe en production: `REDIS_PASSWORD=xxx`
   - Mettre en place authentication

3. **Database:**
   - Sauvegardes automatiques
   - Replica pour failover
   - Connection pooling (PgBouncer)

4. **Gemini API:**
   - Rate limit = 100/min/company
   - Fallback responses élégantes
   - Monitorer les erreurs via Sentry

---

**Status:** ✅ PHASE 1 & 2 COMPLÈTE
**Next Phase:** Lambda pour PDF/Excel si trafic dépasse prévisions

Besoin d'aide? Contacte-moi pour le deployment! 🚀
