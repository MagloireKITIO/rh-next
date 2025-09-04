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
  settings?: Record<string, unknown>;
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
  extractedData?: Record<string, unknown>;
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
  key: string;
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

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    request?: string;
  };
  top_provider: {
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
  per_request_limits?: {
    prompt_tokens: string;
    completion_tokens: string;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

export interface ModelConfig {
  id?: string;
  apiKeyId: string;
  primaryModel: string;
  fallbackModel1?: string;
  fallbackModel2?: string;
  fallbackModel3?: string;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModelConfigStats {
  totalConfigs: number;
  configuredKeys: number;
  popularModels: { model: string; count: number }[];
}

export interface MailConfiguration {
  id?: string;
  provider_type: 'smtp' | 'sendgrid' | 'mailgun' | 'aws_ses' | 'supabase';
  company_id?: string;
  // Configuration SMTP
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  smtp_secure?: boolean;
  smtp_require_tls?: boolean;
  // Configuration services tiers
  api_key?: string;
  api_secret?: string;
  // Configuration générale
  from_email: string;
  from_name: string;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

// Admin API Functions
export const adminApi = {
  // Dashboard & Stats
  getGlobalStats: () => apiClient.get<GlobalStats>('/admin/stats'),
  getCompaniesStats: () => apiClient.get<CompanyStats[]>('/admin/companies/stats'),
  
  // Mail Automations (Admin)
  getMailAutomationsStats: () => apiClient.get('/admin/mail-automations/stats'),
  getAllMailAutomations: () => apiClient.get('/admin/mail-automations'),
  getCompaniesAutomationStats: () => apiClient.get('/admin/companies/automation-stats'),
  toggleMailAutomation: (id: string) => apiClient.patch(`/admin/mail-automations/${id}/toggle`),
  getMailAutomation: (id: string) => apiClient.get(`/admin/mail-automations/${id}`),
  createMailAutomation: (data: Record<string, unknown>) => apiClient.post('/admin/mail-automations', data),
  updateMailAutomation: (id: string, data: Record<string, unknown>) => apiClient.patch(`/admin/mail-automations/${id}`, data),
  deleteMailAutomation: (id: string) => apiClient.delete(`/admin/mail-automations/${id}`),
  
  // Companies Management
  getAllCompanies: () => apiClient.get<Company[]>('/admin/companies'),
  getCompanies: () => apiClient.get<Company[]>('/admin/companies'),
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
    key?: string;
    name?: string;
    company_id?: string;
    provider?: string;
  }) => apiClient.patch<ApiKey>(`/admin/api-keys/${id}`, data),
  deleteApiKey: (id: string) => apiClient.delete(`/admin/api-keys/${id}`),
  toggleApiKeyStatus: (id: string) => apiClient.patch(`/admin/api-keys/${id}/toggle`),

  // OpenRouter Models Management
  getOpenRouterModels: (keyId: string, filters?: {
    modality?: string;
    provider?: string;
    maxContextLength?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.modality) params.append('modality', filters.modality);
    if (filters?.provider) params.append('provider', filters.provider);
    if (filters?.maxContextLength) params.append('maxContextLength', filters.maxContextLength.toString());
    
    return apiClient.get<OpenRouterModelsResponse>(`/admin/api-keys/${keyId}/openrouter/models?${params.toString()}`);
  },
  getOpenRouterProviders: (keyId: string) => 
    apiClient.get<string[]>(`/admin/api-keys/${keyId}/openrouter/providers`),
  getOpenRouterModelById: (keyId: string, modelId: string) => 
    apiClient.get<OpenRouterModel>(`/admin/api-keys/${keyId}/openrouter/models/${encodeURIComponent(modelId)}`),

  // Model Configuration Management
  getModelConfig: (keyId: string) => 
    apiClient.get<ModelConfig>(`/admin/api-keys/${keyId}/model-config`),
  createModelConfig: (keyId: string, config: {
    primaryModel: string;
    fallbackModel1?: string;
    fallbackModel2?: string;
    fallbackModel3?: string;
    notes?: string;
  }) => apiClient.post<ModelConfig>(`/admin/api-keys/${keyId}/model-config`, config),
  updateModelConfig: (keyId: string, config: {
    primaryModel?: string;
    fallbackModel1?: string;
    fallbackModel2?: string;
    fallbackModel3?: string;
    notes?: string;
  }) => apiClient.patch<ModelConfig>(`/admin/api-keys/${keyId}/model-config`, config),
  deleteModelConfig: (keyId: string) => 
    apiClient.delete(`/admin/api-keys/${keyId}/model-config`),
  getAllModelConfigs: () => 
    apiClient.get<ModelConfig[]>('/admin/model-configs'),
  getModelConfigStats: () => 
    apiClient.get<ModelConfigStats>('/admin/model-configs/stats'),

  // System Settings
  getSystemSettings: () => apiClient.get('/admin/settings'),
  updateSystemSettings: (data: Record<string, unknown>) => apiClient.patch('/admin/settings', data),

  // Mail Configuration
  getMailConfiguration: () => apiClient.get<MailConfiguration>('/admin/mail-config'),
  getAllMailConfigurations: () => apiClient.get('/admin/mail-configs'),
  createMailConfiguration: (data: MailConfiguration) => 
    apiClient.post<MailConfiguration>('/admin/mail-configs', data),
  updateMailConfiguration: (id: string, data: MailConfiguration) =>
    apiClient.put<MailConfiguration>(`/admin/mail-configs/${id}`, data),
  deleteMailConfiguration: (id: string) =>
    apiClient.delete(`/admin/mail-configs/${id}`),
  toggleMailConfiguration: (id: string, is_active: boolean) =>
    apiClient.patch(`/admin/mail-configs/${id}/toggle`, { is_active }),
  duplicateMailConfiguration: (id: string, name?: string) =>
    apiClient.post(`/admin/mail-configs/${id}/duplicate`, { name }),
  assignCompaniesToConfiguration: (configId: string, companyIds: string[]) =>
    apiClient.post(`/admin/mail-configs/${configId}/assign-companies`, { companyIds }),
  getConfigurationCompanies: (configId: string) =>
    apiClient.get(`/admin/mail-configs/${configId}/companies`),
  saveMailConfiguration: (data: MailConfiguration) => 
    apiClient.post<MailConfiguration>('/admin/mail-config', data),
  testMailConfiguration: (testEmail: string, companyId?: string) =>
    apiClient.post('/admin/mail-config/test', { email: testEmail, company_id: companyId }),
  getMailConfigurationStatus: () => apiClient.get('/admin/mail-config/status'),

  // Mail Templates (Super Admin can see ALL templates)
  getAllMailTemplates: (context?: string) => apiClient.get('/mail-templates', { params: { context } }),
  getMailTemplateById: (id: string) => apiClient.get(`/mail-templates/${id}`),
  createMailTemplate: (data: Record<string, unknown>) => apiClient.post('/mail-templates', data),
  updateMailTemplate: (id: string, data: Record<string, unknown>) => apiClient.patch(`/mail-templates/${id}`, data),
  deleteMailTemplate: (id: string) => apiClient.delete(`/mail-templates/${id}`),
  previewMailTemplate: (id: string, variables: Record<string, unknown> = {}) => 
    apiClient.post(`/mail-templates/${id}/preview`, { variables }),
};

// Auth API for admin
export const adminAuthApi = {
  login: (email: string, password: string) => 
    apiClient.post<{ access_token: string; user: User }>('/auth/admin/login', { email, password }),
  getProfile: () => apiClient.get<User>('/auth/profile'),
  logout: () => apiClient.post('/auth/logout'),
};