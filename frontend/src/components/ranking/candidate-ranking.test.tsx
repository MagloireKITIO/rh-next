import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CandidateRanking } from './candidate-ranking'

// Mock all dependencies
vi.mock('@/hooks/queries', () => ({
  useCandidatesByProject: vi.fn(),
  useCandidatesByProjectLegacy: vi.fn(),
  useRankingChanges: vi.fn(),
  useCandidatesWithSearch: vi.fn(),
}))

vi.mock('@/hooks/mutations', () => ({
  useDeleteCandidate: vi.fn(),
}))

vi.mock('@/hooks/useWebSocketSync', () => ({
  useWebSocketSync: vi.fn(),
}))

vi.mock('@/lib/api-client', () => ({
  candidatesApi: {
    sendEmail: vi.fn(),
  },
}))

vi.mock('@/components/ui/score-indicator', () => ({
  ScoreIndicator: ({ score }: any) => <div data-testid="score-indicator">{score}</div>,
  RankingBadge: ({ ranking }: any) => <div data-testid="ranking-badge">#{ranking}</div>,
}))

vi.mock('@/components/ui/candidate-source-badge', () => ({
  CandidateSourceBadge: ({ source }: any) => <div data-testid="source-badge">{source}</div>,
}))

vi.mock('@/components/candidate/send-email-modal', () => ({
  SendEmailModal: ({ isOpen, onClose, candidate, onSend }: any) =>
    isOpen ? (
      <div data-testid="send-email-modal">
        <div>Send email to {candidate?.name}</div>
        <button onClick={() => onSend({ to: 'test@example.com', subject: 'Test', message: 'Test message' })}>
          Send
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

vi.mock('@/components/pipeline/move-candidates-dialog', () => ({
  MoveCandidatesDialog: ({ isOpen, onClose, onMove }: any) =>
    isOpen ? (
      <div data-testid="move-candidates-dialog">
        <button onClick={() => onMove(['candidate-1'], 'stage-1')}>Move</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockCandidates = [
  {
    id: 'candidate-1',
    name: 'John Doe',
    email: 'john@example.com',
    score: 85,
    ranking: 1,
    status: 'active',
    source: 'import',
    projectId: 'project-1',
    fileName: 'john_doe_cv.pdf',
    fileUrl: 'https://example.com/cv.pdf',
    extractedText: 'Software engineer with 5 years experience',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'candidate-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    score: 92,
    ranking: 2,
    status: 'active',
    source: 'application',
    projectId: 'project-1',
    fileName: 'jane_smith_cv.pdf',
    fileUrl: 'https://example.com/cv2.pdf',
    extractedText: 'Senior developer with React expertise',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  },
]

const mockRankingChanges = [
  {
    id: 'candidate-1',
    name: 'John Doe',
    currentScore: 85,
    previousScore: 80,
    scoreDiff: 5,
    trend: 'up' as const,
    ranking: 1,
  },
]

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

describe('CandidateRanking', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock query hooks
    const mockQueries = require('@/hooks/queries')
    mockQueries.useCandidatesByProjectLegacy.mockReturnValue({
      data: mockCandidates,
      isLoading: false,
    })
    mockQueries.useCandidatesByProject.mockReturnValue({
      data: {
        data: mockCandidates,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
      isLoading: false,
    })
    mockQueries.useRankingChanges.mockReturnValue({
      data: mockRankingChanges,
    })
    mockQueries.useCandidatesWithSearch.mockReturnValue({
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
      isLoading: false,
    })

    // Mock mutation hooks
    const mockMutations = require('@/hooks/mutations')
    mockMutations.useDeleteCandidate.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })

    // Mock WebSocket hook
    const mockWebSocket = require('@/hooks/useWebSocketSync')
    mockWebSocket.useWebSocketSync.mockReturnValue({
      isConnected: true,
    })
  })

  it('should render candidate ranking with candidates', async () => {
    const wrapper = createWrapper()
    render(
      <CandidateRanking projectId="project-1" />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getAllByTestId('score-indicator')).toHaveLength(2)
    expect(screen.getAllByTestId('ranking-badge')).toHaveLength(2)
  })

  it('should render loading state when data is loading', () => {
    const mockQueries = require('@/hooks/queries')
    mockQueries.useCandidatesByProjectLegacy.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    const wrapper = createWrapper()
    render(
      <CandidateRanking projectId="project-1" />,
      { wrapper }
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should render empty state when no candidates exist', async () => {
    const mockQueries = require('@/hooks/queries')
    mockQueries.useCandidatesByProjectLegacy.mockReturnValue({
      data: [],
      isLoading: false,
    })

    const wrapper = createWrapper()
    render(
      <CandidateRanking projectId="project-1" />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText(/aucun candidat/i)).toBeInTheDocument()
    })
  })

  it('should handle candidate selection', async () => {
    const wrapper = createWrapper()
    render(
      <CandidateRanking projectId="project-1" />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Select first candidate
    const checkbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(checkbox)

    expect(checkbox).toBeChecked()
  })

  it('should handle search functionality', async () => {
    const wrapper = createWrapper()
    render(
      <CandidateRanking projectId="project-1" />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/rechercher/i)
    fireEvent.change(searchInput, { target: { value: 'john' } })

    expect(searchInput).toHaveValue('john')
  })

  it('should handle status filter', async () => {
    const wrapper = createWrapper()
    render(
      <CandidateRanking projectId="project-1" />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Open filters
    const filterButton = screen.getByLabelText(/filtres/i)
    fireEvent.click(filterButton)

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('should handle score filter', async () => {
    const wrapper = createWrapper()
    render(
      <CandidateRanking projectId="project-1" />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Open filters
    const filterButton = screen.getByLabelText(/filtres/i)
    fireEvent.click(filterButton)

    // Score filter should be available
    expect(screen.getByText(/excellent/i)).toBeInTheDocument()
  })

  it('should handle candidate deletion', async () => {
    const mockDeleteMutation = vi.fn()
    const mockMutations = require('@/hooks/mutations')
    mockMutations.useDeleteCandidate.mockReturnValue({
      mutateAsync: mockDeleteMutation,
      isPending: false,
    })

    const wrapper = createWrapper()
    render(
      <CandidateRanking projectId="project-1" />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Select candidate and delete
    const checkbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(checkbox)

    const deleteButton = screen.getByLabelText(/supprimer/i)
    fireEvent.click(deleteButton)

    // Confirm deletion
    const confirmButton = screen.getByText(/confirmer/i)
    fireEvent.click(confirmButton)

    expect(mockDeleteMutation).toHaveBeenCalledWith('candidate-1')
  })

  it('should handle email sending', async () => {
    const wrapper = createWrapper()
    render(
      <CandidateRanking projectId="project-1" />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click email button for first candidate
    const emailButton = screen.getAllByLabelText(/envoyer.*email/i)[0]
    fireEvent.click(emailButton)

    expect(screen.getByTestId('send-email-modal')).toBeInTheDocument()

    // Send email
    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    const mockSendEmail = require('@/lib/api-client').candidatesApi.sendEmail
    expect(mockSendEmail).toHaveBeenCalled()
  })

  it('should handle candidate movement to pipeline', async () => {
    const wrapper = createWrapper()
    render(
      <CandidateRanking projectId="project-1" />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Select candidates and move
    const checkbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(checkbox)

    const moveButton = screen.getByLabelText(/déplacer/i)
    fireEvent.click(moveButton)

    expect(screen.getByTestId('move-candidates-dialog')).toBeInTheDocument()

    // Confirm move
    const confirmMoveButton = screen.getByText('Move')
    fireEvent.click(confirmMoveButton)

    // Should close the dialog
    expect(screen.queryByTestId('move-candidates-dialog')).not.toBeInTheDocument()
  })

  it('should handle pagination when enabled', async () => {
    const wrapper = createWrapper()
    render(
      <CandidateRanking
        projectId="project-1"
        enablePagination={true}
        pageSize={10}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Should show pagination component
    expect(screen.getByTestId('pagination')).toBeInTheDocument()
  })

  it('should handle WebSocket connection status', async () => {
    const mockWebSocket = require('@/hooks/useWebSocketSync')
    mockWebSocket.useWebSocketSync.mockReturnValue({
      isConnected: false,
    })

    const wrapper = createWrapper()
    render(
      <CandidateRanking projectId="project-1" />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Should show disconnected indicator
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Déconnecté')
  })

  it('should handle ranking changes display', async () => {
    const wrapper = createWrapper()
    render(
      <CandidateRanking projectId="project-1" />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Should show ranking change indicator
    expect(screen.getByTestId('trend-up')).toBeInTheDocument()
  })

  it('should handle auto-refresh functionality', async () => {
    vi.useFakeTimers()

    const wrapper = createWrapper()
    render(
      <CandidateRanking
        projectId="project-1"
        autoRefresh={true}
        refreshInterval={5000}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Fast-forward time to trigger refresh
    vi.advanceTimersByTime(5000)

    // Should have made additional queries
    const mockQueries = require('@/hooks/queries')
    expect(mockQueries.useCandidatesByProjectLegacy).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('should handle candidate view action', async () => {
    const mockOnViewCandidate = vi.fn()

    const wrapper = createWrapper()
    render(
      <CandidateRanking
        projectId="project-1"
        onViewCandidate={mockOnViewCandidate}
      />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click view button
    const viewButton = screen.getAllByLabelText(/voir.*détails/i)[0]
    fireEvent.click(viewButton)

    expect(mockOnViewCandidate).toHaveBeenCalledWith(mockCandidates[0])
  })

  it('should clear search when clear button is clicked', async () => {
    const wrapper = createWrapper()
    render(
      <CandidateRanking projectId="project-1" />,
      { wrapper }
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/rechercher/i)
    fireEvent.change(searchInput, { target: { value: 'john' } })

    expect(searchInput).toHaveValue('john')

    // Clear search
    const clearButton = screen.getByLabelText(/effacer/i)
    fireEvent.click(clearButton)

    expect(searchInput).toHaveValue('')
  })
})