# 🚀 Migration vers TanStack Query - Plan Complet

## 📊 Architecture Actuelle Analysée

### 🔴 Problèmes Identifiés

#### 1. **État Global Partagé (Zustand Store)**
- **1 seul `isLoading`** pour toute l'application
- Cause des rechargements constants "Loading project..."
- États mélangés : server state + client state

#### 2. **Hooks API Manuels (`use-api.ts`)**
- 383 lignes de code répétitif
- Pas de cache intelligent
- Refetch manuel partout
- États loading/error dupliqués

#### 3. **WebSocket Chaos**
- WebSocket déclenche `fetchCandidatesByProject()`
- Qui déclenche `setLoading(true)`
- Qui affiche "Loading..." sur toute la page

#### 4. **Re-renders Excessifs**
- Chaque action API → loading global
- Upload CV → toute l'app loading
- WebSocket update → reload complet

---

## 🎯 Migration TanStack Query

### 📦 Installation

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### 🏗️ Architecture Cible

```
src/
├── hooks/
│   ├── queries/           # TanStack Query hooks
│   │   ├── useProjects.ts
│   │   ├── useCandidates.ts
│   │   ├── useAnalysis.ts
│   │   ├── useApiKeys.ts
│   │   └── useConfiguration.ts
│   └── mutations/         # Mutations séparées
│       ├── useUploadCVs.ts
│       ├── useCreateProject.ts
│       └── useDeleteCandidate.ts
├── lib/
│   ├── queryClient.ts     # Configuration TanStack Query
│   ├── api-client.ts      # Garde les fonctions API pures
│   └── store.ts           # Zustand pour UI state seulement
└── providers/
    └── QueryProvider.tsx  # Provider global
```

---

## 🔄 Plan de Migration par Étapes

### **Phase 1 : Setup & Configuration**

#### 1.1 QueryClient Setup
```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      cacheTime: 10 * 60 * 1000,   // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

#### 1.2 Provider Setup
```typescript
// providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### 1.3 App Layout Update
```typescript
// app/layout.tsx
import { QueryProvider } from '@/providers/QueryProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

### **Phase 2 : Hooks Migration**

#### 2.1 Projects Query Hook
```typescript
// hooks/queries/useProjects.ts
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api-client';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll().then(res => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getById(id).then(res => res.data),
    enabled: !!id,
  });
}
```

#### 2.2 Candidates Query Hook
```typescript
// hooks/queries/useCandidates.ts
import { useQuery } from '@tanstack/react-query';
import { candidatesApi } from '@/lib/api-client';

export function useCandidatesByProject(projectId: string) {
  return useQuery({
    queryKey: ['candidates', 'project', projectId],
    queryFn: () => candidatesApi.getByProject(projectId).then(res => res.data),
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 secondes car données changeantes
  });
}

export function useCandidate(candidateId: string, projectId: string) {
  return useQuery({
    queryKey: ['candidates', candidateId],
    queryFn: () => candidatesApi.getCandidateInProject(projectId, candidateId).then(res => res.data),
    enabled: !!candidateId && !!projectId,
  });
}
```

#### 2.3 Upload Mutation
```typescript
// hooks/mutations/useUploadCVs.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function useUploadCVs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, files }: { projectId: string; files: File[] }) =>
      candidatesApi.uploadCVs(projectId, files),
    
    onSuccess: (data, { projectId }) => {
      // Invalidate et refetch les candidats
      queryClient.invalidateQueries(['candidates', 'project', projectId]);
      
      if (data.successful > 0) {
        toast.success(`${data.successful} CV(s) uploaded successfully`);
      }
      if (data.failed > 0) {
        toast.warning(`${data.failed} CV(s) failed to upload`);
      }
    },
    
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Upload failed');
    },
  });
}
```

### **Phase 3 : Zustand Cleanup**

#### 3.1 Nouveau Store (UI State seulement)
```typescript
// lib/store.ts
import { create } from 'zustand';

