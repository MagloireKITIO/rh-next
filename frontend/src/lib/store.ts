import { create } from 'zustand';

interface UIState {
  // Navigation & UI
  sidebarOpen: boolean;
  currentTab: string;
  
  // Modals
  showProjectSettings: boolean;
  showCreateProject: boolean;
  showTeamRequests: boolean;
  
  // Theme & Preferences
  theme: 'light' | 'dark' | 'system';
  
  // Loading states (pour les opérations qui ne sont pas gérées par TanStack Query)
  isGlobalLoading: boolean;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setCurrentTab: (tab: string) => void;
  setShowProjectSettings: (show: boolean) => void;
  setShowCreateProject: (show: boolean) => void;
  setShowTeamRequests: (show: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentTab: 'overview',
  showProjectSettings: false,
  showCreateProject: false,
  showTeamRequests: false,
  theme: 'system',
  isGlobalLoading: false,
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentTab: (tab) => set({ currentTab: tab }),
  setShowProjectSettings: (show) => set({ showProjectSettings: show }),
  setShowCreateProject: (show) => set({ showCreateProject: show }),
  setShowTeamRequests: (show) => set({ showTeamRequests: show }),
  setTheme: (theme) => set({ theme }),
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
}));

// Export de l'ancien hook pour compatibilité (peut être supprimé plus tard)
export const useAppStore = useUIStore;