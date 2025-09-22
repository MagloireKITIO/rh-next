import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter automatiquement le token JWT aux requêtes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("❌ [API CLIENT] Request error:", error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Distinguer les vraies erreurs 401 des erreurs réseau
    if (error.response?.status === 401) {
      // Vérifier si c'est une vraie erreur d'authentification
      const isAuthError = error.response?.data?.message?.includes('token') ||
                         error.response?.data?.message?.includes('auth') ||
                         error.response?.data?.message?.includes('unauthorized') ||
                         error.config?.url?.includes('/auth/');

      if (isAuthError) {
        console.log('🔓 [AUTH] Token invalide, déconnexion');
        localStorage.removeItem('token');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      } else {
        console.warn('⚠️ [API] Erreur 401 non-auth, pas de déconnexion');
      }
    }

    // Pour les erreurs réseau (pas de response), ne pas déconnecter
    if (!error.response) {
      console.warn('🌐 [NETWORK] Erreur réseau - backend indisponible');
    }

    return Promise.reject(error);
  }
);

// Types
export interface Project {
  id: string;
  name: string;
  jobDescription: string;
  customPrompt?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  offerDescription?: string;
  offerDocumentUrl?: string;
  offerDocumentFileName?: string;
  candidates: Candidate[];
  createdAt: string;
  updatedAt: string;
}

export enum CandidateSource {
  IMPORT = 'import',
  APPLICATION = 'application'
}

export interface Candidate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  extractedText: string;
  fileName: string;
  fileUrl: string;
  extractedData?: any;
  score: number;
  previousScore?: number;
  status: string;
  source: CandidateSource;
  summary?: string;
  ranking: number;
  projectId: string;
  analyses?: Analysis[];
  pipelineStatus?: {
    id: string;
    movedAt: string;
    notes?: string;
    movedBy: string;
    currentStageId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Analysis {
  id: string;
  aiResponse: string;
  analysisData: any;
  score: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  projectId: string;
  candidateId: string;
  createdAt: string;
}

export interface Configuration {
  id: string;
  key: string;
  value: string;
  description?: string;
  isActive: boolean;
}

export interface ProjectStats {
  totalCandidates: number;
  analyzedCandidates: number;
  pendingAnalysis: number;
  averageScore: number;
  topCandidates: Array<{
    id: string;
    name: string;
    score: number;
    summary: string;
  }>;
}

export interface RankingChange {
  id: string;
  name: string;
  currentScore: number;
  previousScore: number;
  scoreDiff: number;
  trend: 'up' | 'down' | 'stable';
  ranking: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  scoreFilter?: 'all' | 'excellent' | 'good' | 'average' | 'poor';
}

// Pipeline Types
export interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
  isDefault: boolean;
  isActive: boolean;
  pipelineId: string;
  candidatesCount?: number;
  candidates?: CandidateWithPipelineStatus[];
  createdAt: string;
  updatedAt: string;
}

export interface RecruitmentPipeline {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  projectId: string;
  stages: PipelineStage[];
  createdAt: string;
  updatedAt: string;
}

