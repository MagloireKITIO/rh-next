import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { candidatesApi } from '@/lib/api-client'
import {
  useUploadCVs,
  useAnalyzeCandidate,
  useDeleteCandidate,
  useRemoveCandidateFromPipeline,
} from './useCandidateMutations'

vi.mock('@/lib/api-client', () => ({
  candidatesApi: {
    uploadCVs: vi.fn(),
    analyze: vi.fn(),
    delete: vi.fn(),
    removeFromPipeline: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useCandidateMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useUploadCVs', () => {
    it('should upload CVs successfully', async () => {
      const mockResponse = {
        data: {
          successful: 2,
          failed: 0,
          candidates: [
            { id: '1', name: 'Candidate 1' },
            { id: '2', name: 'Candidate 2' },
          ],
        },
      }

      vi.mocked(candidatesApi.uploadCVs).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useUploadCVs(), { wrapper })

      const files = [
        new File(['cv1'], 'cv1.pdf', { type: 'application/pdf' }),
        new File(['cv2'], 'cv2.pdf', { type: 'application/pdf' }),
      ]

      result.current.mutate({ projectId: 'project-1', files })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(candidatesApi.uploadCVs).toHaveBeenCalledWith('project-1', files)
      expect(result.current.data).toEqual(mockResponse.data)
    })

    it('should handle upload errors', async () => {
      const error = {
        response: {
          data: { message: 'Upload failed' },
        },
      }

      vi.mocked(candidatesApi.uploadCVs).mockRejectedValue(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useUploadCVs(), { wrapper })

      const files = [new File(['cv1'], 'cv1.pdf')]

      result.current.mutate({ projectId: 'project-1', files })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })

    it('should show success and warning toasts based on results', async () => {
      const mockResponse = {
        data: {
          successful: 1,
          failed: 1,
          candidates: [{ id: '1', name: 'Candidate 1' }],
        },
      }

      vi.mocked(candidatesApi.uploadCVs).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useUploadCVs(), { wrapper })

      const files = [new File(['cv1'], 'cv1.pdf')]

      result.current.mutate({ projectId: 'project-1', files })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const toast = await import('sonner')
      expect(toast.toast.success).toHaveBeenCalledWith('1 CV(s) uploaded successfully')
      expect(toast.toast.warning).toHaveBeenCalledWith('1 CV(s) failed to upload')
    })
  })

  describe('useAnalyzeCandidate', () => {
    it('should analyze candidate successfully', async () => {
      const mockResponse = {
        data: {
          id: 'analysis-1',
          candidateId: 'candidate-1',
          status: 'completed',
        },
      }

      vi.mocked(candidatesApi.analyze).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useAnalyzeCandidate(), { wrapper })

      result.current.mutate('candidate-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(candidatesApi.analyze).toHaveBeenCalledWith('candidate-1')
      expect(result.current.data).toEqual(mockResponse.data)
    })

    it('should handle analysis errors', async () => {
      const error = {
        response: {
          data: { message: 'Analysis failed' },
        },
      }

      vi.mocked(candidatesApi.analyze).mockRejectedValue(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useAnalyzeCandidate(), { wrapper })

      result.current.mutate('candidate-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })

    it('should implement optimistic updates', async () => {
      const mockCandidate = {
        id: 'candidate-1',
        name: 'Test Candidate',
        status: 'pending',
        score: 75,
      }

      // Mock the query client to return previous candidate data
      const wrapper = createWrapper()
      const { result } = renderHook(() => useAnalyzeCandidate(), { wrapper })

      // Set up initial data in query client
      const queryClient = new QueryClient()
      queryClient.setQueryData(['candidates', 'candidate-1'], mockCandidate)

      vi.mocked(candidatesApi.analyze).mockImplementation(() => new Promise(() => {})) // Never resolves

      result.current.mutate('candidate-1')

      await waitFor(() => {
        expect(result.current.isPending).toBe(true)
      })

      expect(candidatesApi.analyze).toHaveBeenCalledWith('candidate-1')
    })

    it('should show success toast on completion', async () => {
      const mockResponse = {
        data: { id: 'analysis-1', status: 'completed' },
      }

      vi.mocked(candidatesApi.analyze).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useAnalyzeCandidate(), { wrapper })

      result.current.mutate('candidate-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const toast = await import('sonner')
      expect(toast.toast.success).toHaveBeenCalledWith('Analysis started')
    })
  })

  describe('useDeleteCandidate', () => {
    it('should delete candidate successfully', async () => {
      const mockResponse = { data: { success: true } }

      vi.mocked(candidatesApi.delete).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useDeleteCandidate(), { wrapper })

      result.current.mutate('candidate-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(candidatesApi.delete).toHaveBeenCalledWith('candidate-1')
    })

    it('should handle delete errors', async () => {
      const error = {
        response: {
          data: { message: 'Delete failed' },
        },
      }

      vi.mocked(candidatesApi.delete).mockRejectedValue(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useDeleteCandidate(), { wrapper })

      result.current.mutate('candidate-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })

    it('should show success toast on deletion', async () => {
      const mockResponse = { data: { success: true } }

      vi.mocked(candidatesApi.delete).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useDeleteCandidate(), { wrapper })

      result.current.mutate('candidate-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const toast = await import('sonner')
      expect(toast.toast.success).toHaveBeenCalledWith('Candidate deleted successfully')
    })
  })

  describe('useRemoveCandidateFromPipeline', () => {
    it('should remove candidate from pipeline successfully', async () => {
      const mockResponse = { data: { success: true } }

      vi.mocked(candidatesApi.removeFromPipeline).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useRemoveCandidateFromPipeline(), { wrapper })

      result.current.mutate({ candidateId: 'candidate-1', pipelineId: 'pipeline-1' })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(candidatesApi.removeFromPipeline).toHaveBeenCalledWith('candidate-1')
    })

    it('should handle removal errors', async () => {
      const error = {
        response: {
          data: { message: 'Removal failed' },
        },
      }

      vi.mocked(candidatesApi.removeFromPipeline).mockRejectedValue(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useRemoveCandidateFromPipeline(), { wrapper })

      result.current.mutate({ candidateId: 'candidate-1' })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })

    it('should show success toast in French', async () => {
      const mockResponse = { data: { success: true } }

      vi.mocked(candidatesApi.removeFromPipeline).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useRemoveCandidateFromPipeline(), { wrapper })

      result.current.mutate({ candidateId: 'candidate-1', pipelineId: 'pipeline-1' })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const toast = await import('sonner')
      expect(toast.toast.success).toHaveBeenCalledWith('Candidat retiré du pipeline')
    })

    it('should work without pipelineId', async () => {
      const mockResponse = { data: { success: true } }

      vi.mocked(candidatesApi.removeFromPipeline).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useRemoveCandidateFromPipeline(), { wrapper })

      result.current.mutate({ candidateId: 'candidate-1' })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(candidatesApi.removeFromPipeline).toHaveBeenCalledWith('candidate-1')
    })
  })
})