import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api-client'
import {
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from './useProjectMutations'

vi.mock('@/lib/api-client', () => ({
  projectsApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  jobDescription: 'Test job description',
  customPrompt: 'Custom prompt',
  status: 'active',
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  candidates: [],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

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

describe('useProjectMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useCreateProject', () => {
    it('should create project successfully', async () => {
      const mockResponse = { data: mockProject }
      const createData = {
        name: 'Test Project',
        jobDescription: 'Test job description',
        customPrompt: 'Custom prompt',
      }

      vi.mocked(projectsApi.create).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCreateProject(), { wrapper })

      result.current.mutate(createData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(projectsApi.create).toHaveBeenCalledWith(createData)
      expect(result.current.data).toEqual(mockProject)
    })

    it('should handle create errors', async () => {
      const error = {
        response: {
          data: { message: 'Project creation failed' },
        },
      }

      vi.mocked(projectsApi.create).mockRejectedValue(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCreateProject(), { wrapper })

      const createData = {
        name: 'Test Project',
        jobDescription: 'Test job description',
      }

      result.current.mutate(createData)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })

    it('should show success toast on creation', async () => {
      const mockResponse = { data: mockProject }
      const createData = {
        name: 'Test Project',
        jobDescription: 'Test job description',
      }

      vi.mocked(projectsApi.create).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCreateProject(), { wrapper })

      result.current.mutate(createData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const toast = await import('sonner')
      expect(toast.toast.success).toHaveBeenCalledWith('Project created successfully')
    })

    it('should show error toast on failure', async () => {
      const error = {
        response: {
          data: { message: 'Validation failed' },
        },
      }

      vi.mocked(projectsApi.create).mockRejectedValue(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCreateProject(), { wrapper })

      const createData = {
        name: '',
        jobDescription: 'Test job description',
      }

      result.current.mutate(createData)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      const toast = await import('sonner')
      expect(toast.toast.error).toHaveBeenCalledWith('Validation failed')
    })

    it('should create project without customPrompt', async () => {
      const mockResponse = { data: { ...mockProject, customPrompt: undefined } }
      const createData = {
        name: 'Test Project',
        jobDescription: 'Test job description',
      }

      vi.mocked(projectsApi.create).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useCreateProject(), { wrapper })

      result.current.mutate(createData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(projectsApi.create).toHaveBeenCalledWith(createData)
    })
  })

  describe('useUpdateProject', () => {
    it('should update project successfully', async () => {
      const updatedProject = { ...mockProject, name: 'Updated Project' }
      const mockResponse = { data: updatedProject }
      const updateData = { name: 'Updated Project' }

      vi.mocked(projectsApi.update).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useUpdateProject(), { wrapper })

      result.current.mutate({ id: 'project-1', data: updateData })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(projectsApi.update).toHaveBeenCalledWith('project-1', updateData)
      expect(result.current.data).toEqual(updatedProject)
    })

    it('should handle update errors', async () => {
      const error = {
        response: {
          data: { message: 'Update failed' },
        },
      }

      vi.mocked(projectsApi.update).mockRejectedValue(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useUpdateProject(), { wrapper })

      result.current.mutate({ id: 'project-1', data: { name: 'Updated Project' } })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })

    it('should show success toast on update', async () => {
      const updatedProject = { ...mockProject, name: 'Updated Project' }
      const mockResponse = { data: updatedProject }

      vi.mocked(projectsApi.update).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useUpdateProject(), { wrapper })

      result.current.mutate({ id: 'project-1', data: { name: 'Updated Project' } })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const toast = await import('sonner')
      expect(toast.toast.success).toHaveBeenCalledWith('Project updated successfully')
    })

    it('should update partial project data', async () => {
      const updatedProject = { ...mockProject, status: 'inactive' }
      const mockResponse = { data: updatedProject }
      const updateData = { status: 'inactive' }

      vi.mocked(projectsApi.update).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useUpdateProject(), { wrapper })

      result.current.mutate({ id: 'project-1', data: updateData })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(projectsApi.update).toHaveBeenCalledWith('project-1', updateData)
    })

    it('should update multiple fields', async () => {
      const updatedProject = {
        ...mockProject,
        name: 'New Name',
        jobDescription: 'New Description',
        customPrompt: 'New Prompt',
      }
      const mockResponse = { data: updatedProject }
      const updateData = {
        name: 'New Name',
        jobDescription: 'New Description',
        customPrompt: 'New Prompt',
      }

      vi.mocked(projectsApi.update).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useUpdateProject(), { wrapper })

      result.current.mutate({ id: 'project-1', data: updateData })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(projectsApi.update).toHaveBeenCalledWith('project-1', updateData)
      expect(result.current.data).toEqual(updatedProject)
    })
  })

  describe('useDeleteProject', () => {
    it('should delete project successfully', async () => {
      const mockResponse = { data: { success: true } }

      vi.mocked(projectsApi.delete).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useDeleteProject(), { wrapper })

      result.current.mutate('project-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(projectsApi.delete).toHaveBeenCalledWith('project-1')
    })

    it('should handle delete errors', async () => {
      const error = {
        response: {
          data: { message: 'Delete failed' },
        },
      }

      vi.mocked(projectsApi.delete).mockRejectedValue(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useDeleteProject(), { wrapper })

      result.current.mutate('project-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })

    it('should show success toast on deletion', async () => {
      const mockResponse = { data: { success: true } }

      vi.mocked(projectsApi.delete).mockResolvedValue(mockResponse)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useDeleteProject(), { wrapper })

      result.current.mutate('project-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const toast = await import('sonner')
      expect(toast.toast.success).toHaveBeenCalledWith('Project deleted successfully')
    })

    it('should show error toast on failure', async () => {
      const error = {
        response: {
          data: { message: 'Cannot delete project with candidates' },
        },
      }

      vi.mocked(projectsApi.delete).mockRejectedValue(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useDeleteProject(), { wrapper })

      result.current.mutate('project-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      const toast = await import('sonner')
      expect(toast.toast.error).toHaveBeenCalledWith('Cannot delete project with candidates')
    })

    it('should show generic error message when no specific message', async () => {
      const error = new Error('Network error')

      vi.mocked(projectsApi.delete).mockRejectedValue(error)

      const wrapper = createWrapper()
      const { result } = renderHook(() => useDeleteProject(), { wrapper })

      result.current.mutate('project-1')

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      const toast = await import('sonner')
      expect(toast.toast.error).toHaveBeenCalledWith('Error deleting project')
    })
  })
})