# CV Analysis Platform 🚀

Une plateforme moderne d'analyse de CV avec IA pour optimiser les processus de recrutement.

## ✨ Fonctionnalités

- **🤖 Analyse IA avancée** - Scoring automatique des CV avec DeepSeek
- **📊 Classement temps réel** - Indicateurs style bourse avec tendances
- **🔄 Gestion multi-comptes** - Rotation automatique des clés API Together AI
- **📋 Gestion de projets** - Organisation par projet de recrutement
- **📁 Upload batch** - Support des fichiers PDF multiples
- **📈 Rapports détaillés** - Analytics et statistiques complètes
- **🎨 Interface moderne** - Animations subtiles avec Framer Motion
- **🌙 Mode sombre** - Support des thèmes clair/sombre

## 🏗️ Architecture

### Backend (NestJS)
- **TypeORM + PostgreSQL** (Supabase)
- **Together AI** avec DeepSeek-Coder
- **Upload & traitement PDF** 
- **API REST** complète
- **Gestion des configurations**

### Frontend (Next.js 15)
- **React 19** avec hooks modernes
- **Tailwind CSS** + **Shadcn/ui**
- **Framer Motion** pour les animations
- **Zustand** pour la gestion d'état
- **TypeScript** strict

## 🚀 Installation & Lancement

### 1. Backend

```bash
cd backend
npm install

# Configuration
cp .env.example .env
# Éditer .env avec vos variables

# Lancement
npm run start:dev
```

### 2. Frontend

```bash
cd frontend
npm install

# Configuration
cp .env.local.example .env.local
# Éditer .env.local

# Lancement
npm run dev
```

## 🔧 Configuration

### Variables Backend (.env)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/rh_database
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
TOGETHER_AI_KEYS=key1,key2,key3
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Variables Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## 📖 Guide d'utilisation

### 1. Créer un projet
1. Accéder au dashboard
2. Cliquer "New Project"
3. Remplir le nom et la description du poste
4. (Optionnel) Personnaliser le prompt IA

### 2. Analyser des CV
1. Ouvrir le projet
2. Aller dans l'onglet "Upload CVs"
3. Glisser-déposer les fichiers PDF
4. L'analyse démarre automatiquement

### 3. Consulter les résultats
- **Classement temps réel** avec indicateurs de tendance
- **Scores détaillés** (0-100) par candidat
- **Résumés IA** avec forces/faiblesses
- **Rapports** exportables

## 🎯 Workflow utilisateur

1. **Recruteur** reçoit des CV → les classe dans un dossier
2. **Crée un projet** → nom + description poste + prompt IA
3. **Upload des CV** → traitement automatique par batch
4. **Analyse IA** → extraction + scoring + classement
5. **Suivi temps réel** → indicateurs type bourse
6. **Rapport final** → synthèse pour décision

## 🔍 Structure du projet

```
rh-next/
├── backend/                # API NestJS
│   ├── src/
│   │   ├── projects/      # Gestion projets
│   │   ├── candidates/    # Gestion candidats  
│   │   ├── analysis/      # Analyse IA & rapports
│   │   ├── ai/           # Service Together AI
│   │   └── configuration/ # Settings
│   └── uploads/          # Fichiers CV
│
└── frontend/              # Interface Next.js
    ├── src/
    │   ├── app/          # Pages (App Router)
    │   ├── components/   # Composants UI
    │   ├── hooks/        # Hooks API
    │   └── lib/          # Utils & store
    └── public/           # Assets statiques
```

## 🎨 Composants clés

### Animations & UI
- **ScoreIndicator** - Affichage score avec tendances
- **CandidateRanking** - Classement temps réel animé
- **CVUpload** - Zone de drop avec progression
- **AnimatedCard** - Cartes avec animations subtiles

### Logique métier
- **API Client** - Interface backend typée
- **Store Zustand** - État global réactif
- **Hooks personnalisés** - Logique réutilisable

## 🔒 Sécurité

- ✅ Validation côté client et serveur
- ✅ Variables d'environnement sécurisées
- ✅ Upload sécurisé (PDF uniquement)
- ✅ Gestion d'erreurs robuste
- ✅ Pas d'authentification (par design)

## 📦 Technologies

**Backend:**
- NestJS 11
- TypeORM 0.3
- PostgreSQL (Supabase)
- Together AI + DeepSeek
- PDF-Parse
- Multer

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Shadcn/ui
- Framer Motion 12
- Zustand 5
- React Dropzone

## 🎯 Points forts

✅ **Aucune donnée hardcodée** - Tout est dynamique  
✅ **Intégration backend complète** - APIs fonctionnelles  
✅ **Animations subtiles** - UX soignée  
✅ **Système bourse** - Indicateurs temps réel  
✅ **Multi-comptes IA** - Haute disponibilité  
✅ **Design moderne** - Interface professionnelle  

## 🚦 Prochaines étapes

- [ ] Tests unitaires
- [ ] CI/CD Pipeline  
- [ ] Docker containers
- [ ] Monitoring & logs
- [ ] Optimisations performances
- [ ] PWA support

---

**Développé avec ❤️ pour optimiser le recrutement avec l'IA**