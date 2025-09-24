import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { apiClient, authApi, projectsApi, candidatesApi } from './api-client'

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    })),
  },
}))

const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any)
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Request Interceptor', () => {
    it('should add Authorization header when token exists', () => {
      localStorage.setItem('token', 'test-jwt-token')

      const config = { headers: {} }
      const requestInterceptor = vi.mocked(mockAxiosInstance.interceptors.request.use).mock.calls[0][0]

      const result = requestInterceptor(config)

      expect(result.headers.Authorization).toBe('Bearer test-jwt-token')
    })

    it('should not add Authorization header when no token', () => {
      const config = { headers: {} }
      const requestInterceptor = vi.mocked(mockAxiosInstance.interceptors.request.use).mock.calls[0][0]

      const result = requestInterceptor(config)

      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should handle request errors', () => {
      const requestErrorHandler = vi.mocked(mockAxiosInstance.interceptors.request.use).mock.calls[0][1]
      const error = new Error('Request error')

      expect(() => requestErrorHandler(error)).rejects.toThrow('Request error')
    })
  })

  describe('Response Interceptor', () => {
    it('should pass through successful responses', () => {
      const response = { data: { message: 'success' }, status: 200 }
      const responseInterceptor = vi.mocked(mockAxiosInstance.interceptors.response.use).mock.calls[0][0]

      const result = responseInterceptor(response)

      expect(result).toEqual(response)
    })

    it('should handle 401 auth errors and redirect', () => {
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      })

      localStorage.setItem('token', 'invalid-token')

      const authError = {
        response: {
          status: 401,
          data: { message: 'Invalid token' },
          config: { url: '/auth/profile' },
        },
      }

      const responseErrorHandler = vi.mocked(mockAxiosInstance.interceptors.response.use).mock.calls[0][1]

      expect(() => responseErrorHandler(authError)).rejects.toThrow()
      expect(localStorage.getItem('token')).toBeNull()
      expect(window.location.href).toBe('/auth/login')
    })

    it('should not redirect on non-auth 401 errors', () => {
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      })

      localStorage.setItem('token', 'valid-token')

      const nonAuthError = {
        response: {
          status: 401,
          data: { message: 'Access denied' },
          config: { url: '/projects/123' },
        },
      }

      const responseErrorHandler = vi.mocked(mockAxiosInstance.interceptors.response.use).mock.calls[0][1]

      expect(() => responseErrorHandler(nonAuthError)).rejects.toThrow()
      expect(localStorage.getItem('token')).toBe('valid-token')
      expect(window.location.href).toBe('')
    })

    it('should handle network errors without clearing token', () => {
      localStorage.setItem('token', 'valid-token')

      const networkError = {
        message: 'Network error',
        code: 'NETWORK_ERROR',
      }

      const responseErrorHandler = vi.mocked(mockAxiosInstance.interceptors.response.use).mock.calls[0][1]

      expect(() => responseErrorHandler(networkError)).rejects.toThrow()
      expect(localStorage.getItem('token')).toBe('valid-token')
    })
  })

  describe('Auth API', () => {
    it('should call signin endpoint', async () => {
      const mockResponse = {
        data: {
          access_token: 'jwt-token',
          user: { id: '1', email: 'test@example.com' },
        },
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await authApi.signin('test@example.com', 'password')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/signin', {
        email: 'test@example.com',
        password: 'password',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should call getProfile endpoint', async () => {
      const mockResponse = {
        data: { id: '1', email: 'test@example.com', role: 'user' },
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await authApi.getProfile()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/profile')
      expect(result).toEqual(mockResponse)
    })

    it('should call acceptInvitation endpoint', async () => {
      const mockResponse = {
        data: {
          access_token: 'jwt-token',
          user: { id: '1', email: 'test@example.com' },
        },
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await authApi.acceptInvitation('invitation-token', 'newpassword')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/accept-invitation', {
        invitation_token: 'invitation-token',
        password: 'newpassword',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should call updateProfile endpoint', async () => {
      const mockResponse = {
        data: { user: { id: '1', name: 'Updated Name', email: 'updated@example.com' } },
      }

      mockAxiosInstance.put.mockResolvedValue(mockResponse)

      const profileData = { name: 'Updated Name', email: 'updated@example.com' }
      const result = await authApi.updateProfile(profileData)

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/auth/profile', profileData)
      expect(result).toEqual(mockResponse)
    })

    it('should call uploadAvatar endpoint with FormData', async () => {
      const mockResponse = { data: { avatar_url: 'https://example.com/avatar.jpg' } }
      const formData = new FormData()
      formData.append('avatar', new File([''], 'avatar.jpg'))

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await authApi.uploadAvatar(formData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Projects API', () => {
    it('should get all projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', jobDescription: 'Description 1' },
        { id: '2', name: 'Project 2', jobDescription: 'Description 2' },
      ]

      mockAxiosInstance.get.mockResolvedValue({ data: mockProjects })

      const result = await projectsApi.getAll()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/projects')
      expect(result.data).toEqual(mockProjects)
    })

    it('should get project by id', async () => {
      const mockProject = { id: '1', name: 'Test Project', jobDescription: 'Test Description' }

      mockAxiosInstance.get.mockResolvedValue({ data: mockProject })

      const result = await projectsApi.getById('1')

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/projects/1')
      expect(result.data).toEqual(mockProject)
    })

    it('should create project', async () => {
      const newProject = {
        name: 'New Project',
        jobDescription: 'New Description',
        customPrompt: 'Custom prompt',
      }
      const mockResponse = { data: { id: '1', ...newProject } }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await projectsApi.create(newProject)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/projects', newProject)
      expect(result).toEqual(mockResponse)
    })

    it('should update project', async () => {
      const updateData = { name: 'Updated Project' }
      const mockResponse = { data: { id: '1', ...updateData } }

      mockAxiosInstance.patch.mockResolvedValue(mockResponse)

      const result = await projectsApi.update('1', updateData)

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/projects/1', updateData)
      expect(result).toEqual(mockResponse)
    })

    it('should delete project', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: { message: 'Deleted' } })

      const result = await projectsApi.delete('1')

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/projects/1')
    })

    it('should get project stats', async () => {
      const mockStats = {
        totalCandidates: 10,
        analyzedCandidates: 8,
        pendingAnalysis: 2,
        averageScore: 75,
        topCandidates: [],
      }

      mockAxiosInstance.get.mockResolvedValue({ data: mockStats })

      const result = await projectsApi.getStats('1')

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/projects/1/stats')
      expect(result.data).toEqual(mockStats)
    })

    it('should upload offer document', async () => {
      const formData = new FormData()
      formData.append('file', new File([''], 'offer.pdf'))

      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } })

      const result = await projectsApi.uploadOfferDocument('1', formData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/projects/1/offer-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    })
  })

  describe('Candidates API', () => {
    it('should get all candidates with pagination', async () => {
      const mockResponse = {
        data: {
          data: [{ id: '1', name: 'Candidate 1' }],
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await candidatesApi.getAll({ page: 1, limit: 50 })

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/candidates?page=1&limit=50')
      expect(result).toEqual(mockResponse)
    })

    it('should get candidates by project with filters', async () => {
      const mockResponse = {
        data: {
          data: [{ id: '1', name: 'Candidate 1', projectId: 'project-1' }],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const params = {
        page: 1,
        limit: 20,
        search: 'john',
        status: 'active',
        scoreFilter: 'excellent' as const,
      }

      const result = await candidatesApi.getByProject('project-1', params)

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/candidates?projectId=project-1&page=1&limit=20&search=john&status=active&scoreFilter=excellent'
      )
      expect(result).toEqual(mockResponse)
    })

    it('should upload CVs', async () => {
      const files = [
        new File(['cv1'], 'cv1.pdf'),
        new File(['cv2'], 'cv2.pdf'),
      ]

      mockAxiosInstance.post.mockResolvedValue({ data: { uploaded: 2 } })

      const result = await candidatesApi.uploadCVs('project-1', files)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/candidates/upload/project-1',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
    })

    it('should analyze candidate', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { analyzed: true } })

      const result = await candidatesApi.analyze('candidate-1')

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/candidates/candidate-1/analyze')
    })

    it('should send email to candidate', async () => {
      const emailData = {
        to: 'candidate@example.com',
        subject: 'Interview Invitation',
        message: 'You are invited for an interview',
        attachments: [new File([''], 'attachment.pdf')],
      }

      mockAxiosInstance.post.mockResolvedValue({ data: { sent: true } })

      const result = await candidatesApi.sendEmail('candidate-1', emailData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/candidates/candidate-1/send-email',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
    })

    it('should get ranking changes', async () => {
      const mockRankingChanges = [
        {
          id: '1',
          name: 'John Doe',
          currentScore: 85,
          previousScore: 80,
          scoreDiff: 5,
          trend: 'up' as const,
          ranking: 1,
        },
      ]

      mockAxiosInstance.get.mockResolvedValue({ data: mockRankingChanges })

      const result = await candidatesApi.getRankingChanges('project-1')

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/candidates/project/project-1/rankings')
      expect(result.data).toEqual(mockRankingChanges)
    })

    it('should delete candidate', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: { deleted: true } })

      const result = await candidatesApi.delete('candidate-1')

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/candidates/candidate-1')
    })
  })
})