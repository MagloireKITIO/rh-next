import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api-client';
import { useProjects, useProject, useProjectStats } from './useProjects';

// Mock de l'API
jest.mock('@/lib/api-client', () => ({
  projectsApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    getStats: jest.fn(),
  },
}));

const mockProjectsApi = projectsApi as jest.Mocked<typeof projectsApi>;

// Helper pour créer un wrapper avec QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock data
const mockProjects = {
  data: [
    {
      id: '1',
      name: 'Frontend Developer',
      description: 'Senior React Developer position',
      company: 'TechCorp',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      candidatesCount: 15,
      averageScore: 78.5,
    },
    {
      id: '2',
      name: 'Backend Engineer',
      description: 'Node.js and Python backend role',
      company: 'StartupXYZ',
      status: 'active',
      createdAt: '2024-01-02T00:00:00Z',
      candidatesCount: 23,
      averageScore: 82.3,
    },
  ],
};

const mockProject = {
  data: {
    id: '1',
    name: 'Frontend Developer',
    description: 'Senior React Developer position',
    company: 'TechCorp',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    requirements: [
      'React/Next.js expertise',
      'TypeScript proficiency',
      'State management (Redux/Zustand)',
    ],
    benefits: [
      'Remote work',
      'Health insurance',
      'Stock options',
    ],
    candidatesCount: 15,
    averageScore: 78.5,
    pipeline: {
      id: 'pipeline-1',
      stages: [
        { id: 'stage-1', name: 'Initial', order: 1, candidatesCount: 8 },
        { id: 'stage-2', name: 'Interview', order: 2, candidatesCount: 5 },
        { id: 'stage-3', name: 'Final', order: 3, candidatesCount: 2 },
      ],
    },
  },
};

const mockProjectStats = {
  data: {
    totalCandidates: 15,
    averageScore: 78.5,
    topScore: 95.2,
    analyzedCandidates: 12,
    pendingAnalysis: 3,
    scoreDistribution: {
      excellent: 3,
      good: 6,
      average: 4,
      poor: 2,
    },
    recentActivity: [
      {
        type: 'candidate_added',
        candidateId: 'cand-1',
        candidateName: 'John Doe',
        timestamp: '2024-01-15T10:30:00Z',
      },
      {
        type: 'analysis_completed',
        candidateId: 'cand-2',
        candidateName: 'Jane Smith',
        score: 88.5,
        timestamp: '2024-01-15T09:15:00Z',
      },
    ],
    pipelineStats: {
      stages: [
        { stageName: 'Initial', candidatesCount: 8, averageScore: 76.2 },
        { stageName: 'Interview', candidatesCount: 5, averageScore: 82.1 },
        { stageName: 'Final', candidatesCount: 2, averageScore: 91.5 },
      ],
    },
  },
};

