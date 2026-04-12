# 📊 Analyse des Limites pour Envois Massifs de Feedback Requests

## 🎯 Objectif
Étudier les cas possibles et risques pour envois de **500+ contacts** sans problèmes Brevo/Backend.

---

## 1️⃣ ARCHITECTURE ACTUELLE

### Envoi synchrone (actuellement déployé)
```
User POST /feedback-requests/send-with-template
  ↓
FeedbackRequestController::sendWithTemplate()
  ├─ Loop: customer_ids (CRM mode)
  │   └─ findOrCreateRequest → sendFeedbackEmail/SMS (DIRECT)
  └─ Loop: recipients (quick mode)
      └─ findOrCreateRequest → sendFeedbackEmail/SMS (DIRECT)
```

**Problème**: Tout est **bloquant dans la même requête HTTP**.

---

## 2️⃣ LIMITES IDENTIFIÉES

### 2.1 Backend PHP

| Limite | Valeur | Fichier | Impact |
|--------|--------|---------|--------|
| PHP Execution | `300s` | `/docker/default.conf` | ✅ Bon pour ~200-300 emails |
| PHP Memory | Par défaut | pas configuré | ⚠️ Risque à 500+ |
| FPM Workers | `auto` | `/docker/php-fpm.conf` | ⚠️ Une requête = 1 worker |
| Nginx Client Size | `20M` | `/docker/nginx.conf` | ✅ Bon (CSV upload) |

**Calcul temps par envoi** (estimation) :
- **Email via SMTP Brevo**: 0.5-2s par envoi (network latency + Brevo response)
- **SMS via API HTTP**: 0.5-1s par envoi
- **500 emails**: 250-1000s = **4-16 minutes** ❌ Timeout à 300s

### 2.2 Brevo SMTP (Mail)

Brevo configure:
- **Host**: `smtp-relay.brevo.com:2525` 
- **Username/Password**: présents
- **Port 2525** = direct non-TLS (legacy, lent)
- **Queue**: aucune, envoi direct

**Limites Brevo**:
- Connexions simultanées SMTP : ~5-10 par IP
- Rate limiting: ~300 email/min (selon plan)
- **500 emails = ~100 secondes au mieux** (avec parallélisme)

### 2.3 Brevo API SMS

Configuration:
- **Endpoint**: `api.brevo.com/v3/transactionalSMS/sms`
- **Type**: HTTP REST, pas batching
- **1 appel API par SMS**

**Limites Brevo SMS**:
- Rate limit: ~10 SMS/sec (plan gratuit), ~100+/sec (pro)
- Coût: crédits SMS
- **500 SMS = un par un → 50+ secondes**

### 2.4 Queue Redis

Configuration actuelle:
- `QUEUE_CONNECTION=redis` ✅ Présent
- Mais **pas utilisé pour les envois initiaux**
- Seulement pour rappels (ReminderJob)

### 2.5 Réseau / Database

- **500 requêtes CREATE** dans la boucle
- **0 parallélisme** actuel
- DB round-trip: 50-200ms chacun

---

## 3️⃣ SCÉNARIOS DE RISQUE

### Cas 1: 50 contacts → ✅ Probable OK
```
Temps estimé: 50 × 1s = 50s
Timeout PHP: 300s
Statut: ✅ PASSE
```

### Cas 2: 100 contacts → ⚠️ Limit acceptable
```
Temps estimé: 100 × 1s = 100s (emails), 100s (SMS)
Timeout PHP: 300s
Statut: ⚠️ PASSE avec marge
```

### Cas 3: 200 contacts → ❌ Risqué
```
Temps estimé: 200 × 1s = 200s
Timeout PHP: 300s
UX: Interface bloquée 3+ minutes
Erreurs partielles: Oui (Brevo rate limit kicks in)
Statut: ❌ PROBLÉMATIQUE
```

### Cas 4: 500 contacts → ❌❌ FAILURE CERTAIN
```
Temps estimé: 500 × 1.5s = 750s
Timeout PHP: 300s → TIMEOUT après ~250 emails
Erreurs: ~250 emails envoyés, ~250 échoués silencieusement
UX: Erreur 504 Gateway Timeout
DB State: Inconsistent (requête partielle)
Statut: ❌❌ COMPLÈTEMENT CASSÉ
```

---

## 4️⃣ PROBLÈMES SPÉCIFIQUES PAR ENVOI TYPE

### 📧 Envoi Email × 500

**Problèmes**:
1. Brevo SMTP rate limit: 300/min = 5/sec
2. PHP 300s timeout → max ~250 emails avant timeout
3. Si 1 email échoue, toute la boucle continue (pas de transaction)
4. DB inserts de 500 rows de FeedbackRequest en 1 requête PHP

**Symptômes d'échec**:
- 504 Gateway Timeout après 4-5 minutes
- ~250 emails envoyés, ~250 feedback_requests créés
- ~250 emails jamais créés, pas de trace
- Client reçoit: "Something went wrong"
- **Aucun retry possible** (la requête est déjà terminée)

### 📱 Envoi SMS × 500

**Problèmes** (pire que mail):
1. API HTTP serial (1 appel par SMS, pas de batching)
2. 0.5-1s par API call (latency + processing)
3. Crédits SMS peuvent être épuisés mid-request
4. SMS rate limit atteint plus vite

**Symptômes d'échec**:
- Timeout après ~150 SMS
- Crédits partiellement consommés, non utilisables
- Pas de rapport sur combien ont réussi

