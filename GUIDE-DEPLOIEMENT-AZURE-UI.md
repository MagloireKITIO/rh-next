# Guide de déploiement Azure via Interface Graphique

## Étape 1: Créer un groupe de ressources

1. **Connectez-vous au portail Azure** : https://portal.azure.com
2. **Créer un groupe de ressources :**
   - Cliquez sur "Groupes de ressources" dans le menu à gauche
   - Cliquez sur "+ Créer"
   - **Nom** : `rh-next-rg`
   - **Région** : `West Europe` (ou votre région préférée)
   - Cliquez sur "Vérifier + créer" puis "Créer"

## Étape 2: Créer le compte de stockage Azure

1. **Dans le portail Azure :**
   - Recherchez "Comptes de stockage" dans la barre de recherche
   - Cliquez sur "+ Créer"

2. **Configuration de base :**
   - **Abonnement** : Sélectionnez votre abonnement
   - **Groupe de ressources** : `rh-next-rg`
   - **Nom du compte de stockage** : `rhneststorage` (doit être unique globalement)
   - **Région** : `West Europe`
   - **Performances** : Standard
   - **Redondance** : LRS (Stockage localement redondant)

3. **Configuration avancée :**
   - Laissez les paramètres par défaut
   - Cliquez sur "Vérifier + créer" puis "Créer"

4. **Après création, configurer le conteneur :**
   - Allez dans le compte de stockage créé
   - Dans le menu de gauche, cliquez sur "Conteneurs"
   - Cliquez sur "+ Conteneur"
   - **Nom** : `cv-documents`
   - **Niveau d'accès public** : Blob (accès en lecture anonyme pour les blobs uniquement)
   - Cliquez sur "Créer"

5. **Récupérer la chaîne de connexion :**
   - Dans le compte de stockage, allez dans "Clés d'accès"
   - Copiez la "Chaîne de connexion" de la key1
   - **Gardez cette chaîne de côté** pour l'étape des variables d'environnement

## Étape 3: Créer l'App Service

1. **Créer l'App Service :**
   - Recherchez "App Services" dans la barre de recherche
   - Cliquez sur "+ Créer"

2. **Configuration de base :**
   - **Abonnement** : Votre abonnement
   - **Groupe de ressources** : `rh-next-rg`
   - **Nom** : `rh-next-api` (doit être unique globalement)
   - **Publier** : Code
   - **Pile d'exécution** : Node 18 LTS
   - **Système d'exploitation** : Linux
   - **Région** : `West Europe`

3. **Plan tarifaire :**
   - **Plan App Service** : Créer nouveau
   - **Nom** : `rh-next-plan`
   - **SKU et taille** : Basic B1 (pour commencer, vous pourrez l'ajuster)
   - Cliquez sur "Vérifier + créer" puis "Créer"

## Étape 4: Configurer les variables d'environnement

1. **Une fois l'App Service créé :**
   - Allez dans votre App Service `rh-next-api`
   - Dans le menu de gauche, cliquez sur "Configuration"

2. **Ajouter les paramètres d'application :**

   Cliquez sur "+ Nouveau paramètre d'application" et ajoutez ces variables une par une :

   **Stockage Azure :**
   - **Nom** : `AZURE_STORAGE_CONNECTION_STRING`
   - **Valeur** : La chaîne de connexion copiée de l'étape 2.5

   **Base de données Supabase :**
   - **Nom** : `SUPABASE_URL`
   - **Valeur** : `https://votre-projet.supabase.co`
   
   - **Nom** : `SUPABASE_ANON_KEY`
   - **Valeur** : Votre clé anonyme Supabase
   
   - **Nom** : `DATABASE_URL`
   - **Valeur** : `postgresql://postgres:votre_mdp@db.projet.supabase.co:5432/postgres`

   **JWT Configuration :**
   - **Nom** : `JWT_SECRET`
   - **Valeur** : Générez un secret sécurisé (ex: utilisez https://generate-secret.vercel.app/32)
   
   - **Nom** : `JWT_EXPIRES_IN`
   - **Valeur** : `24h`

   **Configuration générale :**
   - **Nom** : `NODE_ENV`
   - **Valeur** : `production`
   
   - **Nom** : `PORT`
   - **Valeur** : `80`

   **CORS (remplacez par votre URL Vercel) :**
   - **Nom** : `CORS_ORIGINS`
   - **Valeur** : `https://votre-frontend.vercel.app,http://localhost:3000`

   **Services externes (ajoutez selon vos besoins) :**
   - **Nom** : `TOGETHER_API_KEY`
   - **Valeur** : Votre clé API Together AI

3. **Sauvegarder :**
   - Cliquez sur "Enregistrer" en haut de la page
   - L'app va redémarrer automatiquement

## Étape 5: Déployer le code

### Option A: Déploiement via VS Code (Recommandé)

1. **Installer l'extension Azure App Service** dans VS Code
2. **Se connecter à Azure** dans l'extension
3. **Préparer le build :**
   ```bash
   cd backend
   npm install
   npm run build
   ```
4. **Déployer :**
   - Clic droit sur votre App Service dans l'extension
   - Choisir "Deploy to Web App"
   - Sélectionner le dossier `backend`

### Option B: Déploiement via ZIP

1. **Préparer le package :**
   ```bash
   cd backend
   npm install
   npm run build
   # Créer un zip avec dist/, node_modules/, package.json, package-lock.json
   ```

2. **Upload via le portail :**
   - Allez dans votre App Service
   - Cliquez sur "Centre de déploiement"
   - Choisir "ZIP Deploy"
   - Upload votre fichier ZIP

## Étape 6: Vérifier le déploiement

1. **URL de l'API :**
   - Votre API sera disponible sur : `https://rh-next-api.azurewebsites.net`
   - Test de santé : `https://rh-next-api.azurewebsites.net/api/health`

2. **Vérifier les logs :**
   - Dans l'App Service, allez dans "Flux de journaux"
   - Vérifiez qu'il n'y a pas d'erreurs au démarrage

3. **Tester l'upload de fichiers :**
   - Les fichiers doivent maintenant être uploadés vers Azure Blob Storage
   - Vérifiez dans votre compte de stockage > Conteneurs > cv-documents

## Étape 7: Mettre à jour le frontend

Dans votre projet frontend (sur Vercel), mettez à jour la variable d'environnement :
- `NEXT_PUBLIC_API_URL` = `https://rh-next-api.azurewebsites.net/api`

## Coûts estimés

- **App Service B1** : ~13€/mois
- **Stockage Blob** : ~0.02€/GB/mois
- **Sortie réseau** : ~0.08€/GB

**Avantages par rapport à Railway :**
- Pas de limitation de temps d'exécution
- Meilleur contrôle des ressources
- Intégration native avec Azure Blob Storage
- Scaling automatique possible