export interface CandidatePipelineStatus {
  id: string;
  candidateId: string;
  pipelineId: string;
  currentStageId: string;
  previousStageId?: string;
  movedBy: string;
  notes?: string;
  movedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateWithPipelineStatus extends Candidate {
  pipelineStatus?: {
    id: string;
    movedAt: string;
    notes?: string;
    movedBy: string;
    currentStageId?: string;
  };
}

export interface PipelineStats {
  pipeline: {
    id: string;
    name: string;
  };
  stages: Array<{
    stageId: string;
    stageName: string;
    candidatesCount: number;
    averageDays: number;
  }>;
  conversionRates: Array<{
    fromStage: string;
    toStage: string;
    rate: number;
  }>;
  totalCandidates: number;
}

export interface TimelineEvent {
  id: string;
  type: 'pipeline_event' | 'candidate_movement';
  eventType: 'CANDIDATE_MOVED' | 'CANDIDATE_ADDED' | 'CANDIDATE_REMOVED' | 'CANDIDATE_ANALYZED' | 'EMAIL_SENT' | 'NOTE_ADDED' | 'STAGE_CREATED' | 'STAGE_UPDATED' | 'STAGE_DELETED';
  projectId: string;
  candidateId?: string;
  candidateName?: string;
  userId: string;
  userName?: string;
  eventData?: {
    fromStage?: string;
    toStage?: string;
    fromStageColor?: string;
    toStageColor?: string;
    stageName?: string;
    stageColor?: string;
    emailSubject?: string;
    noteContent?: string;
    analysisScore?: number;
    [key: string]: any;
  };
  description?: string;
  createdAt: string;
}

export interface TimelineResponse {
  events: TimelineEvent[];
  total: number;
  hasMore: boolean;
}

// Interviews Types
export interface Interview {
  id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  type: 'video_call' | 'phone' | 'in_person';
  meeting_link?: string;
  meeting_id?: string;
  location?: string;
  notes?: string;
  agenda?: string;
  evaluation_criteria?: Record<string, any>;
  calendar_invites_sent: boolean;
  reminder_sent: boolean;
  candidate_id: string;
  project_id: string;
  created_by: string;
  candidate?: Candidate;
  project?: Project;
  participants?: InterviewParticipant[];
  evaluations?: InterviewEvaluation[];
  created_at: string;
  updated_at: string;
}

export interface InterviewParticipant {
  id: string;
  role: 'interviewer' | 'observer' | 'coordinator';
  status: 'invited' | 'accepted' | 'declined' | 'tentative';
  is_required: boolean;
  notes?: string;
  calendar_invite_sent: boolean;
  interview_id: string;
  user_id: string;
  user?: any; // User type
  created_at: string;
  updated_at: string;
}

export interface InterviewEvaluation {
  id: string;
  criteria_scores?: Record<string, number>;
  overall_score?: number;
  strengths?: string;
  weaknesses?: string;
  comments?: string;
  notes?: string;
  recommendation?: 'hire' | 'strong_hire' | 'no_hire' | 'strong_no_hire' | 'neutral';
  confidence_level?: number;
  additional_data?: Record<string, any>;
  is_completed: boolean;
  interview_id: string;
  evaluator_id: string;
  evaluator?: any; // User type
  created_at: string;
  updated_at: string;
}

export interface CreateInterviewData {
  title: string;
  description?: string;
  scheduled_at: Date;
  duration_minutes?: number;
  type: 'video_call' | 'phone' | 'in_person';
  meeting_link?: string;
  location?: string;
  notes?: string;
  agenda?: string;
  evaluation_criteria?: Record<string, any>;
  candidate_id: string;
  project_id: string;
  participants?: Array<{
    user_id: string;
    role: 'interviewer' | 'observer' | 'coordinator';
    is_required?: boolean;
    notes?: string;
  }>;
}

export interface UpdateInterviewData {
  title?: string;
  description?: string;
  scheduled_at?: Date;
  duration_minutes?: number;
  type?: 'video_call' | 'phone' | 'in_person';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  meeting_link?: string;
  location?: string;
  notes?: string;
  agenda?: string;
  started_at?: Date;
  ended_at?: Date;
}

export interface CreateEvaluationData {
  interview_id: string;
  criteria_scores?: Record<string, number>;
  overall_score?: number;
  strengths?: string;
  weaknesses?: string;
  comments?: string;
  notes?: string;
  recommendation?: 'hire' | 'strong_hire' | 'no_hire' | 'strong_no_hire' | 'neutral';
  confidence_level?: number;
  additional_data?: Record<string, any>;
  is_completed?: boolean;
}

// API Functions
export const projectsApi = {
  getAll: () => apiClient.get<Project[]>('/projects'),
  getById: (id: string) => apiClient.get<Project>(`/projects/${id}`),
  getStats: (id: string) => apiClient.get<ProjectStats>(`/projects/${id}/stats`),
  create: (data: { name: string; jobDescription: string; customPrompt?: string }) =>
    apiClient.post<Project>('/projects', data),
  update: (id: string, data: Partial<Project>) =>
    apiClient.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
  uploadOfferDocument: (id: string, formData: FormData) =>
    apiClient.post(`/projects/${id}/offer-document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  uploadOfferImage: (id: string, formData: FormData) =>
    apiClient.post(`/projects/${id}/offer-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export const candidatesApi = {
  getAll: (params?: PaginationParams) => {
    const query = params ? `?page=${params.page || 1}&limit=${params.limit || 50}` : '';
    return apiClient.get<PaginatedResponse<Candidate>>(`/candidates${query}`);
  },
  getByProject: (projectId: string, params?: PaginationParams) => {
    const queryParams = new URLSearchParams();
    queryParams.append('projectId', projectId);
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.scoreFilter) queryParams.append('scoreFilter', params.scoreFilter);
    }
    
    return apiClient.get<PaginatedResponse<Candidate>>(`/candidates?${queryParams.toString()}`);
  },
  getById: (id: string) => apiClient.get<Candidate>(`/candidates/${id}`),
  getCandidateInProject: (projectId: string, candidateId: string) => apiClient.get<Candidate>(`/candidates/project/${projectId}/candidate/${candidateId}`),
  uploadCVs: (projectId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return apiClient.post(`/candidates/upload/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  analyze: (id: string) => apiClient.post(`/candidates/${id}/analyze`),
  getRankingChanges: (projectId: string) => apiClient.get<RankingChange[]>(`/candidates/project/${projectId}/rankings`),
  getQueueStatus: (projectId: string) => apiClient.get(`/candidates/project/${projectId}/queue-status`),
  sendEmail: (candidateId: string, emailData: {
    to: string;
    subject: string;
    message: string;
    attachments?: File[];
  }) => {
    const formData = new FormData();
    formData.append('to', emailData.to);
    formData.append('subject', emailData.subject);
    formData.append('message', emailData.message);

    // Ajouter les fichiers à FormData
    if (emailData.attachments) {
      emailData.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    return apiClient.post(`/candidates/${candidateId}/send-email`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getEmailHistory: (candidateId: string) => apiClient.get(`/candidates/${candidateId}/email-history`),
  removeFromPipeline: (candidateId: string) => apiClient.delete(`/pipeline/candidates/${candidateId}/from-pipeline`),
  delete: (id: string) => apiClient.delete(`/candidates/${id}`),
};

export const analysisApi = {
  getAll: () => apiClient.get<Analysis[]>('/analysis'),
  getByProject: (projectId: string) => apiClient.get<Analysis[]>(`/analysis?projectId=${projectId}`),
  getById: (id: string) => apiClient.get<Analysis>(`/analysis/${id}`),
  generateReport: (projectId: string) => apiClient.get(`/analysis/report/${projectId}`),
  delete: (id: string) => apiClient.delete(`/analysis/${id}`),
};

export const configurationApi = {
  getAll: () => apiClient.get<Configuration[]>('/configuration'),
  getAIConfig: () => apiClient.get('/configuration/ai'),
  getByKey: (key: string) => apiClient.get<Configuration>(`/configuration/key/${key}`),
  setValue: (key: string, value: string, description?: string) =>
    apiClient.post('/configuration/set', { key, value, description }),
  initializeDefaults: () => apiClient.post('/configuration/initialize'),
  update: (id: string, data: Partial<Configuration>) =>
    apiClient.patch<Configuration>(`/configuration/${id}`, data),
  delete: (id: string) => apiClient.delete(`/configuration/${id}`),
};

export const apiKeysApi = {
  getAll: () => apiClient.get('/api-keys'),
  create: (data: { key: string; name?: string; provider?: string }) => 
    apiClient.post('/api-keys', data),
  update: (id: string, data: { name?: string; provider?: string }) =>
    apiClient.patch(`/api-keys/${id}`, data),
  toggle: (id: string) => apiClient.post(`/api-keys/${id}/toggle`),
  delete: (id: string) => apiClient.delete(`/api-keys/${id}`),
  getStats: () => apiClient.get('/api-keys/stats'),
};

export const teamRequestsApi = {
  getAll: () => apiClient.get('/team-requests'),
  getNotificationsCount: () => apiClient.get<{ count: number }>('/team-requests/notifications-count'),
  approve: (id: string) => apiClient.patch(`/team-requests/${id}`, { status: 'approved' }),
  reject: (id: string, reason?: string) => 
    apiClient.patch(`/team-requests/${id}`, { status: 'rejected', rejection_reason: reason }),
  delete: (id: string) => apiClient.delete(`/team-requests/${id}`),
};

export const companiesApi = {
  getUsers: (params?: PaginationParams) => {
    const query = params ? `?page=${params.page || 1}&limit=${params.limit || 50}` : '';
    return apiClient.get<PaginatedResponse<any>>(`/companies/current/users${query}`);
  },
  inviteUser: (data: { email: string; name: string; role: string }) =>
    apiClient.post('/companies/current/invite', data),
  updateUserRole: (userId: string, role: string) =>
    apiClient.patch(`/companies/current/users/${userId}/role`, { role }),
  activateUser: (userId: string) =>
    apiClient.patch(`/companies/current/users/${userId}/activate`),
  deactivateUser: (userId: string) =>
    apiClient.patch(`/companies/current/users/${userId}/deactivate`),
  resendInvitation: (userId: string) =>
    apiClient.post(`/companies/current/users/${userId}/resend-invitation`),
  deleteUser: (userId: string) =>
    apiClient.delete(`/companies/current/users/${userId}`),
};

// Auth API Functions
export const authApi = {
  signin: (email: string, password: string) =>
    apiClient.post<{ access_token: string; user: any }>('/auth/signin', { email, password }),
  acceptInvitation: (invitation_token: string, password: string) =>
    apiClient.post<{ access_token: string; user: any }>('/auth/accept-invitation', { invitation_token, password }),
  getProfile: () => apiClient.get<any>('/auth/profile'),
  updateProfile: (data: { name: string; email: string }) =>
    apiClient.put<{ user: any }>('/auth/profile', data),
  googleAuth: (code: string) =>
    apiClient.post<{ access_token: string; user: any }>('/auth/google', { code }),
  completeCompanyGoogle: (data: any) =>
    apiClient.post<{ access_token: string; user: any }>('/auth/complete-company-google', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/auth/change-password', data),
  uploadAvatar: (formData: FormData) =>
    apiClient.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deleteAccount: () => apiClient.delete('/auth/delete-account'),
  markOnboarded: () => apiClient.post('/auth/mark-onboarded'),
};


// Public API Functions (no auth required)
// Pipeline API Functions
export const pipelineApi = {
  getByProject: (projectId: string) =>
    apiClient.get<RecruitmentPipeline[]>(`/pipeline/project/${projectId}`),

  getById: (id: string) =>
    apiClient.get<RecruitmentPipeline>(`/pipeline/${id}`),

  getWithCandidates: (id: string) =>
    apiClient.get<RecruitmentPipeline>(`/pipeline/${id}/with-candidates`),

  getStats: (id: string) =>
    apiClient.get<PipelineStats>(`/pipeline/${id}/stats`),

  create: (projectId: string, data: {
    name: string;
    description?: string;
    stages?: Array<{ name: string; description?: string; color?: string }>
  }) =>
    apiClient.post<RecruitmentPipeline>(`/pipeline/project/${projectId}`, data),

  update: (id: string, data: { name?: string; description?: string }) =>
    apiClient.patch<RecruitmentPipeline>(`/pipeline/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/pipeline/${id}`),

  addStage: (pipelineId: string, data: { name: string; description?: string; color?: string }) =>
    apiClient.post<PipelineStage>(`/pipeline/${pipelineId}/stages`, data),

  updateStage: (stageId: string, data: { name?: string; description?: string; color?: string }) =>
    apiClient.patch<PipelineStage>(`/pipeline/stages/${stageId}`, data),

  deleteStage: (stageId: string) =>
    apiClient.delete(`/pipeline/stages/${stageId}`),

  moveCandidate: (data: { candidateId: string; stageId: string; notes?: string }) =>
    apiClient.post<CandidatePipelineStatus>('/pipeline/move-candidate', data),

  reorderStages: (pipelineId: string, stageOrders: Array<{ stageId: string; order: number }>) =>
    apiClient.post<PipelineStage[]>(`/pipeline/${pipelineId}/stages/reorder`, stageOrders),

  getProjectTimeline: (projectId: string) =>
    apiClient.get<TimelineResponse>(`/pipeline/project/${projectId}/timeline`),
};

// Interviews API Functions
export const interviewsApi = {
  getAll: () =>
    apiClient.get<Interview[]>('/interviews'),

  getByProject: (projectId: string) =>
    apiClient.get<Interview[]>(`/interviews/project/${projectId}`),

  getByCandidate: (candidateId: string) =>
    apiClient.get<Interview[]>(`/interviews/candidate/${candidateId}`),

  getByUser: (userId: string) =>
    apiClient.get<Interview[]>(`/interviews/user/${userId}`),

  getByDateRange: (startDate: Date, endDate: Date) =>
    apiClient.get<Interview[]>(`/interviews/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),

  getById: (id: string) =>
    apiClient.get<Interview>(`/interviews/${id}`),

  create: (data: CreateInterviewData) =>
    apiClient.post<Interview>('/interviews', data),

  update: (id: string, data: UpdateInterviewData) =>
    apiClient.patch<Interview>(`/interviews/${id}`, data),

  updateStatus: (id: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled') =>
    apiClient.patch<Interview>(`/interviews/${id}/status`, { status }),

  delete: (id: string) =>
    apiClient.delete(`/interviews/${id}`),

  // Participants
  addParticipant: (interviewId: string, userId: string, role: 'interviewer' | 'observer' | 'coordinator') =>
    apiClient.post<InterviewParticipant>(`/interviews/${interviewId}/participants`, { userId, role }),

  updateParticipantStatus: (participantId: string, status: 'invited' | 'accepted' | 'declined' | 'tentative') =>
    apiClient.patch<InterviewParticipant>(`/interviews/participants/${participantId}/status`, { status }),

  removeParticipant: (participantId: string) =>
    apiClient.delete(`/interviews/participants/${participantId}`),

  // Evaluations
  createEvaluation: (data: CreateEvaluationData) =>
    apiClient.post<InterviewEvaluation>('/interviews/evaluations', data),

  getEvaluationsByInterview: (interviewId: string) =>
    apiClient.get<InterviewEvaluation[]>(`/interviews/${interviewId}/evaluations`),

  updateEvaluation: (evaluationId: string, data: Partial<CreateEvaluationData>) =>
    apiClient.patch<InterviewEvaluation>(`/interviews/evaluations/${evaluationId}`, data),

  deleteEvaluation: (evaluationId: string) =>
    apiClient.delete(`/interviews/evaluations/${evaluationId}`),

  // Utilities
  getAvailableTimeSlots: (date: Date, userIds: string[], duration: number = 60) =>
    apiClient.get(`/interviews/availability/${date.toISOString().split('T')[0]}?userIds=${userIds.join(',')}&duration=${duration}`),

  generateMeetingLink: (interviewId: string) =>
    apiClient.post<{ meetingLink: string }>(`/interviews/${interviewId}/meeting-link`),

  syncCalendar: () =>
    apiClient.post<{ synced: number; errors: number }>('/interviews/sync-calendar'),

  syncAttendeesStatus: (interviewId: string) =>
    apiClient.post(`/interviews/${interviewId}/sync-attendees`),

  sendReminder: (interviewId: string, minutesBefore?: number) =>
    apiClient.post(`/interviews/${interviewId}/send-reminder`, { minutesBefore }),

  getCalendarEvents: (startDate: string, endDate: string) =>
    apiClient.get<Array<{
      id: string;
      summary: string;
      start: { dateTime: string };
      end: { dateTime: string };
      attendees?: Array<{ email: string; displayName?: string }>;
      location?: string;
      isInterviewEvent: boolean;
    }>>(`/interviews/calendar-events?startDate=${startDate}&endDate=${endDate}`),

  getAvailableTimeSlots: (date: string, userIds: string[], duration: number) =>
    apiClient.get<Array<{
      start: Date;
      end: Date;
      available: boolean;
      conflicts: string[];
    }>>(`/interviews/availability/${date}?userIds=${userIds.join(',')}&duration=${duration}`),

  checkConflicts: (userId: string, startTime: string, endTime: string) =>
    apiClient.post<{
      hasConflicts: boolean;
      conflicts: Array<{ start: string; end: string; summary?: string }>;
    }>('/interviews/check-conflicts', { userId, startTime, endTime }),
};

export const publicApi = {
  getSharedProject: (token: string) =>
    apiClient.get(`/public/projects/shared/${token}`),

  getSharedProjectCandidates: (token: string, params?: PaginationParams) => {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.scoreFilter) queryParams.append('scoreFilter', params.scoreFilter);
    }

    return apiClient.get<PaginatedResponse<Candidate>>(`/public/projects/shared/${token}/candidates${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
  },

  getJobOffer: (id: string) =>
    apiClient.get(`/public/job-offers/${id}`),
  getAllJobOffers: () =>
    apiClient.get('/public/job-offers'),
  applyToJob: (id: string, formData: FormData) =>
    apiClient.post(`/public/job-offers/${id}/apply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getPrivacyPolicyInfo: () =>
    apiClient.get('/public/privacy-policy/info'),
  getPrivacyPolicy: () =>
    apiClient.get('/public/privacy-policy'),
  submitTeamRequest: (data: any) =>
    apiClient.post('/public/team-requests', data),
};