interface UIState {
  // Navigation & UI
  sidebarOpen: boolean;
  currentTab: string;
  
  // Modals
  showProjectSettings: boolean;
  showCreateProject: boolean;
  
  // Theme & Preferences
  theme: 'light' | 'dark';
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setCurrentTab: (tab: string) => void;
  setShowProjectSettings: (show: boolean) => void;
  setShowCreateProject: (show: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentTab: 'overview',
  showProjectSettings: false,
  showCreateProject: false,
  theme: 'light',
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentTab: (tab) => set({ currentTab: tab }),
  setShowProjectSettings: (show) => set({ showProjectSettings: show }),
  setShowCreateProject: (show) => set({ showCreateProject: show }),
  setTheme: (theme) => set({ theme }),
}));
```

### **Phase 4 : WebSocket Integration**

#### 4.1 WebSocket avec TanStack Query
```typescript
// hooks/useWebSocketSync.ts
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './use-websocket';
import { useEffect } from 'react';

export function useWebSocketSync(projectId: string) {
  const queryClient = useQueryClient();
  const { on, off } = useWebSocket({ projectId, enabled: !!projectId });

  useEffect(() => {
    if (!projectId) return;

    // Candidate updated
    on('candidateUpdate', (data) => {
      // Update cache directement, pas de refetch
      queryClient.setQueryData(['candidates', data.candidateId], data.candidate);
      
      // Invalider la liste des candidats
      queryClient.invalidateQueries(['candidates', 'project', projectId]);
    });

    // Analysis completed
    on('analysis_completed', (data) => {
      // Mise à jour optimiste du cache
      queryClient.setQueryData(['candidates', data.candidateId], data.candidate);
    });

    // Queue progress - pas besoin de refetch
    on('queue_progress', (data) => {
      // Juste émettre un event pour les composants UI
      window.dispatchEvent(new CustomEvent('queueProgress', { detail: data }));
    });

    return () => {
      off('candidateUpdate');
      off('analysis_completed');
      off('queue_progress');
    };
  }, [projectId, on, off, queryClient]);
}
```

### **Phase 5 : Composants Update**

#### 5.1 Dashboard Page
```typescript
// app/dashboard/page.tsx
export default function Dashboard() {
  const { data: projects, isLoading, error } = useProjects();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {projects?.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

#### 5.2 Project Page
```typescript
// app/projects/[id]/page.tsx
export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: candidates, isLoading: candidatesLoading } = useCandidatesByProject(projectId);
  
  // WebSocket sync
  useWebSocketSync(projectId);

  if (projectLoading) return <LoadingSpinner text="Loading project..." />;
  if (!project) return <ErrorMessage message="Project not found" />;

  return (
    <div>
      <h1>{project.name}</h1>
      
      {/* Candidates avec leur propre loading */}
      {candidatesLoading ? (
        <CandidatesListSkeleton />
      ) : (
        <CandidatesList candidates={candidates} />
      )}
    </div>
  );
}
```

#### 5.3 CV Upload Component
```typescript
// components/upload/cv-upload.tsx
export function CVUpload({ projectId }: { projectId: string }) {
  const uploadMutation = useUploadCVs();

  const handleUpload = (files: File[]) => {
    uploadMutation.mutate({ projectId, files });
  };

  return (
    <div>
      <Button 
        onClick={() => handleUpload(selectedFiles)}
        disabled={uploadMutation.isLoading}
      >
        {uploadMutation.isLoading ? 'Uploading...' : 'Upload'}
      </Button>
      
      {uploadMutation.error && (
        <ErrorMessage error={uploadMutation.error} />
      )}
    </div>
  );
}
```

---

## 📋 Checklist de Migration

### **Fichiers à Modifier/Créer**

#### ✅ **Nouveaux fichiers**
- [ ] `lib/queryClient.ts`
- [ ] `providers/QueryProvider.tsx`
- [ ] `hooks/queries/useProjects.ts`
- [ ] `hooks/queries/useCandidates.ts`
- [ ] `hooks/queries/useAnalysis.ts`
- [ ] `hooks/queries/useApiKeys.ts`
- [ ] `hooks/queries/useConfiguration.ts`
- [ ] `hooks/mutations/useUploadCVs.ts`
- [ ] `hooks/mutations/useCreateProject.ts`
- [ ] `hooks/mutations/useDeleteCandidate.ts`
- [ ] `hooks/useWebSocketSync.ts`

#### ✏️ **Fichiers à Modifier**
- [ ] `app/layout.tsx` - Ajouter QueryProvider
- [ ] `lib/store.ts` - Nettoyer, garder seulement UI state
- [ ] `app/dashboard/page.tsx` - Utiliser useProjects()
- [ ] `app/projects/[id]/page.tsx` - Utiliser useProject() + useCandidates()
- [ ] `app/projects/[id]/candidates/[candidateId]/page.tsx` - Utiliser useCandidate()
- [ ] `app/settings/page.tsx` - Utiliser useApiKeys() + useConfiguration()
- [ ] `components/upload/cv-upload.tsx` - Utiliser useUploadCVs()
- [ ] `components/ranking/candidate-ranking.tsx` - Utiliser useCandidates()
- [ ] `components/project/project-settings.tsx` - Utiliser mutations

#### 🗑️ **Fichiers à Supprimer**
- [ ] `hooks/use-api.ts` - Remplacé par queries/mutations
- [ ] `hooks/use-websocket.ts` - Intégré dans useWebSocketSync

---

## 🚀 Bénéfices Attendus

### **Performance**
- ✅ Cache intelligent - pas de refetch inutiles
- ✅ Background updates sans "Loading"
- ✅ Optimistic updates
- ✅ Stale-while-revalidate

### **UX Améliorée**
- ✅ Fini les "Loading project..." constants
- ✅ États loading granulaires
- ✅ Données instantanées si en cache
- ✅ Sync temps réel avec WebSockets

### **DX (Developer Experience)**
- ✅ Code plus simple et lisible
- ✅ DevTools intégrés
- ✅ TypeScript support natif
- ✅ Error boundaries automatiques

### **Maintenance**
- ✅ Moins de boilerplate
- ✅ Logique centralisée
- ✅ Tests plus faciles
- ✅ Évolutivité meilleure

---

## 📅 Planning Estimé

| Phase | Durée | Effort |
|-------|-------|---------|
| Phase 1: Setup | 2h | Setup QueryClient, Provider |
| Phase 2: Queries | 6h | Migrer tous les hooks de lecture |
| Phase 3: Mutations | 4h | Migrer upload, create, delete |
| Phase 4: WebSocket | 3h | Intégration WebSocket + cache |
| Phase 5: Components | 8h | Migrer tous les composants |
| **Total** | **23h** | **Migration complète** |

---

## 🧪 Migration Progressive

### **Stratégie Recommandée**
1. **Setup TanStack Query** en parallèle du système actuel
2. **Migrer page par page** en commençant par Dashboard
3. **Tester chaque migration** avant de passer à la suivante  
4. **Garder l'ancien système** comme fallback au début
5. **Nettoyer l'ancien code** une fois tout migré

### **Premier Test - Dashboard**
Commencer par migrer uniquement `useProjects()` dans le Dashboard pour valider l'approche.

---

## ❓ Questions/Décisions

1. **Garder Zustand pour UI state ?** → **Recommandé : Oui**
2. **Conserver les WebSockets ?** → **Oui, avec intégration cache**
3. **Migration progressive ou big bang ?** → **Progressive recommandée**
4. **Période de coexistence ?** → **2-3 semaines max**

---

**Prêt pour commencer la migration ? 🚀**