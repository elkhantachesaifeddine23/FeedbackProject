# Système de Demandes de Feedback avec Templates Personnalisables

## 📋 Vue d'ensemble

Nouvelle fonctionnalité permettant d'envoyer des demandes de feedback aux clients avec des templates personnalisables pour chaque canal (SMS, Email, QR Code).

## ✨ Fonctionnalités implémentées

### 1. **Système de Templates**
- Templates personnalisables par canal (SMS, Email, QR)
- Variables dynamiques : `{Nom}`, `{Nom de l'entreprise}`, `{Votre lien}`
- Templates par défaut créés automatiquement pour chaque entreprise
- Possibilité de modifier les messages et sujets

### 2. **Interface d'envoi**
- Nouvelle page `/feedback-requests/send` accessible via le menu "Demande d'avis"
- Sélection multi-clients avec recherche
- Onglets pour choisir le canal (SMS, Email, QR Code)
- Prévisualisation du message en temps réel
- Compteur de caractères et limites

### 3. **Envoi multi-canal**
- **SMS** : via Brevo/Twilio avec tracking
- **Email** : avec sujet personnalisable
- **QR Code** : génération automatique pour chaque client

## 🗂️ Structure des fichiers

### Backend

#### Modèles
- `app/Models/FeedbackTemplate.php` - Gestion des templates
  - Relations avec Company
  - Méthodes de parsing des variables
  - Récupération des templates par défaut

#### Migrations
- `database/migrations/2026_02_27_102242_create_feedback_templates_table.php`
  - Stockage des templates par entreprise et canal
  - Index pour performances

#### Seeders
- `database/seeders/FeedbackTemplateSeeder.php`
  - Création automatique des templates par défaut pour toutes les entreprises

#### Contrôleurs
- `app/Http/Controllers/FeedbackTemplateController.php`
  - CRUD complet des templates
  - API pour récupérer les templates par canal
  
- `app/Http/Controllers/FeedbackRequestController.php` (modifié)
  - `sendPage()` - Affiche la page d'envoi
  - `sendWithTemplate()` - Envoi avec template personnalisé

### Frontend

#### Pages
- `resources/js/Pages/FeedbackRequests/Send.jsx`
  - Interface complète d'envoi
  - Sélection de clients
  - Personnalisation du message
  - Prévisualisation

#### Navigation
- Ajout dans `resources/js/Layouts/AuthenticatedLayout.jsx`
  - Nouvelle entrée "Demande d'avis" avec badge "NEW"
  - Icône Send ajoutée

### Routes
```php
// Envoi de feedbacks
Route::get('/feedback-requests/send', [FeedbackRequestController::class, 'sendPage']);
Route::post('/feedback-requests/send-with-template', [FeedbackRequestController::class, 'sendWithTemplate']);

// Gestion des templates
Route::get('/feedback-templates', [FeedbackTemplateController::class, 'index']);
Route::get('/feedback-templates/default', [FeedbackTemplateController::class, 'getDefault']);
Route::post('/feedback-templates', [FeedbackTemplateController::class, 'store']);
Route::put('/feedback-templates/{template}', [FeedbackTemplateController::class, 'update']);
Route::delete('/feedback-templates/{template}', [FeedbackTemplateController::class, 'destroy']);
```

## 🎯 Utilisation

### Pour les utilisateurs

1. **Accéder à la page** : Cliquer sur "Demande d'avis" dans le menu
2. **Choisir le canal** : SMS, Email ou QR Code
3. **Sélectionner les clients** : Utiliser la recherche et cocher les clients
4. **Personnaliser le message** : Modifier le template si nécessaire
5. **Prévisualiser** : Voir le message final avec les variables remplacées
6. **Envoyer** : Cliquer sur "Demander un avis"

### Variables disponibles dans les templates

- `{Nom}` - Nom du client
- `{Nom de l'entreprise}` - Nom de l'entreprise
- `{Votre lien}` - Lien vers le formulaire de feedback (généré automatiquement)

### Templates par défaut

**SMS & Email** :
```
Bonjour {Nom},

Il y a quelques temps, vous nous avez confié votre déménagement.

Votre avis est précieux :
Pourriez vous partager votre expérience, en cliquant sur le lien ci dessous?

{Votre lien}

C'est la plus belle récompense que vous pouvez nous faire si vous avez été satisfait.

Toute l'équipe des déménageurs vous remercie d'avance, et reste à votre disposition.
```

**QR Code** :
```
Scannez ce QR code pour partager votre expérience avec {Nom de l'entreprise}
```

## 🔧 Installation

1. **Exécuter la migration** :
```bash
php artisan migrate
```

2. **Créer les templates par défaut** :
```bash
php artisan db:seed --class=FeedbackTemplateSeeder
```

3. **Compiler les assets** :
```bash
npm run build
```

## 📊 Base de données

### Table `feedback_templates`
```sql
- id (bigint)
- company_id (bigint, foreign key)
- channel (enum: 'sms', 'email', 'qr')
- name (varchar)
- subject (text, nullable) - pour emails uniquement
- message (text)
- is_default (boolean)
- created_at (timestamp)
- updated_at (timestamp)

Index: [company_id, channel, is_default]
```

## 🎨 Design

L'interface suit le design existant de l'application :
- Dégradés bleu/indigo pour les éléments actifs
- Cards avec ombres et bordures arrondies
- Preview mobile pour visualiser le message
- Badges pour les nouvelles fonctionnalités

## 🚀 Améliorations futures possibles

1. **Historique des envois** : Liste des demandes envoyées avec statuts
2. **Planification** : Programmer l'envoi pour plus tard
3. **Templates multiples** : Plusieurs templates par canal
4. **Statistiques d'ouverture** : Tracking des taux d'ouverture (SMS/Email)
5. **Import CSV** : Import de clients depuis fichier CSV
6. **A/B Testing** : Tester différents messages

## ⚠️ Notes importantes

- Les clients doivent avoir un email (pour Email) ou un numéro de téléphone (pour SMS)
- Un client ne peut avoir qu'une seule demande active par canal
- Les variables sont automatiquement remplacées lors de l'envoi
- Les templates sont créés automatiquement pour chaque nouvelle entreprise

## 🧪 Tests

Pour tester la fonctionnalité :
1. Se connecter en tant qu'entreprise
2. Créer quelques clients avec email et téléphone
3. Aller sur "Demande d'avis"
4. Sélectionner des clients et choisir un canal
5. Personnaliser le message si besoin
6. Envoyer

## 📝 Changelog

### Version 1.0 (27/02/2026)
- ✅ Création du système de templates
- ✅ Interface d'envoi multi-canal
- ✅ Personnalisation des messages
- ✅ Prévisualisation en temps réel
- ✅ Envoi SMS via Brevo
- ✅ Envoi Email via SMTP
- ✅ Génération QR Code
- ✅ Navigation mise à jour
- ✅ Migrations et seeders