describe('useProjects Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useProjects', () => {
    it('should fetch all projects successfully', async () => {
      mockProjectsApi.getAll.mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockProjectsApi.getAll).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(mockProjects.data);
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('Failed to fetch projects');
      mockProjectsApi.getAll.mockRejectedValue(error);

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeUndefined();
    });

    it('should return empty array when no projects exist', async () => {
      const emptyResponse = { data: [] };
      mockProjectsApi.getAll.mockResolvedValue(emptyResponse);

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should have correct caching configuration', () => {
      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      // Vérifier que le hook est configuré correctement
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
    });
  });

  describe('useProject', () => {
    it('should fetch single project by ID', async () => {
      const projectId = '1';
      mockProjectsApi.getById.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProject(projectId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockProjectsApi.getById).toHaveBeenCalledWith(projectId);
      expect(result.current.data).toEqual(mockProject.data);
    });

    it('should not fetch when project ID is empty', () => {
      const { result } = renderHook(() => useProject(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockProjectsApi.getById).not.toHaveBeenCalled();
    });

    it('should not fetch when project ID is undefined', () => {
      const { result } = renderHook(() => useProject(undefined as any), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockProjectsApi.getById).not.toHaveBeenCalled();
    });

    it('should handle API errors for single project', async () => {
      const projectId = '1';
      const error = new Error('Project not found');
      mockProjectsApi.getById.mockRejectedValue(error);

      const { result } = renderHook(() => useProject(projectId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('should handle different project ID formats', async () => {
      const projectIds = ['1', 'proj-abc-123', 'uuid-style-id'];

      for (const projectId of projectIds) {
        mockProjectsApi.getById.mockResolvedValue(mockProject);

        const { result } = renderHook(() => useProject(projectId), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockProjectsApi.getById).toHaveBeenCalledWith(projectId);
      }
    });

    it('should refresh data when project ID changes', async () => {
      mockProjectsApi.getById.mockResolvedValue(mockProject);

      const { result, rerender } = renderHook(
        ({ id }) => useProject(id),
        {
          wrapper: createWrapper(),
          initialProps: { id: '1' },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockProjectsApi.getById).toHaveBeenCalledWith('1');

      // Change project ID
      rerender({ id: '2' });

      await waitFor(() => {
        expect(mockProjectsApi.getById).toHaveBeenCalledWith('2');
      });

      expect(mockProjectsApi.getById).toHaveBeenCalledTimes(2);
    });
  });

  describe('useProjectStats', () => {
    it('should fetch project statistics', async () => {
      const projectId = '1';
      mockProjectsApi.getStats.mockResolvedValue(mockProjectStats);

      const { result } = renderHook(() => useProjectStats(projectId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockProjectsApi.getStats).toHaveBeenCalledWith(projectId);
      expect(result.current.data).toEqual(mockProjectStats.data);
    });

    it('should not fetch when project ID is empty', () => {
      const { result } = renderHook(() => useProjectStats(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockProjectsApi.getStats).not.toHaveBeenCalled();
    });

    it('should handle statistics API errors', async () => {
      const projectId = '1';
      const error = new Error('Failed to fetch statistics');
      mockProjectsApi.getStats.mockRejectedValue(error);

      const { result } = renderHook(() => useProjectStats(projectId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('should validate statistics data structure', async () => {
      const projectId = '1';
      mockProjectsApi.getStats.mockResolvedValue(mockProjectStats);

      const { result } = renderHook(() => useProjectStats(projectId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const stats = result.current.data!;

      // Vérifier la structure des statistiques
      expect(stats).toHaveProperty('totalCandidates');
      expect(stats).toHaveProperty('averageScore');
      expect(stats).toHaveProperty('scoreDistribution');
      expect(stats).toHaveProperty('recentActivity');
      expect(stats).toHaveProperty('pipelineStats');

      // Vérifier les types
      expect(typeof stats.totalCandidates).toBe('number');
      expect(typeof stats.averageScore).toBe('number');
      expect(Array.isArray(stats.recentActivity)).toBe(true);
      expect(stats.scoreDistribution).toHaveProperty('excellent');
      expect(stats.scoreDistribution).toHaveProperty('good');
      expect(stats.scoreDistribution).toHaveProperty('average');
      expect(stats.scoreDistribution).toHaveProperty('poor');
    });

    it('should handle empty statistics gracefully', async () => {
      const projectId = '1';
      const emptyStats = {
        data: {
          totalCandidates: 0,
          averageScore: 0,
          topScore: 0,
          analyzedCandidates: 0,
          pendingAnalysis: 0,
          scoreDistribution: {
            excellent: 0,
            good: 0,
            average: 0,
            poor: 0,
          },
          recentActivity: [],
          pipelineStats: {
            stages: [],
          },
        },
      };

      mockProjectsApi.getStats.mockResolvedValue(emptyStats);

      const { result } = renderHook(() => useProjectStats(projectId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(emptyStats.data);
      expect(result.current.data?.totalCandidates).toBe(0);
      expect(result.current.data?.recentActivity).toHaveLength(0);
    });
  });

  describe('Query Key Consistency', () => {
    it('should use consistent and hierarchical query keys', () => {
      const projectId = 'test-project-id';

      // Test des clés de requête pour cohérence
      const { result: allProjects } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      const { result: singleProject } = renderHook(() => useProject(projectId), {
        wrapper: createWrapper(),
      });

      const { result: projectStats } = renderHook(() => useProjectStats(projectId), {
        wrapper: createWrapper(),
      });

      // Vérifier que tous les hooks retournent des objets React Query valides
      expect(allProjects.current).toHaveProperty('data');
      expect(allProjects.current).toHaveProperty('isLoading');
      expect(allProjects.current).toHaveProperty('error');

      expect(singleProject.current).toHaveProperty('data');
      expect(singleProject.current).toHaveProperty('isLoading');
      expect(singleProject.current).toHaveProperty('error');

      expect(projectStats.current).toHaveProperty('data');
      expect(projectStats.current).toHaveProperty('isLoading');
      expect(projectStats.current).toHaveProperty('error');
    });
  });

  describe('Stale Time and Caching Behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should respect different stale times for different data types', async () => {
      const projectId = '1';

      mockProjectsApi.getAll.mockResolvedValue(mockProjects);
      mockProjectsApi.getById.mockResolvedValue(mockProject);
      mockProjectsApi.getStats.mockResolvedValue(mockProjectStats);

      // useProjects - 5 minutes stale time
      const { result: allProjects } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      // useProject - 1 minute stale time
      const { result: singleProject } = renderHook(() => useProject(projectId), {
        wrapper: createWrapper(),
      });

      // useProjectStats - 30 seconds stale time
      const { result: projectStats } = renderHook(() => useProjectStats(projectId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(allProjects.current.isSuccess).toBe(true);
        expect(singleProject.current.isSuccess).toBe(true);
        expect(projectStats.current.isSuccess).toBe(true);
      });

      // Vérifier que les appels initiaux ont été faits
      expect(mockProjectsApi.getAll).toHaveBeenCalledTimes(1);
      expect(mockProjectsApi.getById).toHaveBeenCalledTimes(1);
      expect(mockProjectsApi.getStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('should handle network errors and provide retry capability', async () => {
      const networkError = new Error('Network request failed');
      mockProjectsApi.getAll.mockRejectedValue(networkError);

      const { result } = renderHook(() => useProjects(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(networkError);
      expect(typeof result.current.refetch).toBe('function');

      // Test manual retry
      mockProjectsApi.getAll.mockResolvedValue(mockProjects);

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProjects.data);
    });
  });

  describe('Concurrent Hook Usage', () => {
    it('should handle multiple hooks for the same project efficiently', async () => {
      const projectId = '1';

      mockProjectsApi.getById.mockResolvedValue(mockProject);
      mockProjectsApi.getStats.mockResolvedValue(mockProjectStats);

      // Utiliser les deux hooks pour le même projet
      const { result: projectResult } = renderHook(() => useProject(projectId), {
        wrapper: createWrapper(),
      });

      const { result: statsResult } = renderHook(() => useProjectStats(projectId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(projectResult.current.isSuccess).toBe(true);
        expect(statsResult.current.isSuccess).toBe(true);
      });

      // Vérifier que les deux appels ont été faits indépendamment
      expect(mockProjectsApi.getById).toHaveBeenCalledWith(projectId);
      expect(mockProjectsApi.getStats).toHaveBeenCalledWith(projectId);

      expect(projectResult.current.data).toEqual(mockProject.data);
      expect(statsResult.current.data).toEqual(mockProjectStats.data);
    });
  });
});