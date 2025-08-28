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
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("❌ [ADMIN API CLIENT] Request error:", error);
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
      localStorage.removeItem('admin_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Admin Types
export interface Company {
  id: string;
  name: string;
  domain: string;
  logo_url?: string;
  description?: string;
  is_active: boolean;
  settings?: any;
  users?: User[];
  projects?: Project[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'hr' | 'user';
  avatar_url?: string;
  is_active: boolean;
  is_invited: boolean;
  is_onboarded: boolean;
  email_verified: boolean;
  company_id?: string;
  company?: Company;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  jobDescription: string;
  customPrompt?: string;
  status: string;
  company_id: string;
  company?: Company;
  created_by: string;
  createdBy?: User;
  candidates?: Candidate[];
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

export interface GlobalStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalCandidates: number;
  totalAnalyses: number;
  averageScoreGlobal: number;
  companiesGrowth: number;
  usersGrowth: number;
  projectsGrowth: number;
}

export interface CompanyStats {
  id: string;
  name: string;
  domain: string;
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalCandidates: number;
  averageScore: number;
  lastActivity: string;
}

export interface ApiKey {
  id: string;
  name?: string;
  isActive: boolean;
  requestCount: number;
  lastUsedAt?: string;
  provider: string;
  company_id?: string;
  company?: Company;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyStats {
  totalKeys: number;
  activeKeys: number;
  inactiveKeys: number;
  totalRequests: number;
  keysByCompany: {
    companyName: string;
    companyId: string;
    keyCount: number;
    totalRequests: number;
  }[];
}

// Admin API Functions
export const adminApi = {
  // Dashboard & Stats
  getGlobalStats: () => apiClient.get<GlobalStats>('/admin/stats'),
  getCompaniesStats: () => apiClient.get<CompanyStats[]>('/admin/companies/stats'),
  
  // Companies Management
  getAllCompanies: () => apiClient.get<Company[]>('/admin/companies'),
  getCompanyById: (id: string) => apiClient.get<Company>(`/admin/companies/${id}`),
  createCompany: (data: { name: string; domain: string; description?: string }) =>
    apiClient.post<Company>('/admin/companies', data),
  updateCompany: (id: string, data: Partial<Company>) =>
    apiClient.patch<Company>(`/admin/companies/${id}`, data),
  deleteCompany: (id: string) => apiClient.delete(`/admin/companies/${id}`),
  toggleCompanyStatus: (id: string) => apiClient.patch(`/admin/companies/${id}/toggle`),
  
  // Users Management
  getAllUsers: () => apiClient.get<User[]>('/admin/users'),
  getUsersByCompany: (companyId: string) => apiClient.get<User[]>(`/admin/users/company/${companyId}`),
  getUserById: (id: string) => apiClient.get<User>(`/admin/users/${id}`),
  createUser: (data: { 
    email: string; 
    name: string; 
    role: string;
    company_id?: string;
  }) => apiClient.post<User>('/admin/users', data),
  updateUser: (id: string, data: Partial<User>) =>
    apiClient.patch<User>(`/admin/users/${id}`, data),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
  toggleUserStatus: (id: string) => apiClient.patch(`/admin/users/${id}/toggle`),
  resendUserInvitation: (id: string) => apiClient.post(`/admin/users/${id}/resend-invitation`),
  
  // Projects Management (Global view)
  getAllProjects: () => apiClient.get<Project[]>('/admin/projects'),
  getProjectsByCompany: (companyId: string) => apiClient.get<Project[]>(`/admin/projects/company/${companyId}`),
  
  // API Keys Management
  getAllApiKeys: () => apiClient.get<ApiKey[]>('/admin/api-keys'),
  getApiKeysStats: () => apiClient.get<ApiKeyStats>('/admin/api-keys/stats'),
  getApiKeyById: (id: string) => apiClient.get<ApiKey>(`/admin/api-keys/${id}`),
  createApiKey: (data: {
    key: string;
    name?: string;
    provider?: string;
    company_id?: string;
  }) => apiClient.post<ApiKey>('/admin/api-keys', data),
  updateApiKey: (id: string, data: {
    name?: string;
    company_id?: string;
    provider?: string;
  }) => apiClient.patch<ApiKey>(`/admin/api-keys/${id}`, data),
  deleteApiKey: (id: string) => apiClient.delete(`/admin/api-keys/${id}`),
  toggleApiKeyStatus: (id: string) => apiClient.patch(`/admin/api-keys/${id}/toggle`),

  // System Settings
  getSystemSettings: () => apiClient.get('/admin/settings'),
  updateSystemSettings: (data: any) => apiClient.patch('/admin/settings', data),
};

// Auth API for admin
export const adminAuthApi = {
  login: (email: string, password: string) => 
    apiClient.post<{ access_token: string; user: User }>('/auth/admin/login', { email, password }),
  getProfile: () => apiClient.get<User>('/auth/profile'),
  logout: () => apiClient.post('/auth/logout'),
};