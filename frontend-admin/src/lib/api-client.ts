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
    // Distinguer les vraies erreurs 401 des erreurs réseau
    if (error.response?.status === 401) {
      // Vérifier si c'est une vraie erreur d'authentification
      const isAuthError = error.response?.data?.message?.includes('token') ||
                         error.response?.data?.message?.includes('auth') ||
                         error.response?.data?.message?.includes('unauthorized') ||
                         error.config?.url?.includes('/auth/');

      if (isAuthError) {
        console.log('🔓 [ADMIN AUTH] Token invalide, déconnexion');
        localStorage.removeItem('admin_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      } else {
        console.warn('⚠️ [ADMIN API] Erreur 401 non-auth, pas de déconnexion');
      }
    }

    // Pour les erreurs réseau (pas de response), ne pas déconnecter
    if (!error.response) {
      console.warn('🌐 [ADMIN NETWORK] Erreur réseau - backend indisponible');
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

export interface LoginAuditRecord {
  id: string;
  user_id?: string;
  company_id: string;
  email_attempt: string;
  status: 'success' | 'failed' | 'suspicious';
  failure_reason?: string;
  ip_address: string;
  user_agent?: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser?: string;
  operating_system?: string;
  location_country?: string;
  location_city?: string;
  location_region?: string;
  location_latitude?: number;
  location_longitude?: number;
  session_duration_seconds?: number;
  session_token?: string;
  is_suspicious: boolean;
  suspicious_reasons?: string;
  metadata?: Record<string, any>;
  user?: User;
  company?: Company;
  created_at: string;
}

export interface LoginAuditStats {
  total_attempts: number;
  successful_logins: number;
  failed_attempts: number;
  suspicious_activities: number;
  unique_users: number;
  unique_ips: number;
  success_rate: number;
}

export interface LoginAuditQuery {
  user_id?: string;
  status?: 'success' | 'failed' | 'suspicious';
  email_attempt?: string;
  ip_address?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  is_suspicious?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface MailConfiguration {
  id?: string;
  provider_type: 'smtp' | 'sendgrid' | 'mailgun' | 'aws_ses' | 'supabase' | 'gmail' | 'outlook';
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

export interface MailTemplate {
  id: string;
  template_type: string;
  subject: string;
  html_body: string;
  text_body?: string;
  is_active: boolean;
  is_default: boolean;
  company_id?: string;
  company?: Company;
  available_variables?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateType {
  value: string;
  label: string;
  description: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

// Admin API Functions
export const adminApi = {
  // Dashboard & Stats
  getGlobalStats: () => apiClient.get<GlobalStats>('/admin/stats'),
  getCompaniesStats: () => apiClient.get<CompanyStats[]>('/admin/companies/stats'),
  
  // Mail Automations (Admin)
  
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

  // Mail Templates
  getAllMailTemplates: (companyId?: string) => {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    return apiClient.get<MailTemplate[]>(`/admin/mail-templates?${params.toString()}`);
  },
  getMailTemplateById: (id: string) => apiClient.get<MailTemplate>(`/admin/mail-templates/${id}`),
  createMailTemplate: (data: {
    template_type: string;
    subject: string;
    html_body: string;
    text_body?: string;
    is_active?: boolean;
    is_default?: boolean;
    company_id?: string;
    description?: string;
  }) => apiClient.post<MailTemplate>('/admin/mail-templates', data),
  updateMailTemplate: (id: string, data: {
    subject?: string;
    html_body?: string;
    text_body?: string;
    is_active?: boolean;
    is_default?: boolean;
    description?: string;
  }) => apiClient.put<MailTemplate>(`/admin/mail-templates/${id}`, data),
  deleteMailTemplate: (id: string) => apiClient.delete(`/admin/mail-templates/${id}`),
  duplicateMailTemplate: (id: string, subject?: string) =>
    apiClient.post<MailTemplate>(`/admin/mail-templates/${id}/duplicate`, { subject }),
  getTemplateTypes: () => apiClient.get<TemplateType[]>('/admin/mail-templates/types'),
  // ✅ SUPPRIMÉ - Variables maintenant gérées dynamiquement par getAvailableVariables()

  // Mail Automations
  getAllMailAutomations: () => apiClient.get('/admin/mail-automations'),
  getMailAutomation: (id: string) => apiClient.get(`/admin/mail-automations/${id}`),
  createMailAutomation: (data: any) => apiClient.post('/admin/mail-automations', data),
  updateMailAutomation: (id: string, data: any) => apiClient.put(`/admin/mail-automations/${id}`, data),
  deleteMailAutomation: (id: string) => apiClient.delete(`/admin/mail-automations/${id}`),
  toggleMailAutomation: (id: string) => apiClient.patch(`/admin/mail-automations/${id}/toggle`),
  getMailAutomationStats: () => apiClient.get('/admin/mail-automations/stats'),
  getMailAutomationLogs: () => apiClient.get('/admin/mail-automations/logs'),
  getAvailableVariables: (entityType: string) => apiClient.get(`/admin/mail-automations/available-variables/${entityType}`),
  renderTemplate: (data: {
    template_type: string;
    variables: Record<string, string>;
    company_id?: string;
  }) => apiClient.post<{subject: string; html: string; text?: string}>('/admin/mail-templates/render', data),
  createDefaultTemplates: () => apiClient.post('/admin/mail-templates/create-defaults'),

  // Privacy Policy Configuration
  getPrivacyPolicyConfiguration: () => apiClient.get('/configuration/privacy-policy'),
  uploadPrivacyPolicy: (formData: FormData) =>
    apiClient.post('/configuration/privacy-policy/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  enablePrivacyPolicy: (enabled: boolean) =>
    apiClient.post('/configuration/privacy-policy/enable', { enabled }),
  deletePrivacyPolicy: () => apiClient.delete('/configuration/privacy-policy'),

  // Analytics API
  getProjectsAnalytics: async (filters?: {
    search?: string;
    status?: string;
    sortBy?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    const response = await apiClient.get(`/admin/analytics/projects?${params.toString()}`);
    return response.data.data;
  },
  getProjectReport: async (projectId: string, filters?: {
    period?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    
    const response = await apiClient.get(`/admin/analytics/projects/${projectId}/report?${params.toString()}`);
    return response.data.data;
  },
  exportProjectReport: async (projectId: string, options: {
    format: 'pdf' | 'excel';
    period?: string;
  }) => {
    const params = new URLSearchParams();
    params.append('format', options.format);
    if (options.period) params.append('period', options.period);
    
    const response = await apiClient.get(
      `/admin/analytics/projects/${projectId}/export?${params.toString()}`,
      { responseType: 'blob' }
    );
    return response.data;
  },
  getGlobalAnalyticsStats: async () => {
    const response = await apiClient.get('/admin/analytics/global-stats');
    return response.data.data;
  },

  // Platform Settings & Visual Identity
  getVisualIdentitySettings: () => apiClient.get('/platform-settings/visual-identity'),
  updateVisualIdentitySection: (section: string, settings: Record<string, any>) =>
    apiClient.post(`/platform-settings/visual-identity/${section}`, settings),
  uploadLogo: (formData: FormData) =>
    apiClient.post('/platform-settings/branding/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  uploadFavicon: (formData: FormData) =>
    apiClient.post('/platform-settings/branding/upload-favicon', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  initializePlatformSettings: () => apiClient.post('/platform-settings/initialize'),

  // Security & Login Audit
  getLoginAuditLogs: (query?: LoginAuditQuery) => {
    const params = new URLSearchParams();
    if (query?.user_id) params.append('user_id', query.user_id);
    if (query?.status) params.append('status', query.status);
    if (query?.email_attempt) params.append('email_attempt', query.email_attempt);
    if (query?.ip_address) params.append('ip_address', query.ip_address);
    if (query?.device_type) params.append('device_type', query.device_type);
    if (query?.is_suspicious !== undefined) params.append('is_suspicious', query.is_suspicious.toString());
    if (query?.date_from) params.append('date_from', query.date_from);
    if (query?.date_to) params.append('date_to', query.date_to);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.search) params.append('search', query.search);

    return apiClient.get<{
      data: LoginAuditRecord[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/admin/security/login-audit?${params.toString()}`);
  },

  getLoginAuditStats: (dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    return apiClient.get<LoginAuditStats>(`/admin/security/login-audit/stats?${params.toString()}`);
  },

};

// Auth API for admin
export const adminAuthApi = {
  login: (email: string, password: string) => 
    apiClient.post<{ access_token: string; user: User }>('/auth/admin/login', { email, password }),
  getProfile: () => apiClient.get<User>('/auth/profile'),
  logout: () => apiClient.post('/auth/logout'),
};