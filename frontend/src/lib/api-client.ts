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
    console.log("🔑 [API CLIENT] Making request to:", config.method?.toUpperCase(), config.url);
    
    const token = localStorage.getItem('token');
    if (token) {
      console.log("🔑 [API CLIENT] Token found, adding to headers");
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log("❌ [API CLIENT] No token found in localStorage");
    }
    
    console.log("🔑 [API CLIENT] Final headers:", config.headers);
    return config;
  },
  (error) => {
    console.error("❌ [API CLIENT] Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
apiClient.interceptors.response.use(
  (response) => {
    console.log("✅ [API CLIENT] Response received:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ [API CLIENT] Response error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      console.log("🚪 [API CLIENT] 401 Unauthorized - removing token and redirecting to login");
      // Token expiré ou invalide, rediriger vers la page de connexion
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
};

export const candidatesApi = {
  getAll: () => apiClient.get<Candidate[]>('/candidates'),
  getByProject: (projectId: string) => apiClient.get<Candidate[]>(`/candidates?projectId=${projectId}`),
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