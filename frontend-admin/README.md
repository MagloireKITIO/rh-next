# Frontend Admin - RH Analytics Pro

Interface d'administration pour la gestion globale de la plateforme RH Analytics Pro.

## 🎯 Vue d'ensemble

Le frontend-admin est une interface dédiée aux **super administrateurs** pour gérer l'ensemble de la plateforme multi-tenant :

- **Gestion des entreprises** : Créer, modifier, activer/désactiver les entreprises
- **Gestion des utilisateurs** : Vue globale de tous les utilisateurs de toutes les entreprises  
- **Analytics globales** : Statistiques et métriques de l'ensemble de la plateforme
- **Paramètres système** : Configuration globale de la plateforme

## 🔐 Sécurité

- **Accès restreint** : Seuls les utilisateurs avec le rôle `super_admin` peuvent accéder
- **Authentication JWT** : Token séparé stocké dans `admin_token`
- **Routes protégées** : Toutes les routes nécessitent une authentification super admin
- **Séparation des responsabilités** : Interface complètement séparée du frontend client

## 🚀 Installation & Développement

### Prérequis
- Node.js 18+
- Backend RH Analytics Pro démarré sur le port 3001

### Installation
```bash
cd frontend-admin
npm install
```

### Variables d'environnement
```bash
# .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Développement
```bash
npm run dev
# Interface accessible sur http://localhost:3002
```

## 🔧 Configuration du Super Admin

Avant d'utiliser l'interface admin, créez un super administrateur :

1. **Configurer le script** :
   ```bash
   # Éditez backend/create-super-admin.js
   const SUPER_ADMIN_EMAIL = 'admin@votre-domaine.com';
   const SUPER_ADMIN_PASSWORD = 'MotDePasseSecurise123!';
   ```

2. **Exécuter le script** :
   ```bash
   cd backend
   node create-super-admin.js
   ```

3. **Se connecter** :
   - URL : http://localhost:3002/auth/login
   - Email : admin@votre-domaine.com
   - Mot de passe : MotDePasseSecurise123!

## 📋 Fonctionnalités

### Dashboard
- **Métriques globales** : Entreprises, utilisateurs, projets, CV analysés
- **Graphiques de croissance** : Évolution des métriques
- **Actions rapides** : Raccourcis vers les fonctions principales
- **Entreprises récentes** : Liste des dernières inscriptions

### Gestion des Entreprises
- **Liste complète** : Toutes les entreprises avec stats
- **Création** : Nouvelle entreprise avec nom/domaine unique
- **Activation/Désactivation** : Toggle du statut des entreprises
- **Statistiques** : Utilisateurs, projets, scores par entreprise
- **Recherche** : Filtrage par nom ou domaine

## 🛡️ Architecture de Sécurité

- **SUPER_ADMIN** : Accès complet à l'interface admin
- **Protection des routes** : Vérification automatique du rôle
- **Token JWT séparé** : `admin_token` distinct du frontend client
- **Timeout automatique** : Session expirée en cas d'inactivité

---

**Interface d'administration sécurisée pour RH Analytics Pro** 🛡️
