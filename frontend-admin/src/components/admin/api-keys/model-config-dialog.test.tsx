import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ModelConfigDialog from './model-config-dialog'
import { ApiKey } from '@/lib/api-client'

const mockApiKey: ApiKey = {
  id: 'test-id',
  name: 'Test API Key',
  provider: 'openrouter',
  model: 'test-model',
  isActive: true,
  usage: 100,
  monthlyLimit: 1000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('ModelConfigDialog', () => {
  beforeEach(() => {
    queryClient.clear()
  })

  it('should render when open', () => {
    renderWithProvider(
      <ModelConfigDialog
        apiKey={mockApiKey}
        isOpen={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    renderWithProvider(
      <ModelConfigDialog
        apiKey={mockApiKey}
        isOpen={false}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should display API key name in dialog', () => {
    renderWithProvider(
      <ModelConfigDialog
        apiKey={mockApiKey}
        isOpen={true}
        onOpenChange={vi.fn()}
      />
    )

    expect(screen.getByText('Test API Key')).toBeInTheDocument()
  })
})