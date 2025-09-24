import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import ProjectPage from './page'

// Mock all dependencies
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

vi.mock('@/hooks/queries', () => ({
  useProject: vi.fn(),
  useProjectStats: vi.fn(),
  useCandidatesByProject: vi.fn(),
  useCandidatesByProjectLegacy: vi.fn(),
  useRankingChanges: vi.fn(),
  useAnalysesByProject: vi.fn(),
  usePipelinesByProject: vi.fn(),
}))

vi.mock('@/hooks/mutations', () => ({
  useUpdateProject: vi.fn(),
  useSyncCalendar: vi.fn(),
}))

vi.mock('@/hooks/mutations/useCandidateMutations', () => ({
  useRemoveCandidateFromPipeline: vi.fn(),
}))

vi.mock('@/hooks/useWebSocketSync', () => ({
  useWebSocketSync: vi.fn(),
}))

vi.mock('@/lib/api-client', () => ({
  projectsApi: {},
  apiClient: {},
  analysisApi: {},
}))

vi.mock('@/components/upload/cv-upload', () => ({
  CVUpload: () => <div data-testid="cv-upload">CV Upload Component</div>,
}))

vi.mock('@/components/ranking/candidate-ranking', () => ({
  CandidateRanking: () => <div data-testid="candidate-ranking">Candidate Ranking Component</div>,
  RankingStats: () => <div data-testid="ranking-stats">Ranking Stats Component</div>,
}))

vi.mock('@/components/project/project-settings', () => ({
  ProjectSettings: () => <div data-testid="project-settings">Project Settings Component</div>,
}))

vi.mock('@/components/pipeline', () => ({
  PipelineBoard: () => <div data-testid="pipeline-board">Pipeline Board Component</div>,
  ProjectTimeline: () => <div data-testid="project-timeline">Project Timeline Component</div>,
}))

vi.mock('@/components/interviews', () => ({
  InterviewsBoard: () => <div data-testid="interviews-board">Interviews Board Component</div>,
  InterviewsCalendar: () => <div data-testid="interviews-calendar">Interviews Calendar Component</div>,
  InterviewsStats: () => <div data-testid="interviews-stats">Interviews Stats Component</div>,
  InterviewsFilters: () => <div data-testid="interviews-filters">Interviews Filters Component</div>,
  ScheduleInterviewModal: () => <div data-testid="schedule-interview-modal">Schedule Interview Modal</div>,
  InterviewDetailsModal: () => <div data-testid="interview-details-modal">Interview Details Modal</div>,
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
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
  status: 'active',
  candidates: [],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

const mockProjectStats = {
  totalCandidates: 10,
  analyzedCandidates: 8,
  pendingAnalysis: 2,
  averageScore: 75,
  topCandidates: [],
}

const mockCandidates = [
  {
    id: 'candidate-1',
    name: 'John Doe',
    email: 'john@example.com',
    score: 85,
    ranking: 1,
    status: 'active',
    projectId: 'project-1',
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

describe('ProjectPage', () => {
  const mockPush = vi.fn()
  const mockReplace = vi.fn()
  const mockRouter = { push: mockPush, replace: mockReplace }
  const mockSearchParams = new URLSearchParams()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock navigation hooks
    vi.mocked(useParams).mockReturnValue({ id: 'project-1' })
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any)

    // Mock query hooks
    const mockQueries = require('@/hooks/queries')
    mockQueries.useProject.mockReturnValue({
      data: mockProject,
      isLoading: false,
      error: null,
    })
    mockQueries.useProjectStats.mockReturnValue({
      data: mockProjectStats,
      isLoading: false,
    })
    mockQueries.useCandidatesByProjectLegacy.mockReturnValue({
      data: mockCandidates,
      isLoading: false,
    })
    mockQueries.useRankingChanges.mockReturnValue({
      data: [],
    })
    mockQueries.useAnalysesByProject.mockReturnValue({
      data: [],
    })
    mockQueries.usePipelinesByProject.mockReturnValue({
      data: [],
    })

    // Mock mutation hooks
    const mockMutations = require('@/hooks/mutations')
    mockMutations.useUpdateProject.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })
    mockMutations.useSyncCalendar.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })

    const mockCandidateMutations = require('@/hooks/mutations/useCandidateMutations')
    mockCandidateMutations.useRemoveCandidateFromPipeline.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    })

    // Mock WebSocket hook
    const mockWebSocket = require('@/hooks/useWebSocketSync')
    mockWebSocket.useWebSocketSync.mockReturnValue({
      isConnected: true,
    })
  })

  it('should render project page with loading state', () => {
    const mockQueries = require('@/hooks/queries')
    mockQueries.useProject.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    })

    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should render project page with project data', async () => {
    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    expect(screen.getByText('Test job description')).toBeInTheDocument()
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('should handle tab navigation', async () => {
    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    // Click on candidates tab
    const candidatesTab = screen.getByRole('tab', { name: /candidats/i })
    fireEvent.click(candidatesTab)

    expect(mockReplace).toHaveBeenCalled()
  })

  it('should render overview tab content', async () => {
    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    // Overview should be the default tab
    expect(screen.getByTestId('candidate-ranking')).toBeInTheDocument()
    expect(screen.getByTestId('ranking-stats')).toBeInTheDocument()
  })

  it('should render candidates tab content', async () => {
    // Set initial tab to candidates
    mockSearchParams.set('tab', 'candidates')

    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    expect(screen.getByTestId('cv-upload')).toBeInTheDocument()
    expect(screen.getByTestId('candidate-ranking')).toBeInTheDocument()
  })

  it('should render pipeline tab content', async () => {
    // Set initial tab to pipeline
    mockSearchParams.set('tab', 'pipeline')

    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    expect(screen.getByTestId('pipeline-board')).toBeInTheDocument()
  })

  it('should render interviews tab content', async () => {
    // Set initial tab to interviews
    mockSearchParams.set('tab', 'interviews')

    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    expect(screen.getByTestId('interviews-board')).toBeInTheDocument()
  })

  it('should handle project error state', () => {
    const mockQueries = require('@/hooks/queries')
    mockQueries.useProject.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Project not found'),
    })

    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    expect(screen.getByText(/erreur/i)).toBeInTheDocument()
  })

  it('should handle back navigation', async () => {
    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    const backButton = screen.getByLabelText(/retour/i)
    fireEvent.click(backButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should display project stats', async () => {
    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    expect(screen.getByText('10')).toBeInTheDocument() // Total candidates
    expect(screen.getByText('75')).toBeInTheDocument() // Average score
  })

  it('should handle edit description mode', async () => {
    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    // Find and click edit button
    const editButton = screen.getByLabelText(/modifier/i)
    fireEvent.click(editButton)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should handle WebSocket connection status', async () => {
    const mockWebSocket = require('@/hooks/useWebSocketSync')
    mockWebSocket.useWebSocketSync.mockReturnValue({
      isConnected: false,
    })

    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    // Should show disconnected state indicator
    expect(screen.getByTestId('connection-status')).toBeInTheDocument()
  })

  it('should handle share functionality', async () => {
    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    const shareButton = screen.getByLabelText(/partager/i)
    fireEvent.click(shareButton)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should handle project settings', async () => {
    const wrapper = createWrapper()
    render(<ProjectPage />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    const settingsButton = screen.getByLabelText(/paramètres/i)
    fireEvent.click(settingsButton)

    expect(screen.getByTestId('project-settings')).toBeInTheDocument()
  })
})