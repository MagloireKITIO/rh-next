import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './auth-context'
import { authApi } from '@/lib/api-client'

vi.mock('@/lib/api-client', () => ({
  authApi: {
    getProfile: vi.fn(),
    signin: vi.fn(),
    acceptInvitation: vi.fn(),
    updateProfile: vi.fn(),
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  role: 'user' as const,
  is_onboarded: true,
  company: {
    id: 'company-uuid-1',
    name: 'Test Company',
    domain: 'test.com',
  },
}

const TestComponent = () => {
  const auth = useAuth()
  return (
    <div>
      <div data-testid="loading">{auth.loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{auth.user ? auth.user.name : 'no-user'}</div>
      <div data-testid="role">{auth.user?.role || 'no-role'}</div>
      <div data-testid="is-admin">{auth.isAdmin() ? 'admin' : 'not-admin'}</div>
      <div data-testid="is-hr">{auth.isHR() ? 'hr' : 'not-hr'}</div>
      <button onClick={() => auth.signIn('test@example.com', 'password')}>
        Sign In
      </button>
      <button onClick={() => auth.signOut()}>Sign Out</button>
      <button onClick={() => auth.refreshProfile()}>Refresh</button>
    </div>
  )
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
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(authApi.getProfile).mockResolvedValue({ data: mockUser })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should provide auth context values', () => {
    const wrapper = createWrapper()
    render(<TestComponent />, { wrapper })

    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    expect(screen.getByTestId('role')).toHaveTextContent('no-role')
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })

  it('should initialize with token from localStorage', async () => {
    localStorage.setItem('token', 'test-jwt-token')

    const wrapper = createWrapper()
    render(<TestComponent />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })

    expect(authApi.getProfile).toHaveBeenCalled()
    expect(screen.getByTestId('role')).toHaveTextContent('user')
  })

  it('should handle signin success', async () => {
    const signinResponse = {
      data: {
        access_token: 'new-jwt-token',
        user: mockUser,
      },
    }

    vi.mocked(authApi.signin).mockResolvedValue(signinResponse)

    const wrapper = createWrapper()
    render(<TestComponent />, { wrapper })

    await act(async () => {
      screen.getByText('Sign In').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })

    expect(localStorage.getItem('token')).toBe('new-jwt-token')
    expect(authApi.signin).toHaveBeenCalledWith('test@example.com', 'password')
  })

  it('should handle signin error', async () => {
    const signinError = new Error('Invalid credentials')
    vi.mocked(authApi.signin).mockRejectedValue(signinError)

    const wrapper = createWrapper()
    render(<TestComponent />, { wrapper })

    await act(async () => {
      screen.getByText('Sign In').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    expect(localStorage.getItem('token')).toBeNull()
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('should handle signOut', async () => {
    localStorage.setItem('token', 'test-jwt-token')

    const wrapper = createWrapper()
    render(<TestComponent />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })

    await act(async () => {
      screen.getByText('Sign Out').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })

    expect(localStorage.getItem('token')).toBeNull()
  })

  it('should handle acceptInvitation', async () => {
    const invitationResponse = {
      data: {
        access_token: 'invitation-jwt-token',
        user: mockUser,
      },
    }

    vi.mocked(authApi.acceptInvitation).mockResolvedValue(invitationResponse)

    const wrapper = createWrapper()
    const { result } = render(<TestComponent />, { wrapper })

    await act(async () => {
      const auth = useAuth()
      await auth.acceptInvitation('invitation-token', 'newpassword')
    })

    expect(localStorage.getItem('token')).toBe('invitation-jwt-token')
    expect(authApi.acceptInvitation).toHaveBeenCalledWith('invitation-token', 'newpassword')
  })

  it('should handle refreshProfile', async () => {
    localStorage.setItem('token', 'test-jwt-token')

    const wrapper = createWrapper()
    render(<TestComponent />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })

    const updatedUser = { ...mockUser, name: 'Updated User' }
    vi.mocked(authApi.getProfile).mockResolvedValue({ data: updatedUser })

    await act(async () => {
      screen.getByText('Refresh').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Updated User')
    })
  })

  it('should handle updateProfile', async () => {
    localStorage.setItem('token', 'test-jwt-token')

    const updateResponse = {
      data: {
        user: { ...mockUser, name: 'Updated Name', email: 'updated@example.com' },
      },
    }

    vi.mocked(authApi.updateProfile).mockResolvedValue(updateResponse)

    const wrapper = createWrapper()
    render(<TestComponent />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })

    await act(async () => {
      const auth = useAuth()
      await auth.updateProfile({ name: 'Updated Name', email: 'updated@example.com' })
    })

    expect(authApi.updateProfile).toHaveBeenCalledWith({
      name: 'Updated Name',
      email: 'updated@example.com'
    })
  })

  it('should correctly check roles', () => {
    localStorage.setItem('token', 'test-jwt-token')

    const wrapper = createWrapper()
    render(<TestComponent />, { wrapper })

    // Test with user role
    expect(screen.getByTestId('is-admin')).toHaveTextContent('not-admin')
    expect(screen.getByTestId('is-hr')).toHaveTextContent('not-hr')
  })

  it('should correctly identify admin role', async () => {
    const adminUser = { ...mockUser, role: 'admin' as const }
    vi.mocked(authApi.getProfile).mockResolvedValue({ data: adminUser })
    localStorage.setItem('token', 'test-jwt-token')

    const wrapper = createWrapper()
    render(<TestComponent />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('is-admin')).toHaveTextContent('admin')
      expect(screen.getByTestId('is-hr')).toHaveTextContent('hr')
    })
  })

  it('should correctly identify hr role', async () => {
    const hrUser = { ...mockUser, role: 'hr' as const }
    vi.mocked(authApi.getProfile).mockResolvedValue({ data: hrUser })
    localStorage.setItem('token', 'test-jwt-token')

    const wrapper = createWrapper()
    render(<TestComponent />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('is-admin')).toHaveTextContent('not-admin')
      expect(screen.getByTestId('is-hr')).toHaveTextContent('hr')
    })
  })

  it('should handle invalid token gracefully', async () => {
    const authError = {
      response: {
        status: 401,
        data: { message: 'Invalid token' },
      },
    }

    vi.mocked(authApi.getProfile).mockRejectedValue(authError)
    localStorage.setItem('token', 'invalid-token')

    const wrapper = createWrapper()
    render(<TestComponent />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    expect(localStorage.getItem('token')).toBeNull()
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('should preserve token on network errors', async () => {
    const networkError = {
      response: {
        status: 500,
        data: { message: 'Server error' },
      },
    }

    vi.mocked(authApi.getProfile).mockRejectedValue(networkError)
    localStorage.setItem('token', 'valid-token')

    const wrapper = createWrapper()
    render(<TestComponent />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    expect(localStorage.getItem('token')).toBe('valid-token')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })
})