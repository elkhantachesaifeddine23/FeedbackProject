# Architecture de Base de Données - Luminea

## 📊 Schéma Relationnel Complet

### Tables Principales

#### **users**
Stocke les informations d'authentification des utilisateurs
- `id` (PK)
- `name` - Nom complet
- `email` - Email unique
- `password` - Hash du mot de passe
- `google_id` - ✨ NOUVEAU: ID Google OAuth (unique, nullable)
- `google_avatar_url` - ✨ NOUVEAU: Avatar Google
- `avatar_url` - ✨ NOUVEAU: Avatar générique
- `company_id` - ✨ NOUVEAU: Entreprise principale (FK, nullable, pour backward compatibility)
- `email_verified_at` - Vérification email
- `two_factor_secret` - Secret 2FA
- `two_factor_recovery_codes` - Codes de récupération 2FA
- `two_factor_confirmed_at` - Date de confirmation 2FA

**Relations:**
- `company()` - Relation belongsTo (V1: 1 user = 1 company)
- `companies()` - Relation belongsToMany via company_user (V2: 1 user = N companies)

---

#### **company_user** (Pivot) ✨ NOUVEAU
Table de liaison pour relation N-N avec rôles
- `id` (PK)
- `company_id` (FK) → companies
- `user_id` (FK) → users
- `role` - ENUM: 'admin', 'member', 'viewer'
- `timestamps`

**Indexes:**
- `UNIQUE(company_id, user_id)` - Un user par company une fois
- `INDEX(user_id, role)` - Requêtes par user + role
- `INDEX(company_id, role)` - Requêtes par company + role

**Cas d'usage:**
```
- Founder crée company → role='admin'
- Founder invite collaborateur → role='member'
- Client externe accède à feedback → role='viewer'
```

---

#### **companies**
Stocke les informations des entreprises
- `id` (PK)
- `user_id` (FK) → users (ancien propriétaire, pour V1)
- `name` - Nom de l'entreprise
- `sector` - Secteur d'activité (nullable)
- `google_place_id` - ID Google Places (pour reviews)
- `google_review_url` - URL des reviews Google
- `logo_url` - URL du logo (nullable)
- `design_settings` - JSON: couleurs, fonts, styles personnalisés
- `timestamps`

