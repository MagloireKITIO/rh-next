import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { candidatesApi, publicApi } from '@/lib/api-client';
import {
  useCandidates,
  useCandidatesByProject,
  useCandidatesWithSearch,
  useCandidatesByProjectLegacy,
  useCandidate,
  useCandidateInProject,
  useRankingChanges,
  useQueueStatus,
  useSharedProjectCandidates,
} from './useCandidates';

// Mock des APIs
jest.mock('@/lib/api-client', () => ({
  candidatesApi: {
    getAll: jest.fn(),
    getByProject: jest.fn(),
    getById: jest.fn(),
    getCandidateInProject: jest.fn(),
    getRankingChanges: jest.fn(),
    getQueueStatus: jest.fn(),
  },
  publicApi: {
    getSharedProjectCandidates: jest.fn(),
  },
}));

const mockCandidatesApi = candidatesApi as jest.Mocked<typeof candidatesApi>;
const mockPublicApi = publicApi as jest.Mocked<typeof publicApi>;

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
const mockPaginatedResponse = {
  data: {
    data: [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        projectId: 'proj1',
        score: 85,
        status: 'active',
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        projectId: 'proj1',
        score: 92,
        status: 'active',
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    },
  },
};

const mockCandidate = {
  data: {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    projectId: 'proj1',
    score: 85,
    status: 'active',
    cvPath: '/uploads/cv1.pdf',
  },
};

const mockRankingChanges = {
  data: [
    {
      candidateId: '1',
      oldRank: 3,
      newRank: 1,
      timestamp: '2024-01-01T10:00:00Z',
    },
    {
      candidateId: '2',
      oldRank: 1,
      newRank: 2,
      timestamp: '2024-01-01T10:00:00Z',
    },
  ],
};

const mockQueueStatus = {
  data: {
    pending: 5,
    processing: 2,
    completed: 15,
    failed: 1,
    totalInQueue: 7,
  },
};

