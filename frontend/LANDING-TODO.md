# Landing Page - Éléments à modifier plus tard

## Images et Assets

### Hero Section
- `FloatingImage.tsx` : Remplacer le mockup par une vraie capture d'écran du dashboard

### Section Work
- `Work.tsx` : Remplacer les 3 placeholders `/api/placeholder/600/400` par :
  - Capture du dashboard principal
  - Capture de la page analytics  
  - Capture de l'interface d'analyse IA

## Données Hardcodées

### Stats Section
```typescript
const STATS_DATA = [
  { number: 10000, suffix: "+", label: "CV Analysés" },
  { number: 98, suffix: "%", label: "Précision IA" },
  { number: 75, suffix: "%", label: "Temps Économisé" },
  { number: 500, suffix: "+", label: "Entreprises" }
];
```

### Services Section
```typescript
const SERVICES = [
  // 6 services avec descriptions hardcodées
];
```

### Work Section  
```typescript
const WORK_CONTENTS = [
  // 3 contenus de travail avec descriptions hardcodées
];
```

### Footer
```typescript
const SOCIAL_LINKS = [
  { name: "GitHub", url: "#" },
  { name: "LinkedIn", url: "#" }, 
  { name: "Twitter", url: "#" },
  { name: "Email", url: "mailto:contact@rh-analytics.com" }
];

const FOOTER_LINKS = {
  "Produit": [
    { name: "Fonctionnalités", url: "#features" },
    { name: "Tarifs", url: "#pricing" },
    // ...
  ]
};
```

### Menu Navigation
```typescript
const MENU_LINKS = [
  { name: "Accueil", ref: "home" },
  { name: "Services", ref: "services" },
  // ...
];
```

## Textes à Personnaliser

### Hero Section
- Typing strings
- Description principale
- Boutons CTA

### Toutes les sections
- Titres
- Descriptions  
- Labels de boutons

## URLs et Liens

### Navigation
- Tous les liens `href="#section"` 
- Liens vers dashboard `/projects`

### Footer
- Liens sociaux (actuellement `#`)
- Liens légaux (`#privacy`, `#terms`, etc.)

## Configurations

### Animation Timers
- Délais d'animation GSAP
- Durées de typing animation
- Fallback timers

### Responsive Breakpoints
- Tailles d'écran pour FloatingImage
- Grid breakpoints

## API Integration Future

### Stats Dynamiques
- Connecter aux vraies métriques de la DB
- API endpoint pour les statistiques

### Contenu CMS
- Textes éditables via interface admin
- Images uploadées dynamiquement