**Relations:**
- `user()` - Relation belongsTo (V1 only)
- `users()` - Relation belongsToMany via company_user
- `customers()` - hasMany (clients à qui on envoie feedback)
- `feedbackRequests()` - hasMany (demandes de feedback)
- `subscription()` - hasOne (plan d'abonnement)

---

#### **customers**
Liste des clients d'une entreprise qui reçoivent les demandes de feedback
- `id` (PK)
- `company_id` (FK) → companies
- `name` - Nom du client
- `email` - Email du client
- `phone` - Téléphone (nullable)
- `timestamps`

**Indexes:**
- `UNIQUE(company_id, email)` - Un email par company
- `INDEX(company_id)` - Requêtes par company

---

#### **feedback_requests**
Demandes de feedback envoyées aux clients
- `id` (PK)
- `company_id` (FK) → companies
- `customer_id` (FK) → customers
- `token` (UUID) - Lien unique pour répondre au feedback
- `channel` - ENUM: 'sms', 'email', 'qr'
- `status` - ENUM: 'pending', 'sent', 'completed', 'failed', 'responded'
- `provider` - Fournisseur SMS/Email (ex: Twilio, SendGrid)
- `provider_message_id` - ID du message chez le provider
- `provider_response` - Réponse JSON du provider (nullable)
- `sent_at` - Timestamp d'envoi
- `responded_at` - Timestamp de réponse
- `timestamps`

**Indexes:**
- `INDEX(company_id, status)` - Dashboard analytics
- `INDEX(channel)` - Requêtes par canal

---

#### **feedback**
Réponses au feedback (rating + commentaire)
- `id` (PK)
- `feedback_request_id` (FK) → feedback_requests
- `rating` - TINYINT(1-5) - Note de 1 à 5 étoiles
- `comment` - Texte du commentaire (nullable)
- `is_public` - Boolean: visible publiquement?
- `timestamps`

**Indexes:**
- `INDEX(rating)` - Analytics

---

#### **feedback_replies**
Réponses aux commentaires de feedback (admin ou IA)
- `id` (PK)
- `feedback_id` (FK) → feedback
- `responder_type` - ENUM: 'admin', 'ai'
- `responder_id` (FK, nullable) → users (qui a répondu)
- `content` - Texte de la réponse
- `status` - ENUM: 'pending', 'completed', 'failed'
- `provider` - Fournisseur IA (ex: 'gemini', 'openai')
- `provider_response` - JSON brut de la réponse IA
- `timestamps`

---

#### **subscriptions**
Plans d'abonnement par entreprise
- `id` (PK)
- `company_id` (FK) → companies
- `stripe_subscription_id` - ID Stripe subscription (nullable)
- `plan` - ENUM: 'free', 'starter', 'pro'
- `status` - ENUM: 'active', 'canceled', 'trialing'
- `trial_ends_at` - Fin de la période d'essai (nullable)
- `ends_at` - Date de fin d'abonnement (nullable)
- `timestamps`

**Indexes:**
- `UNIQUE(company_id)` - Une subscription par company

---

#### **tasks**
Tâches générées à partir du feedback (ex: improvements)
- `id` (PK)
- `company_id` (FK) → companies
- `title` - Titre de la tâche
- `description` - Description détaillée (nullable)
- `status` - ENUM: 'not_started', 'in_progress', 'completed'
- `severity` - ENUM: 'critical', 'moderate', 'low'
- `priority` - Integer: priorité (0-100)
- `due_date` - Date limite (nullable)
- `source` - Source de la tâche (ex: 'feedback_ai') (nullable)
- `timestamps`

---

#### **radar_analyses**
Analyses IA des patterns de feedback (résumés intelligents)
- `id` (PK)
- `company_id` (FK) → companies
- `feedback_hash` - SHA256 des feedbacks analysés (pour détecter changements)
- `feedbacks_count` - Nombre de feedbacks inclus
- `analysis_data` - JSON: patterns, insights, recommendations
- `feedbacks_with_comments` - Nombre de feedbacks avec commentaires
- `analyzed_at` - Timestamp de l'analyse
- `timestamps`

**Indexes:**
- `INDEX(company_id, feedback_hash)` - Éviter les re-analyses

---

## 🔄 Relations Visuelles

```
users (1) ─── (N) company_user ──── (N) companies
  ├─ google_id
  ├─ avatar_url
  └─ company_id (FK) [backward compat V1]

companies (1) ──── (N) customers
              ├──── (N) feedback_requests
              ├──── (1) subscriptions
              ├──── (N) tasks
              └──── (N) radar_analyses

feedback_requests (1) ──── (N) feedback
                       └──── (1) customers

feedback (1) ──── (N) feedback_replies

feedback_replies:
  - Si responder_type='admin' → responder_id → users
  - Si responder_type='ai' → responder_id=NULL
```

---

## 🚀 Migrations Exécutées (v7)

| # | Migration | Status |
|----|-----------|--------|
| 1 | `2026_01_29_120000_add_oauth_columns_to_users_table` | ✅ RAN |
| 2 | `2026_01_29_120100_create_company_user_table` | ✅ RAN |
| 3 | `2026_01_29_120200_migrate_users_to_company_user_table` | ✅ RAN |

**Colonnes ajoutées à users:**
- `google_id` (unique, nullable)
- `google_avatar_url` (nullable)
- `avatar_url` (nullable)
- `company_id` (FK nullable pour V1 compat)

**Migration de données:**
- Tous les users existants → company_user avec `role='admin'` (ils propriétaires de leur company)

---

## 💡 Bonnes Pratiques Appliquées

✅ **Cascading Deletes** - Si company supprimée → tous les users/feedback/tasks supprimés
✅ **Unique Constraints** - Pas de doublons (email par company, google_id global)
✅ **Indexes Stratégiques** - Requêtes rapides sur (company_id, status), (user_id, role)
✅ **Nullable Smart** - company_id nullable pour users sans company
✅ **Enums PostgreSQL** - Status/rôles avec valeurs restreintes
✅ **JSON Flexible** - design_settings pour configurations custom sans migrations
✅ **Pivot Table Pattern** - company_user pour relation N-N avec metadata (role)

---

## 🔐 Sécurité

- Foreign keys avec `cascadeOnDelete()` pour intégrité
- Unique sur `(company_id, user_id)` pour pas de doublons
- `google_id` unique globalement (un compte Google = un user)
- Rôles dans pivot pour contrôle d'accès granulaire
- `provider_response` stocké en JSON (pas exposé à l'API)

---

## 📝 Prochaines Étapes

1. ✅ Migrations OAuth exécutées
2. ✅ Models mis à jour avec relations
3. ⏳ Socialite controller + OAuth routes
4. ⏳ Company selection UI pendant signup
5. ⏳ Middleware pour vérifier user role in company
6. ⏳ Invitation system (v2)
