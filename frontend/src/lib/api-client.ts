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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
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
  candidates: Candidate[];
  createdAt: string;
  updatedAt: string;
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
  summary?: string;
  ranking: number;
  projectId: string;
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
  companySignup: (data: {
    email: string;
    password: string;
    name: string;
    companyName: string;
    companyDomain: string;
  }) => apiClient.post('/auth/company-signup', data),
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

// Mail Automations API Functions
export const mailAutomationsApi = {
  getAll: () => apiClient.get('/mail-automations'),
  getById: (id: string) => apiClient.get(`/mail-automations/${id}`),
  getStats: () => apiClient.get('/mail-automations/stats'),
  create: (data: any) => apiClient.post('/mail-automations', data),
  update: (id: string, data: any) => apiClient.patch(`/mail-automations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/mail-automations/${id}`),
  toggleStatus: (id: string) => apiClient.patch(`/mail-automations/${id}/toggle-status`),
  getMailTemplates: () => apiClient.get('/mail-templates'),
};

// Mail Templates API Functions
export const mailTemplatesApi = {
  getAll: (companyId?: string, context?: string) => apiClient.get('/mail-templates', { params: { companyId, context } }),
  getById: (id: string) => apiClient.get(`/mail-templates/${id}`),
  getTypes: () => apiClient.get('/mail-templates/types'),
  getByType: (type: string, companyId?: string) => apiClient.get(`/mail-templates/by-type/${type}`, { params: { companyId } }),
  create: (data: any) => apiClient.post('/mail-templates', data),
  update: (id: string, data: any) => apiClient.patch(`/mail-templates/${id}`, data),
  delete: (id: string) => apiClient.delete(`/mail-templates/${id}`),
  duplicate: (id: string, name?: string) => apiClient.post(`/mail-templates/${id}/duplicate`, { name }),
  setAsDefault: (id: string) => apiClient.post(`/mail-templates/${id}/set-default`),
  preview: (id: string, variables: Record<string, any> = {}) => apiClient.post(`/mail-templates/${id}/preview`, { variables }),
};

// Public API Functions (no auth required)
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
  submitTeamRequest: (data: any) =>
    apiClient.post('/public/team-requests', data),
};