### 🔄 Mode Mixte (CRM + Quick Recipients)

**Problèmes** cumulés:
- Tous les CRM clients d'abord
- Puis tous les quick recipients
- Si CRM (300) times out avant quick (200)
- Quick recipients jamais traités

---

## 5️⃣ GOULOTS D'ÉTRANGLEMENT (Bottlenecks)

```
┌─────────────────────────────────────────┐
│ User clicks "Envoyer 500 contacts"      │
└────────────┬────────────────────────────┘
             │
             ↓
    ⏱️ PHP Execution Timer (300s) STARTS
    ⏱️ Nginx FPM Timeout (300s) STARTS
             │
             ├─► Loop × 500 (SERIAL, not parallel)
             │   ├─ #1: CREATE feedback_request + sendEmail
             │   │      └─ SMTP connection + Auth + Send (1-2s)
             │   ├─ #2: CREATE feedback_request + sendEmail
             │   │      └─ SMTP connection + Auth + Send (1-2s)
             │   ...
             │   └─ #250: TIMEOUT 🔴
             │
             └─→ Database: 250/500 feedback_requests créés
                 Brevo: 250/500 emails envoyés
                 Client: 504 error
                 User: Confusion totale
```

---

## 6️⃣ BREVO LIMITATIONS PAR PLAN

| Limite Brevo | Free | Pro | Enterprise |
|--------------|------|-----|------------|
| Emails/mois | 300 | Unlimited | Unlimited |
| Email/min Rate | 1 | 5 | 10+ |
| SMS/jour | 15 | Payg | Payg |
| Concurrent SMTP | 1-2 | 3-5 | 5-10 |
| API Rate Limit | 5/sec | 10/sec | 20+/sec |

**Votre config** : Impossible à savoir sans logs Brevo.

---

## 7️⃣ DATABASE STRESS

**500 créations rapides**:
```sql
INSERT INTO feedback_requests (...) VALUES (...);
INSERT INTO feedback_requests (...) VALUES (...);
... × 500

-- Stress:
- 500 index updates (company_id, status, channel indices)
- 500 foreign key checks (company_id exists?)
- Potential deadlock if updating customers table
- PostgreSQL: autovacuum might trigger → 5-10s pause
```

---

## 8️⃣ SOLUTIONS ACTUELLEMENT ABSENTES

❌ Pas de batching
❌ Pas de queue job
❌ Pas de rate limiting
❌ Pas de chunking
❌ Pas de retry logic
❌ Pas de progress tracking
❌ Pas de rollback on failure
❌ Pas de async response

---

## 9️⃣ RECOMMENDATIONS (Ordre priorité)

### URGENT 🔴
1. **Max 100 per request** (frontend validation)
2. **Queue job pour chaque envoi** (déplacer SMTP/SMS en arrière-plan)
3. **Chunking**: traiter par lots de 50 avec délai
4. **Error handling**: rollback DB si mail échoue
5. **Quota mensuel réel**: vérifier avant envoi

### IMPORTANT 🟠
6. Retries exponential sur SMS/Email
7. Webhook Brevo pour tracer deliverability
8. Progress bar (WebSocket ou polling)
9. Alertes si erreur > 10%
10. Audit log complet

### NICE-TO-HAVE 🟡
11. Pause/resume batches
12. Replay failed sends
13. Template variables validation
14. Brevo credit check pre-send

---

## 🔟 RÉSUMÉ RISK MATRIX

```
        Envois     Emails  SMS    Mixed   Risk
        ────────────────────────────────────────
50      ✅ OK      ✅      ✅     ✅      🟢 Low
100     ⚠️ Edge    ⚠️      ⚠️     ⚠️      🟡 Medium
200     ❌ No      ❌      ❌     ❌      🟠 High
500     ❌❌ No    ❌❌    ❌❌    ❌❌    🔴 Critical
```

---

## 📋 PLAN D'ACTION RECOMMANDÉ

### Phase 1: Sécuriser le court terme (1-2h)
- [ ] Add frontend max 100 validation
- [ ] Add backend rate limit (throttle 10 reqs/min)
- [ ] Add quota check pre-send
- [ ] Add error trapping + partial rollback
- [ ] Add transaction for DB consistency

### Phase 2: Scalable architecture (3-4h)
- [ ] Create SendFeedbackBatchJob (chunk 50, delay 1s)
- [ ] Move SMTP/SMS to queue
- [ ] Add progress tracking (Redis counter)
- [ ] Add retry logic (3 attempts exponential backoff)
- [ ] Add UI progress bar

### Phase 3: Monitoring & Recovery (2h)
- [ ] Add Brevo webhook handler
- [ ] Add delivery status tracking
- [ ] Add failed batch replay
- [ ] Add dashboard metrics

---

## 📚 RÉFÉRENCES CONFIG

- **PHP Timeout**: `/docker/default.conf` line 32 = 300s
- **Brevo SMTP**: `.env` line 72 = `smtp-relay.brevo.com:2525`
- **Queue**: `.env` line 58 = `redis`
- **Mail Router**: `routes/web.php` line 224 (NO throttle)
- **Sender**: `app/Http/Controllers/FeedbackRequestController.php` line 396

---

## ✅ ÉTAPES SUIVANTES

Veux-tu que je commence par :

1. **Phase 1 rapide** (sécuriser 50-100) ?
2. **Phase 2 complète** (queue jobs + scaling) ?
3. **Monitoring** (Brevo webhooks + dashboard) ?

