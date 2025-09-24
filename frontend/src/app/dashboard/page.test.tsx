import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Dashboard from './page'

// Mock all dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/hooks/queries', () => ({
  useProjects: vi.fn(),
}))

vi.mock('@/components/ui/navbar', () => ({
  NavBar: () => <nav data-testid="navbar">Navigation Bar</nav>,
}))

vi.mock('@/components/ui/sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}))

vi.mock('@/components/ui/animated-card', () => ({
  StatsCard: ({ title, value, icon, trend }: any) => (
    <div data-testid={`stats-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div>{title}</div>
      <div>{value}</div>
      {trend && <div data-testid="trend">{trend}</div>}
    </div>
  ),
  ProjectCard: ({ project, viewMode }: any) => (
    <div data-testid={`project-card-${project.id}`} data-view-mode={viewMode}>
      <div>{project.name}</div>
      <div>{project.jobDescription}</div>
    </div>
  ),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  },
}))

const mockProjects = [
  {
    id: 'project-1',
    name: 'Frontend Developer',
    jobDescription: 'React developer position',
    status: 'active',
    candidates: [
      { id: 'candidate-1', score: 85 },
      { id: 'candidate-2', score: 92 },
    ],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'project-2',
    name: 'Backend Developer',
    jobDescription: 'Node.js developer position',
    status: 'active',
    candidates: [
      { id: 'candidate-3', score: 78 },
    ],
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  },
]

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin' as const,
  company: {
    id: 'company-1',
    name: 'Test Company',
    domain: 'test.com',
  },
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

describe('Dashboard', () => {
  const mockPush = vi.fn()
  const mockRouter = { push: mockPush }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock navigation hooks
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)

    // Mock auth context
    const mockAuth = require('@/contexts/auth-context')
    mockAuth.useAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    })

    // Mock query hooks
    const mockQueries = require('@/hooks/queries')
    mockQueries.useProjects.mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    })
  })

  it('should render dashboard with user data', async () => {
    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
    })

    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('should redirect to login when user is not authenticated', () => {
    const mockAuth = require('@/contexts/auth-context')
    mockAuth.useAuth.mockReturnValue({
      user: null,
      loading: false,
    })

    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('should not redirect when loading user data', () => {
    const mockAuth = require('@/contexts/auth-context')
    mockAuth.useAuth.mockReturnValue({
      user: null,
      loading: true,
    })

    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should render loading state when projects are loading', () => {
    const mockQueries = require('@/hooks/queries')
    mockQueries.useProjects.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    })

    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should render error state when projects fail to load', () => {
    const mockQueries = require('@/hooks/queries')
    mockQueries.useProjects.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Failed to fetch projects'),
    })

    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    expect(screen.getByText(/erreur/i)).toBeInTheDocument()
  })

  it('should render projects in list view by default', async () => {
    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('project-card-project-1')).toHaveAttribute('data-view-mode', 'list')
    })

    expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
    expect(screen.getByTestId('project-card-project-2')).toBeInTheDocument()
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(screen.getByText('Backend Developer')).toBeInTheDocument()
  })

  it('should switch to cards view mode', async () => {
    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
    })

    // Click cards view button
    const cardsViewButton = screen.getByLabelText(/vue grille/i)
    fireEvent.click(cardsViewButton)

    await waitFor(() => {
      expect(screen.getByTestId('project-card-project-1')).toHaveAttribute('data-view-mode', 'cards')
    })
  })

  it('should display correct statistics', async () => {
    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('stats-card-projets')).toBeInTheDocument()
    })

    expect(screen.getByTestId('stats-card-projets')).toHaveTextContent('2')
    expect(screen.getByTestId('stats-card-candidats')).toHaveTextContent('3')

    // Average score should be calculated: (85 + 92 + 78) / 3 = 85
    expect(screen.getByTestId('stats-card-score-moyen')).toHaveTextContent('85')
  })

  it('should navigate to create project page', async () => {
    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('Nouveau projet')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Nouveau projet')
    fireEvent.click(createButton)

    expect(mockPush).toHaveBeenCalledWith('/projects/create')
  })

  it('should navigate to project page when project card is clicked', async () => {
    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
    })

    const projectCard = screen.getByTestId('project-card-project-1')
    fireEvent.click(projectCard)

    expect(mockPush).toHaveBeenCalledWith('/projects/project-1')
  })

  it('should render empty state when no projects exist', async () => {
    const mockQueries = require('@/hooks/queries')
    mockQueries.useProjects.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(/aucun projet/i)).toBeInTheDocument()
    })

    expect(screen.getByText('Créer votre premier projet')).toBeInTheDocument()
  })

  it('should display welcome message with user name', async () => {
    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText(/bonjour.*test user/i)).toBeInTheDocument()
    })
  })

  it('should handle view mode toggle correctly', async () => {
    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('project-card-project-1')).toBeInTheDocument()
    })

    // Should start in list view
    expect(screen.getByTestId('project-card-project-1')).toHaveAttribute('data-view-mode', 'list')

    // Toggle to cards view
    const cardsViewButton = screen.getByLabelText(/vue grille/i)
    fireEvent.click(cardsViewButton)

    await waitFor(() => {
      expect(screen.getByTestId('project-card-project-1')).toHaveAttribute('data-view-mode', 'cards')
    })

    // Toggle back to list view
    const listViewButton = screen.getByLabelText(/vue liste/i)
    fireEvent.click(listViewButton)

    await waitFor(() => {
      expect(screen.getByTestId('project-card-project-1')).toHaveAttribute('data-view-mode', 'list')
    })
  })

  it('should calculate statistics correctly with no candidates', async () => {
    const projectsWithoutCandidates = [
      {
        ...mockProjects[0],
        candidates: [],
      },
    ]

    const mockQueries = require('@/hooks/queries')
    mockQueries.useProjects.mockReturnValue({
      data: projectsWithoutCandidates,
      isLoading: false,
      error: null,
    })

    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('stats-card-projets')).toHaveTextContent('1')
    })

    expect(screen.getByTestId('stats-card-candidats')).toHaveTextContent('0')
    expect(screen.getByTestId('stats-card-score-moyen')).toHaveTextContent('0')
  })

  it('should show activity indicator when there are recent projects', async () => {
    const wrapper = createWrapper()
    render(<Dashboard />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('stats-card-activité-récente')).toBeInTheDocument()
    })

    // Should show the count of projects (recent activity)
    expect(screen.getByTestId('stats-card-activité-récente')).toHaveTextContent('2')
  })
})