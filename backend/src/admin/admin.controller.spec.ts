import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User, UserRole } from '../auth/entities/user.entity';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<AdminService>;

  const mockUser: User = {
    id: 'user-uuid-1',
    email: 'admin@test.com',
    name: 'Admin User',
    role: UserRole.SUPER_ADMIN,
    avatar_url: null,
    password_hash: null,
    supabase_user_id: 'supabase-id-1',
    google_id: null,
    company_id: 'company-uuid-1',
    company: null,
    is_active: true,
    is_invited: false,
    is_onboarded: true,
    email_verified: true,
    invitation_token: null,
    invitation_expires_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockAdminService = {
    getGlobalStats: jest.fn(),
    getCompaniesStats: jest.fn(),
    getAllCompanies: jest.fn(),
    getCompanyById: jest.fn(),
    createCompany: jest.fn(),
    updateCompany: jest.fn(),
    deleteCompany: jest.fn(),
    toggleCompanyStatus: jest.fn(),
    getAllUsers: jest.fn(),
    getUsersByCompany: jest.fn(),
    getUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    toggleUserStatus: jest.fn(),
    resendUserInvitation: jest.fn(),
    getAllProjects: jest.fn(),
    getProjectsByCompany: jest.fn(),
    getAllApiKeys: jest.fn(),
    getApiKeysStats: jest.fn(),
    getApiKeyById: jest.fn(),
    createApiKey: jest.fn(),
    updateApiKey: jest.fn(),
    deleteApiKey: jest.fn(),
    toggleApiKeyStatus: jest.fn(),
    getSystemSettings: jest.fn(),
    updateSystemSettings: jest.fn(),
    getOpenRouterModels: jest.fn(),
    getOpenRouterProviders: jest.fn(),
    getOpenRouterModelById: jest.fn(),
    getApiKeyModelConfig: jest.fn(),
    createOrUpdateModelConfig: jest.fn(),
    deleteModelConfig: jest.fn(),
    getAllModelConfigs: jest.fn(),
    getModelConfigStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Dashboard & Stats', () => {
    it('should get global stats', async () => {
      const mockStats = {
        totalCompanies: 10,
        activeCompanies: 8,
        totalUsers: 50,
        activeUsers: 45,
        totalProjects: 20,
        totalCandidates: 100,
        totalAnalyses: 150,
        averageScoreGlobal: 75.5,
        companiesGrowth: 15.2,
        usersGrowth: 25.0,
        projectsGrowth: 30.5
      };
      adminService.getGlobalStats.mockResolvedValue(mockStats as any);

      const result = await controller.getGlobalStats();

      expect(adminService.getGlobalStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should get companies stats', async () => {
      const mockStats = [{
        id: 'company-1',
        name: 'Company 1',
        domain: 'company1.com',
        totalUsers: 10,
        activeUsers: 8,
        totalProjects: 5,
        totalCandidates: 25,
        averageScore: 75.0,
        lastActivity: '2023-01-01'
      }];
      adminService.getCompaniesStats.mockResolvedValue(mockStats as any);

      const result = await controller.getCompaniesStats();

      expect(adminService.getCompaniesStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('Companies Management', () => {
    it('should get all companies', async () => {
      const mockCompanies = [{ id: '1', name: 'Company 1' }];
      adminService.getAllCompanies.mockResolvedValue(mockCompanies as any);

      const result = await controller.getAllCompanies();

      expect(adminService.getAllCompanies).toHaveBeenCalled();
      expect(result).toEqual(mockCompanies);
    });

    it('should get company by id', async () => {
      const mockCompany = { id: '1', name: 'Company 1' };
      adminService.getCompanyById.mockResolvedValue(mockCompany as any);

      const result = await controller.getCompanyById('1');

      expect(adminService.getCompanyById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCompany);
    });

    it('should create company', async () => {
      const createCompanyDto = { name: 'New Company', domain: 'new.com' };
      const mockCompany = { id: '1', ...createCompanyDto };
      adminService.createCompany.mockResolvedValue(mockCompany as any);

      const result = await controller.createCompany(createCompanyDto, mockUser);

      expect(adminService.createCompany).toHaveBeenCalledWith(createCompanyDto, mockUser.id);
      expect(result).toEqual(mockCompany);
    });

    it('should update company', async () => {
      const updateData = { name: 'Updated Company' };
      const mockCompany = { id: '1', ...updateData };
      adminService.updateCompany.mockResolvedValue(mockCompany as any);

      const result = await controller.updateCompany('1', updateData);

      expect(adminService.updateCompany).toHaveBeenCalledWith('1', updateData);
      expect(result).toEqual(mockCompany);
    });

    it('should delete company', async () => {
      const mockResult = { message: 'Company deleted successfully' };
      adminService.deleteCompany.mockResolvedValue(mockResult as any);

      const result = await controller.deleteCompany('1');

      expect(adminService.deleteCompany).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });

    it('should toggle company status', async () => {
      const mockResult = { message: 'Company status toggled', company: {} };
      adminService.toggleCompanyStatus.mockResolvedValue(mockResult as any);

      const result = await controller.toggleCompanyStatus('1');

      expect(adminService.toggleCompanyStatus).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('Users Management', () => {
    it('should get all users', async () => {
      const mockUsers = [{ id: '1', name: 'User 1' }];
      adminService.getAllUsers.mockResolvedValue(mockUsers as any);

      const result = await controller.getAllUsers();

      expect(adminService.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should get users by company when company query provided', async () => {
      const mockUsers = [{ id: '1', name: 'User 1' }];
      adminService.getUsersByCompany.mockResolvedValue(mockUsers as any);

      const result = await controller.getAllUsers('company-1');

      expect(adminService.getUsersByCompany).toHaveBeenCalledWith('company-1');
      expect(result).toEqual(mockUsers);
    });

    it('should get users by company', async () => {
      const mockUsers = [{ id: '1', name: 'User 1' }];
      adminService.getUsersByCompany.mockResolvedValue(mockUsers as any);

      const result = await controller.getUsersByCompany('company-1');

      expect(adminService.getUsersByCompany).toHaveBeenCalledWith('company-1');
      expect(result).toEqual(mockUsers);
    });

    it('should get user by id', async () => {
      const mockUser = { id: '1', name: 'User 1' };
      adminService.getUserById.mockResolvedValue(mockUser as any);

      const result = await controller.getUserById('1');

      expect(adminService.getUserById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });

    it('should create user', async () => {
      const createUserDto = { email: 'test@test.com', name: 'Test User', role: 'user' };
      const mockUser = { id: '1', ...createUserDto, invitation_sent: true, message: 'User created' };
      adminService.createUser.mockResolvedValue(mockUser as any);

      const result = await controller.createUser(createUserDto);

      expect(adminService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should update user', async () => {
      const updateData = { name: 'Updated User' };
      const mockUser = { id: '1', ...updateData };
      adminService.updateUser.mockResolvedValue(mockUser as any);

      const result = await controller.updateUser('1', updateData);

      expect(adminService.updateUser).toHaveBeenCalledWith('1', updateData);
      expect(result).toEqual(mockUser);
    });

    it('should delete user', async () => {
      const mockResult = { message: 'User deleted successfully' };
      adminService.deleteUser.mockResolvedValue(mockResult as any);

      const result = await controller.deleteUser('1');

      expect(adminService.deleteUser).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });

    it('should toggle user status', async () => {
      const mockResult = { id: '1', is_active: false };
      adminService.toggleUserStatus.mockResolvedValue(mockResult as any);

      const result = await controller.toggleUserStatus('1');

      expect(adminService.toggleUserStatus).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });

    it('should resend user invitation', async () => {
      const mockResult = { sent: true };
      adminService.resendUserInvitation.mockResolvedValue(mockResult as any);

      const result = await controller.resendUserInvitation('1');

      expect(adminService.resendUserInvitation).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('Projects Management', () => {
    it('should get all projects', async () => {
      const mockProjects = [{ id: '1', name: 'Project 1' }];
      adminService.getAllProjects.mockResolvedValue(mockProjects as any);

      const result = await controller.getAllProjects();

      expect(adminService.getAllProjects).toHaveBeenCalled();
      expect(result).toEqual(mockProjects);
    });

    it('should get projects by company when company query provided', async () => {
      const mockProjects = [{ id: '1', name: 'Project 1' }];
      adminService.getProjectsByCompany.mockResolvedValue(mockProjects as any);

      const result = await controller.getAllProjects('company-1');

      expect(adminService.getProjectsByCompany).toHaveBeenCalledWith('company-1');
      expect(result).toEqual(mockProjects);
    });

    it('should get projects by company', async () => {
      const mockProjects = [{ id: '1', name: 'Project 1' }];
      adminService.getProjectsByCompany.mockResolvedValue(mockProjects as any);

      const result = await controller.getProjectsByCompany('company-1');

      expect(adminService.getProjectsByCompany).toHaveBeenCalledWith('company-1');
      expect(result).toEqual(mockProjects);
    });
  });

  describe('API Keys Management', () => {
    it('should get all api keys', async () => {
      const mockApiKeys = [{ id: '1', name: 'API Key 1' }];
      adminService.getAllApiKeys.mockResolvedValue(mockApiKeys as any);

      const result = await controller.getAllApiKeys();

      expect(adminService.getAllApiKeys).toHaveBeenCalled();
      expect(result).toEqual(mockApiKeys);
    });

    it('should get api keys stats', async () => {
      const mockStats = { total: 5, active: 3 };
      adminService.getApiKeysStats.mockResolvedValue(mockStats as any);

      const result = await controller.getApiKeysStats();

      expect(adminService.getApiKeysStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should get api key by id', async () => {
      const mockApiKey = { id: '1', name: 'API Key 1' };
      adminService.getApiKeyById.mockResolvedValue(mockApiKey as any);

      const result = await controller.getApiKeyById('1');

      expect(adminService.getApiKeyById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockApiKey);
    });

    it('should create api key', async () => {
      const createApiKeyDto = { key: 'sk-123', name: 'Test Key', provider: 'openai' };
      const mockApiKey = { id: '1', ...createApiKeyDto };
      adminService.createApiKey.mockResolvedValue(mockApiKey as any);

      const result = await controller.createApiKey(createApiKeyDto);

      expect(adminService.createApiKey).toHaveBeenCalledWith(createApiKeyDto);
      expect(result).toEqual(mockApiKey);
    });

    it('should update api key', async () => {
      const updateData = { name: 'Updated Key' };
      const mockApiKey = { id: '1', ...updateData };
      adminService.updateApiKey.mockResolvedValue(mockApiKey as any);

      const result = await controller.updateApiKey('1', updateData);

      expect(adminService.updateApiKey).toHaveBeenCalledWith('1', updateData);
      expect(result).toEqual(mockApiKey);
    });

    it('should delete api key', async () => {
      const mockResult = { message: 'API key deleted successfully' };
      adminService.deleteApiKey.mockResolvedValue(mockResult as any);

      const result = await controller.deleteApiKey('1');

      expect(adminService.deleteApiKey).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });

    it('should toggle api key status', async () => {
      const mockResult = { id: '1', is_active: false };
      adminService.toggleApiKeyStatus.mockResolvedValue(mockResult as any);

      const result = await controller.toggleApiKeyStatus('1');

      expect(adminService.toggleApiKeyStatus).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('System Settings', () => {
    it('should get system settings', async () => {
      const mockSettings = { key: 'value' };
      adminService.getSystemSettings.mockResolvedValue(mockSettings as any);

      const result = await controller.getSystemSettings();

      expect(adminService.getSystemSettings).toHaveBeenCalled();
      expect(result).toEqual(mockSettings);
    });

    it('should update system settings', async () => {
      const settings = { key: 'newValue' };
      const mockResult = { updated: true };
      adminService.updateSystemSettings.mockResolvedValue(mockResult as any);

      const result = await controller.updateSystemSettings(settings);

      expect(adminService.updateSystemSettings).toHaveBeenCalledWith(settings);
      expect(result).toEqual(mockResult);
    });
  });

  describe('OpenRouter Models Management', () => {
    it('should get openrouter models without filters', async () => {
      const mockModels = { models: [{ id: 'model-1', name: 'Model 1' }] };
      adminService.getOpenRouterModels.mockResolvedValue(mockModels as any);

      const result = await controller.getOpenRouterModels('key-1');

      expect(adminService.getOpenRouterModels).toHaveBeenCalledWith('key-1', undefined);
      expect(result).toEqual(mockModels);
    });

    it('should get openrouter models with filters', async () => {
      const mockModels = { models: [{ id: 'model-1', name: 'Model 1' }] };
      adminService.getOpenRouterModels.mockResolvedValue(mockModels as any);

      const result = await controller.getOpenRouterModels('key-1', 'text', 'openai', '4096');

      expect(adminService.getOpenRouterModels).toHaveBeenCalledWith('key-1', {
        modality: 'text',
        provider: 'openai',
        maxContextLength: 4096,
      });
      expect(result).toEqual(mockModels);
    });

    it('should get openrouter providers', async () => {
      const mockProviders = ['openai', 'anthropic'];
      adminService.getOpenRouterProviders.mockResolvedValue(mockProviders as any);

      const result = await controller.getOpenRouterProviders('key-1');

      expect(adminService.getOpenRouterProviders).toHaveBeenCalledWith('key-1');
      expect(result).toEqual(mockProviders);
    });

    it('should get openrouter model by id', async () => {
      const mockModel = { id: 'model-1', name: 'Model 1' };
      adminService.getOpenRouterModelById.mockResolvedValue(mockModel as any);

      const result = await controller.getOpenRouterModelById('key-1', 'model-1');

      expect(adminService.getOpenRouterModelById).toHaveBeenCalledWith('key-1', 'model-1');
      expect(result).toEqual(mockModel);
    });
  });

  describe('API Key Model Configuration Management', () => {
    it('should get api key model config', async () => {
      const mockConfig = { primaryModel: 'gpt-4' };
      adminService.getApiKeyModelConfig.mockResolvedValue(mockConfig as any);

      const result = await controller.getApiKeyModelConfig('key-1');

      expect(adminService.getApiKeyModelConfig).toHaveBeenCalledWith('key-1');
      expect(result).toEqual(mockConfig);
    });

    it('should create model config', async () => {
      const configData = { primaryModel: 'gpt-4', fallbackModel1: 'gpt-3.5-turbo' };
      const mockConfig = { id: '1', ...configData };
      adminService.createOrUpdateModelConfig.mockResolvedValue(mockConfig as any);

      const result = await controller.createModelConfig('key-1', configData);

      expect(adminService.createOrUpdateModelConfig).toHaveBeenCalledWith('key-1', configData);
      expect(result).toEqual(mockConfig);
    });

    it('should update model config', async () => {
      const configData = { primaryModel: 'gpt-4-turbo' };
      const mockConfig = { id: '1', ...configData };
      adminService.createOrUpdateModelConfig.mockResolvedValue(mockConfig as any);

      const result = await controller.updateModelConfig('key-1', configData);

      expect(adminService.createOrUpdateModelConfig).toHaveBeenCalledWith('key-1', configData);
      expect(result).toEqual(mockConfig);
    });

    it('should delete model config', async () => {
      adminService.deleteModelConfig.mockResolvedValue(undefined);

      const result = await controller.deleteModelConfig('key-1');

      expect(adminService.deleteModelConfig).toHaveBeenCalledWith('key-1');
      expect(result).toBeUndefined();
    });

    it('should get all model configs', async () => {
      const mockConfigs = [{ id: '1', primaryModel: 'gpt-4' }];
      adminService.getAllModelConfigs.mockResolvedValue(mockConfigs as any);

      const result = await controller.getAllModelConfigs();

      expect(adminService.getAllModelConfigs).toHaveBeenCalled();
      expect(result).toEqual(mockConfigs);
    });

    it('should get model config stats', async () => {
      const mockStats = {
        totalConfigs: 5,
        configuredKeys: 3,
        popularModels: [{ model: 'gpt-4', count: 2 }]
      };
      adminService.getModelConfigStats.mockResolvedValue(mockStats as any);

      const result = await controller.getModelConfigStats();

      expect(adminService.getModelConfigStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });
});