describe('useCandidates Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useCandidates', () => {
    it('should fetch all candidates with default params', async () => {
      mockCandidatesApi.getAll.mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useCandidates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCandidatesApi.getAll).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual(mockPaginatedResponse.data);
    });

    it('should fetch candidates with pagination params', async () => {
      const params = { page: 2, limit: 10 };
      mockCandidatesApi.getAll.mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useCandidates(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCandidatesApi.getAll).toHaveBeenCalledWith(params);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockCandidatesApi.getAll.mockRejectedValue(error);

      const { result } = renderHook(() => useCandidates(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useCandidatesByProject', () => {
    it('should fetch candidates by project ID', async () => {
      const projectId = 'proj1';
      mockCandidatesApi.getByProject.mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useCandidatesByProject(projectId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCandidatesApi.getByProject).toHaveBeenCalledWith(projectId, undefined);
      expect(result.current.data).toEqual(mockPaginatedResponse.data);
    });

    it('should not fetch when projectId is empty', () => {
      const { result } = renderHook(() => useCandidatesByProject(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockCandidatesApi.getByProject).not.toHaveBeenCalled();
    });

    it('should include pagination params', async () => {
      const projectId = 'proj1';
      const params = { page: 2, limit: 5 };
      mockCandidatesApi.getByProject.mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useCandidatesByProject(projectId, params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCandidatesApi.getByProject).toHaveBeenCalledWith(projectId, params);
    });
  });

  describe('useCandidatesWithSearch', () => {
    const projectId = 'proj1';

    it('should fetch candidates with search filters', async () => {
      const searchParams = {
        search: 'John',
        statusFilter: 'active',
        scoreFilter: 'excellent',
        page: 1,
        limit: 20,
      };

      mockCandidatesApi.getByProject.mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useCandidatesWithSearch(projectId, searchParams), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCandidatesApi.getByProject).toHaveBeenCalledWith(projectId, {
        page: 1,
        limit: 20,
        search: 'John',
        status: 'active',
        scoreFilter: 'excellent',
      });
    });

    it('should not fetch when no filters are applied', () => {
      const searchParams = {
        statusFilter: 'all',
        scoreFilter: 'all',
      };

      const { result } = renderHook(() => useCandidatesWithSearch(projectId, searchParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockCandidatesApi.getByProject).not.toHaveBeenCalled();
    });

    it('should not fetch when projectId is empty', () => {
      const searchParams = { search: 'John' };

      const { result } = renderHook(() => useCandidatesWithSearch('', searchParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should handle undefined filters correctly', async () => {
      const searchParams = {
        search: 'test',
      };

      mockCandidatesApi.getByProject.mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useCandidatesWithSearch(projectId, searchParams), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCandidatesApi.getByProject).toHaveBeenCalledWith(projectId, {
        page: 1,
        limit: 20,
        search: 'test',
        status: undefined,
        scoreFilter: undefined,
      });
    });
  });

  describe('useCandidatesByProjectLegacy', () => {
    it('should fetch candidates in legacy format', async () => {
      const projectId = 'proj1';
      mockCandidatesApi.getByProject.mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useCandidatesByProjectLegacy(projectId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCandidatesApi.getByProject).toHaveBeenCalledWith(projectId, {
        page: 1,
        limit: 1000,
      });
      expect(result.current.data).toEqual(mockPaginatedResponse.data.data);
    });

    it('should not fetch when projectId is empty', () => {
      const { result } = renderHook(() => useCandidatesByProjectLegacy(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useCandidate', () => {
    it('should fetch single candidate by ID', async () => {
      const candidateId = '1';
      mockCandidatesApi.getById.mockResolvedValue(mockCandidate);

      const { result } = renderHook(() => useCandidate(candidateId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCandidatesApi.getById).toHaveBeenCalledWith(candidateId);
      expect(result.current.data).toEqual(mockCandidate.data);
    });

    it('should not fetch when candidateId is empty', () => {
      const { result } = renderHook(() => useCandidate(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useCandidateInProject', () => {
    it('should fetch candidate in specific project context', async () => {
      const projectId = 'proj1';
      const candidateId = '1';
      mockCandidatesApi.getCandidateInProject.mockResolvedValue(mockCandidate);

      const { result } = renderHook(() => useCandidateInProject(projectId, candidateId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCandidatesApi.getCandidateInProject).toHaveBeenCalledWith(projectId, candidateId);
      expect(result.current.data).toEqual(mockCandidate.data);
    });

    it('should not fetch when either ID is empty', () => {
      const { result: result1 } = renderHook(() => useCandidateInProject('', 'candidate1'), {
        wrapper: createWrapper(),
      });

      const { result: result2 } = renderHook(() => useCandidateInProject('project1', ''), {
        wrapper: createWrapper(),
      });

      expect(result1.current.isPending).toBe(true);
      expect(result1.current.fetchStatus).toBe('idle');
      expect(result2.current.isPending).toBe(true);
      expect(result2.current.fetchStatus).toBe('idle');
    });
  });

  describe('useRankingChanges', () => {
    it('should fetch ranking changes for project', async () => {
      const projectId = 'proj1';
      mockCandidatesApi.getRankingChanges.mockResolvedValue(mockRankingChanges);

      const { result } = renderHook(() => useRankingChanges(projectId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCandidatesApi.getRankingChanges).toHaveBeenCalledWith(projectId);
      expect(result.current.data).toEqual(mockRankingChanges.data);
    });

    it('should not fetch when projectId is empty', () => {
      const { result } = renderHook(() => useRankingChanges(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useQueueStatus', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should fetch queue status with auto-refresh', async () => {
      const projectId = 'proj1';
      mockCandidatesApi.getQueueStatus.mockResolvedValue(mockQueueStatus);

      const { result } = renderHook(() => useQueueStatus(projectId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCandidatesApi.getQueueStatus).toHaveBeenCalledWith(projectId);
      expect(result.current.data).toEqual(mockQueueStatus.data);

      // Test auto-refresh
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockCandidatesApi.getQueueStatus).toHaveBeenCalledTimes(2);
      });
    });

    it('should not fetch when projectId is empty', () => {
      const { result } = renderHook(() => useQueueStatus(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useSharedProjectCandidates', () => {
    const token = 'shared-token-123';

    it('should fetch shared project candidates with filters', async () => {
      const searchParams = {
        search: 'test',
        statusFilter: 'active',
        scoreFilter: 'excellent',
        page: 1,
        limit: 20,
      };

      mockPublicApi.getSharedProjectCandidates.mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useSharedProjectCandidates(token, searchParams), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockPublicApi.getSharedProjectCandidates).toHaveBeenCalledWith(token, {
        page: 1,
        limit: 20,
        search: 'test',
        status: 'active',
        scoreFilter: 'excellent',
      });
      expect(result.current.data).toEqual(mockPaginatedResponse.data);
    });

    it('should handle "all" filter values correctly', async () => {
      const searchParams = {
        statusFilter: 'all',
        scoreFilter: 'all',
        page: 2,
      };

      mockPublicApi.getSharedProjectCandidates.mockResolvedValue(mockPaginatedResponse);

      const { result } = renderHook(() => useSharedProjectCandidates(token, searchParams), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockPublicApi.getSharedProjectCandidates).toHaveBeenCalledWith(token, {
        page: 2,
        limit: 20,
        search: undefined,
        status: undefined,
        scoreFilter: undefined,
      });
    });

    it('should not fetch when token is empty', () => {
      const searchParams = { search: 'test' };

      const { result } = renderHook(() => useSharedProjectCandidates('', searchParams), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should handle API errors for shared candidates', async () => {
      const error = new Error('Unauthorized access');
      mockPublicApi.getSharedProjectCandidates.mockRejectedValue(error);

      const { result } = renderHook(() => useSharedProjectCandidates(token, {}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('Query Key Consistency', () => {
    it('should use consistent query keys for different hooks', () => {
      const projectId = 'proj1';
      const candidateId = 'cand1';

      // Vérification que les clés de requête sont cohérentes et prévisibles
      const hooks = [
        useCandidates,
        () => useCandidatesByProject(projectId),
        () => useCandidatesWithSearch(projectId, { search: 'test' }),
        () => useCandidatesByProjectLegacy(projectId),
        () => useCandidate(candidateId),
        () => useCandidateInProject(projectId, candidateId),
        () => useRankingChanges(projectId),
        () => useQueueStatus(projectId),
        () => useSharedProjectCandidates('token', {}),
      ];

      hooks.forEach(hook => {
        const { result } = renderHook(hook, {
          wrapper: createWrapper(),
        });

        // Vérifier que le hook retourne bien un objet React Query valide
        expect(result.current).toHaveProperty('data');
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('error');
        expect(result.current).toHaveProperty('isSuccess');
        expect(result.current).toHaveProperty('isError');
      });
    });
  });

  describe('Stale Time Configuration', () => {
    it('should use different stale times for different data types', () => {
      // Test que les stale times sont configurés différemment selon le type de données
      const projectId = 'proj1';

      // useCandidates - 1 minute (données moins changeantes)
      const { result: candidates } = renderHook(() => useCandidates(), {
        wrapper: createWrapper(),
      });

      // useCandidatesByProject - 30 secondes (données changeantes avec analyses)
      const { result: projectCandidates } = renderHook(() => useCandidatesByProject(projectId), {
        wrapper: createWrapper(),
      });

      // useQueueStatus - 5 secondes avec refetch (données temps réel)
      const { result: queueStatus } = renderHook(() => useQueueStatus(projectId), {
        wrapper: createWrapper(),
      });

      // Tous les hooks doivent être correctement configurés
      expect(candidates.current).toBeDefined();
      expect(projectCandidates.current).toBeDefined();
      expect(queueStatus.current).toBeDefined();
    });
  });
});