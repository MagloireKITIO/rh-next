
# Configuration Azure pour rh-next

## Variables d'environnement requises pour Azure App Service

### Base de données (Supabase - inchangé)
```
SUPABASE_URL=votre_url_supabase
SUPABASE_ANON_KEY=votre_cle_supabase
DATABASE_URL=votre_url_postgresql_supabase
```

### Stockage Azure
```
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=rhneststorage;AccountKey=VOTRE_CLE;EndpointSuffix=core.windows.net
```

### JWT et authentification
```
JWT_SECRET=votre_jwt_secret
JWT_EXPIRES_IN=24h
```

### Configuration NestJS
```
NODE_ENV=production
PORT=80
```

### Services externes (AI, etc.)
```
TOGETHER_API_KEY=votre_cle_together_ai
# Ajoutez d'autres clés selon vos services
```

## Commandes Azure CLI pour configurer les variables

### 1. Obtenir la clé de stockage
```bash
az storage account keys list \
  --resource-group rh-next-rg \
  --account-name rhneststorage \
  --query '[0].value' \
  --output tsv
```

### 2. Configurer les variables d'environnement dans l'App Service
```bash
# Variable de stockage Azure
az webapp config appsettings set \
  --resource-group rh-next-rg \
  --name rh-next-api \
  --settings AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=rhneststorage;AccountKey=VOTRE_CLE;EndpointSuffix=core.windows.net"

# Variables Supabase (remplacez par vos vraies valeurs)
az webapp config appsettings set \
  --resource-group rh-next-rg \
  --name rh-next-api \
  --settings SUPABASE_URL="https://votre-projet.supabase.co"

az webapp config appsettings set \
  --resource-group rh-next-rg \
  --name rh-next-api \
  --settings SUPABASE_ANON_KEY="votre_cle_anon"

az webapp config appsettings set \
  --resource-group rh-next-rg \
  --name rh-next-api \
  --settings DATABASE_URL="postgresql://postgres:votre_mdp@db.projet.supabase.co:5432/postgres"

# JWT Secret
az webapp config appsettings set \
  --resource-group rh-next-rg \
  --name rh-next-api \
  --settings JWT_SECRET="votre_jwt_secret_secure"

# Environment
az webapp config appsettings set \
  --resource-group rh-next-rg \
  --name rh-next-api \
  --settings NODE_ENV="production" PORT="80"
```

## Configuration des CORS pour le frontend Vercel

```bash
az webapp config appsettings set \
  --resource-group rh-next-rg \
  --name rh-next-api \
  --settings CORS_ORIGINS="https://votre-frontend.vercel.app,http://localhost:3000"
```