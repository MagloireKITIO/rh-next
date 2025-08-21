# 🚀 Déploiement - Onboarding Update

## ⚠️ Migration Base de Données Requise

### Nouvelle colonne ajoutée à la table `users` :
```sql
ALTER TABLE users ADD COLUMN is_onboarded BOOLEAN DEFAULT FALSE;
```

### Étapes de déploiement :

1. **Backend** - Déployez d'abord le backend avec la nouvelle entité User
2. **Migration** - La migration TypeORM ajoutera automatiquement la colonne `is_onboarded`
3. **Frontend** - Déployez ensuite le frontend avec Driver.js

### Nouvelles dépendances :
- **Frontend** : `driver.js` (déjà installé)

### Nouveaux endpoints API :
- `POST /api/auth/mark-onboarded` - Marquer l'utilisateur comme "onboardé"

### Fonctionnalités ajoutées :
- ✅ Suppression de l'email de validation pour inscription entreprise
- ✅ Visite guidée automatique pour nouveaux utilisateurs
- ✅ Banner de bienvenue
- ✅ Onboarding interactif avec Driver.js

### Points de test :
1. Créer une nouvelle entreprise → Vérifier redirection directe vers dashboard
2. Vérifier apparition du banner de bienvenue
3. Tester la visite guidée automatique
4. Vérifier que la visite ne se relance pas après completion

## 🎯 Flow utilisateur final :
```
Inscription Entreprise → JWT Token → Dashboard → Banner Bienvenue → Visite Guidée → Marqué comme onboardé
```