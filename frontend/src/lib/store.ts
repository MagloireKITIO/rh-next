import { create } from 'zustand';
import { Project, Candidate, Analysis, RankingChange } from './api-client';

interface AppState {
  // Projects
  projects: Project[];
  currentProject: Project | null;
  
  // Candidates
  candidates: Candidate[];
  rankingChanges: RankingChange[];
  
  // Analysis
  analyses: Analysis[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setCandidates: (candidates: Candidate[]) => void;
  setRankingChanges: (changes: RankingChange[]) => void;
  setAnalyses: (analyses: Analysis[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Update individual items
  updateCandidate: (candidate: Candidate) => void;
  updateProject: (project: Project) => void;
  addCandidates: (newCandidates: Candidate[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  candidates: [],
  rankingChanges: [],
  analyses: [],
  isLoading: false,
  error: null,
  
  // Actions
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setCandidates: (candidates) => set({ candidates }),
  setRankingChanges: (changes) => set({ rankingChanges: changes }),
  setAnalyses: (analyses) => set({ analyses }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Update actions
  updateCandidate: (updatedCandidate) => {
    const { candidates } = get();
    const updatedCandidates = candidates.map(candidate => 
      candidate.id === updatedCandidate.id ? updatedCandidate : candidate
    );
    set({ candidates: updatedCandidates });
  },
  
  updateProject: (updatedProject) => {
    const { projects, currentProject } = get();
    const updatedProjects = projects.map(project => 
      project.id === updatedProject.id ? updatedProject : project
    );
    set({ 
      projects: updatedProjects,
      currentProject: currentProject?.id === updatedProject.id ? updatedProject : currentProject
    });
  },
  
  addCandidates: (newCandidates) => {
    const { candidates } = get();
    set({ candidates: [...candidates, ...newCandidates] });
  },
}));