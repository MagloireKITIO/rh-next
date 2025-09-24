import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePlatformSettings } from './use-platform-settings'

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

describe('usePlatformSettings', () => {
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = vi.fn()
  })

  it('should return platform settings', async () => {
    const mockSettings = {
      theme: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        accentColor: '#28a745',
        destructiveColor: '#dc3545',
        borderRadius: '8px',
        fontFamily: 'Inter',
      },
      branding: {
        logoUrl: 'https://example.com/logo.png',
        title: 'Test Platform',
        favicon: '/favicon.ico',
        companyName: 'Test Company',
      },
      layout: {
        showHeader: true,
        showFooter: true,
        sidebarStyle: 'expanded' as const,
      },
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings,
    } as Response)

    const wrapper = createWrapper()
    const { result } = renderHook(() => usePlatformSettings(), { wrapper })

    await waitFor(() => {
      expect(result.current.data).toEqual(mockSettings)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should handle loading state', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

    const wrapper = createWrapper()
    const { result } = renderHook(() => usePlatformSettings(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('should handle error state', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Failed to fetch'))

    const wrapper = createWrapper()
    const { result } = renderHook(() => usePlatformSettings(), { wrapper })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })
})