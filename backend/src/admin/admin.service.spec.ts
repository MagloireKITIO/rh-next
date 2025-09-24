import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Company } from '../companies/entities/company.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Analysis } from '../analysis/entities/analysis.entity';
import { ApiKey } from '../api-keys/entities/api-key.entity';
import { Configuration } from '../configuration/entities/configuration.entity';
import { OpenRouterService } from '../openrouter/openrouter.service';
import { ApiKeyModelConfigService } from '../api-keys/api-key-model-config.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      admin: {
        inviteUserByEmail: jest.fn(),
        deleteUser: jest.fn(),
        updateUserById: jest.fn(),
      },
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  })),
}));

describe('AdminService', () => {
  let service: AdminService;
  let companyRepository: Repository<Company>;
  let userRepository: Repository<User>;
  let projectRepository: Repository<Project>;
  let candidateRepository: Repository<Candidate>;
  let analysisRepository: Repository<Analysis>;
  let apiKeyRepository: Repository<ApiKey>;
  let configurationRepository: Repository<Configuration>;
  let configService: ConfigService;
  let openRouterService: OpenRouterService;
  let apiKeyModelConfigService: ApiKeyModelConfigService;

  const mockCompany = {
    id: 'company-uuid-1',
    name: 'Test Company',
    domain: 'test.com',
    description: 'Test company description',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@test.com',
    name: 'Test User',
    role: UserRole.USER,
    company_id: 'company-uuid-1',
    is_active: true,
    is_invited: false,
    email_verified: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockApiKey = {
    id: 'api-key-uuid-1',
    name: 'Test API Key',
    key: 'test-api-key-123',
    provider: 'openrouter',
    isActive: true,
    requestCount: 100,
    lastUsedAt: new Date(),
    company_id: 'company-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepositoryBase = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const values = {
        SUPABASE_URL: 'https://mock.supabase.co',
        SUPABASE_ANON_KEY: 'mock-key',
      };
      return values[key];
    }),
  };

  const mockOpenRouterService = {
    getFilteredModels: jest.fn(),
    getProviders: jest.fn(),
    getModelById: jest.fn(),
  };

  const mockApiKeyModelConfigService = {
    findByApiKeyId: jest.fn(),
    createOrUpdateConfig: jest.fn(),
    deleteConfig: jest.fn(),
    getAllConfigs: jest.fn(),
    getModelStats: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(Company),
          useValue: { ...mockRepositoryBase, createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder) },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { ...mockRepositoryBase, createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder) },
        },
        {
          provide: getRepositoryToken(Project),
          useValue: { ...mockRepositoryBase, createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder) },
        },
        {
          provide: getRepositoryToken(Candidate),
          useValue: { ...mockRepositoryBase, createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder) },
        },
        {
          provide: getRepositoryToken(Analysis),
          useValue: { ...mockRepositoryBase, createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder) },
        },
        {
          provide: getRepositoryToken(ApiKey),
          useValue: { ...mockRepositoryBase, createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder) },
        },
        {
          provide: getRepositoryToken(Configuration),
          useValue: { ...mockRepositoryBase, createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder) },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: OpenRouterService,
          useValue: mockOpenRouterService,
        },
        {
          provide: ApiKeyModelConfigService,
          useValue: mockApiKeyModelConfigService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    companyRepository = module.get<Repository<Company>>(getRepositoryToken(Company));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    projectRepository = module.get<Repository<Project>>(getRepositoryToken(Project));
    candidateRepository = module.get<Repository<Candidate>>(getRepositoryToken(Candidate));
    analysisRepository = module.get<Repository<Analysis>>(getRepositoryToken(Analysis));
    apiKeyRepository = module.get<Repository<ApiKey>>(getRepositoryToken(ApiKey));
    configurationRepository = module.get<Repository<Configuration>>(getRepositoryToken(Configuration));
    configService = module.get<ConfigService>(ConfigService);
    openRouterService = module.get<OpenRouterService>(OpenRouterService);
    apiKeyModelConfigService = module.get<ApiKeyModelConfigService>(ApiKeyModelConfigService);

    // Reset QueryBuilder methods to return 'this' for chaining
    mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.leftJoin.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.leftJoinAndSelect.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.where.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.andWhere.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.groupBy.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.addGroupBy.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.orderBy.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.limit.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.loadRelationCountAndMap.mockReturnValue(mockQueryBuilder);
  });


  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGlobalStats', () => {
    it('should return global statistics', async () => {
      // Mock count methods for Promise.all - the order matters!
      companyRepository.count = jest.fn()
        .mockImplementationOnce(() => Promise.resolve(10)) // totalCompanies
        .mockImplementationOnce(() => Promise.resolve(8)); // activeCompanies

      userRepository.count = jest.fn()
        .mockImplementationOnce(() => Promise.resolve(50)) // totalUsers
        .mockImplementationOnce(() => Promise.resolve(45)); // activeUsers

      projectRepository.count = jest.fn().mockImplementation(() => Promise.resolve(25));
      candidateRepository.count = jest.fn().mockImplementation(() => Promise.resolve(150));
      analysisRepository.count = jest.fn().mockImplementation(() => Promise.resolve(120));

      mockQueryBuilder.getRawOne.mockResolvedValue({ avg: '75.5' });

      const result = await service.getGlobalStats();

      expect(result).toEqual({
        totalCompanies: 10,
        activeCompanies: 8,
        totalUsers: 50,
        activeUsers: 45,
        totalProjects: 25,
        totalCandidates: 150,
        totalAnalyses: 120,
        averageScoreGlobal: 76,
        companiesGrowth: 12,
        usersGrowth: 8,
        projectsGrowth: 15,
      });

      expect(candidateRepository.createQueryBuilder).toHaveBeenCalledWith('candidate');
    });
  });

  describe('getAllCompanies', () => {
    it('should return all companies with relations', async () => {
      const companies = [mockCompany];
      companyRepository.find = jest.fn().mockResolvedValue(companies);

      const result = await service.getAllCompanies();

      expect(result).toEqual(companies);
      expect(companyRepository.find).toHaveBeenCalledWith({
        relations: ['users', 'projects'],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('getCompanyById', () => {
    it('should return company when found', async () => {
      companyRepository.findOne = jest.fn().mockResolvedValue(mockCompany);

      const result = await service.getCompanyById('company-uuid-1');

      expect(result).toEqual(mockCompany);
      expect(companyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'company-uuid-1' },
        relations: ['users', 'projects'],
      });
    });

    it('should throw NotFoundException when company not found', async () => {
      companyRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.getCompanyById('non-existing')).rejects.toThrow(
        new NotFoundException('Entreprise introuvable')
      );
    });
  });

  describe('createCompany', () => {
    const createCompanyDto = {
      name: 'New Company',
      domain: 'new.com',
      description: 'New company description',
    };

    it('should create company successfully', async () => {
      companyRepository.findOne = jest.fn().mockResolvedValue(null); // No existing domain
      companyRepository.create = jest.fn().mockReturnValue(mockCompany);
      companyRepository.save = jest.fn().mockResolvedValue(mockCompany);

      const result = await service.createCompany(createCompanyDto, 'user-id');

      expect(result).toEqual(mockCompany);
      expect(companyRepository.findOne).toHaveBeenCalledWith({
        where: { domain: createCompanyDto.domain },
      });
      expect(companyRepository.create).toHaveBeenCalledWith({
        ...createCompanyDto,
        is_active: true,
      });
      expect(companyRepository.save).toHaveBeenCalledWith(mockCompany);
    });

    it('should throw BadRequestException when domain already exists', async () => {
      companyRepository.findOne = jest.fn().mockResolvedValue(mockCompany);

      await expect(service.createCompany(createCompanyDto, 'user-id')).rejects.toThrow(
        new BadRequestException('Une entreprise avec ce domaine existe déjà')
      );
    });
  });

  describe('updateCompany', () => {
    const updateData = { name: 'Updated Company' };

    it('should update company successfully', async () => {
      const updatedCompany = { ...mockCompany, ...updateData };
      companyRepository.findOne = jest.fn().mockResolvedValue(mockCompany);
      companyRepository.save = jest.fn().mockResolvedValue(updatedCompany);

      const result = await service.updateCompany('company-uuid-1', updateData);

      expect(result).toEqual(updatedCompany);
      expect(companyRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when company not found', async () => {
      companyRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.updateCompany('non-existing', updateData)).rejects.toThrow(
        new NotFoundException('Entreprise introuvable')
      );
    });

    it('should validate unique domain when updating domain', async () => {
      const updateWithDomain = { domain: 'existing.com' };
      companyRepository.findOne = jest.fn()
        .mockResolvedValueOnce(mockCompany) // Current company
        .mockResolvedValueOnce({ id: 'other-company' }); // Existing domain

      await expect(service.updateCompany('company-uuid-1', updateWithDomain)).rejects.toThrow(
        new BadRequestException('Une entreprise avec ce domaine existe déjà')
      );
    });
  });

  describe('deleteCompany', () => {
    it('should delete company when no associated data', async () => {
      const companyWithoutData = { ...mockCompany, users: [], projects: [] };
      companyRepository.findOne = jest.fn().mockResolvedValue(companyWithoutData);
      companyRepository.remove = jest.fn().mockResolvedValue(companyWithoutData);

      const result = await service.deleteCompany('company-uuid-1');

      expect(result).toEqual({ message: 'Entreprise supprimée avec succès' });
      expect(companyRepository.remove).toHaveBeenCalledWith(companyWithoutData);
    });

    it('should throw BadRequestException when company has associated data', async () => {
      const companyWithData = { ...mockCompany, users: [mockUser], projects: [] };
      companyRepository.findOne = jest.fn().mockResolvedValue(companyWithData);

      await expect(service.deleteCompany('company-uuid-1')).rejects.toThrow(
        new BadRequestException('Impossible de supprimer cette entreprise : elle contient des utilisateurs ou des projets')
      );
    });

    it('should throw NotFoundException when company not found', async () => {
      companyRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.deleteCompany('non-existing')).rejects.toThrow(
        new NotFoundException('Entreprise introuvable')
      );
    });
  });

  describe('toggleCompanyStatus', () => {
    it('should toggle company status successfully', async () => {
      const activeCompany = { ...mockCompany, is_active: true };
      const inactiveCompany = { ...mockCompany, is_active: false };

      companyRepository.findOne = jest.fn().mockResolvedValue(activeCompany);
      companyRepository.save = jest.fn().mockResolvedValue(inactiveCompany);

      const result = await service.toggleCompanyStatus('company-uuid-1');

      expect(result.message).toBe('Entreprise désactivée avec succès');
      expect(result.company).toEqual(inactiveCompany);
    });

    it('should throw NotFoundException when company not found', async () => {
      companyRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.toggleCompanyStatus('non-existing')).rejects.toThrow(
        new NotFoundException('Entreprise introuvable')
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return all users with relations', async () => {
      const users = [mockUser];
      userRepository.find = jest.fn().mockResolvedValue(users);

      const result = await service.getAllUsers();

      expect(result).toEqual(users);
      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ['company'],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('createUser', () => {
    const createUserDto = {
      email: 'newuser@test.com',
      name: 'New User',
      role: 'user',
      company_id: 'company-uuid-1',
    };

    it('should create user successfully', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(null); // No existing email
      companyRepository.findOne = jest.fn().mockResolvedValue(mockCompany);
      userRepository.create = jest.fn().mockReturnValue(mockUser);
      userRepository.save = jest.fn().mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);

      expect(result.invitation_sent).toBe(true);
      expect(result.message).toContain('Invitation envoyée à');
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createUserDto,
          role: 'user',
          is_active: true,
          is_invited: true,
          email_verified: false,
          invitation_token: expect.any(String),
        })
      );
    });

    it('should throw BadRequestException when email already exists', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        new BadRequestException('Un utilisateur avec cet email existe déjà')
      );
    });

    it('should throw BadRequestException when company not found', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(null);
      companyRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        new BadRequestException('Entreprise introuvable')
      );
    });
  });

  describe('API Keys Management', () => {
    describe('getAllApiKeys', () => {
      it('should return all API keys with company relations', async () => {
        const apiKeys = [mockApiKey];
        apiKeyRepository.find = jest.fn().mockResolvedValue(apiKeys);

        const result = await service.getAllApiKeys();

        expect(result).toEqual(apiKeys);
        expect(apiKeyRepository.find).toHaveBeenCalledWith({
          relations: ['company'],
          order: { createdAt: 'DESC' },
          select: expect.any(Object),
        });
      });
    });

    describe('createApiKey', () => {
      const createApiKeyDto = {
        key: 'new-api-key',
        name: 'New API Key',
        provider: 'openrouter',
        company_id: 'company-uuid-1',
      };

      it('should create API key successfully', async () => {
        apiKeyRepository.findOne = jest.fn()
          .mockResolvedValueOnce(null) // No existing key
          .mockResolvedValueOnce(mockApiKey); // Return created key for getApiKeyById
        companyRepository.findOne = jest.fn().mockResolvedValue(mockCompany);
        apiKeyRepository.create = jest.fn().mockReturnValue(mockApiKey);
        apiKeyRepository.save = jest.fn().mockResolvedValue(mockApiKey);

        const result = await service.createApiKey(createApiKeyDto);

        expect(result).toEqual(mockApiKey);
        expect(apiKeyRepository.create).toHaveBeenCalledWith({
          ...createApiKeyDto,
          provider: 'openrouter',
          isActive: true,
        });
      });

      it('should throw BadRequestException when key already exists', async () => {
        apiKeyRepository.findOne = jest.fn().mockResolvedValue(mockApiKey);

        await expect(service.createApiKey(createApiKeyDto)).rejects.toThrow(
          new BadRequestException('Une clé API avec cette valeur existe déjà')
        );
      });
    });

    describe('getOpenRouterModels', () => {
      it('should return models for valid OpenRouter API key', async () => {
        const models = [{ id: 'model-1', name: 'Test Model' }];
        apiKeyRepository.findOne = jest.fn().mockResolvedValue(mockApiKey);
        mockOpenRouterService.getFilteredModels.mockResolvedValue(models);

        const result = await service.getOpenRouterModels('api-key-uuid-1');

        expect(result).toEqual(models);
        expect(mockOpenRouterService.getFilteredModels).toHaveBeenCalledWith(mockApiKey.key, undefined);
      });

      it('should throw NotFoundException when API key not found', async () => {
        apiKeyRepository.findOne = jest.fn().mockResolvedValue(null);

        await expect(service.getOpenRouterModels('non-existing')).rejects.toThrow(
          new NotFoundException('Clé API introuvable')
        );
      });

      it('should throw BadRequestException when API key is not for OpenRouter', async () => {
        const nonOpenRouterKey = { ...mockApiKey, provider: 'other' };
        apiKeyRepository.findOne = jest.fn().mockResolvedValue(nonOpenRouterKey);

        await expect(service.getOpenRouterModels('api-key-uuid-1')).rejects.toThrow(
          new BadRequestException('Cette clé API n\'est pas pour OpenRouter')
        );
      });

      it('should throw BadRequestException when API key is inactive', async () => {
        const inactiveKey = { ...mockApiKey, isActive: false };
        apiKeyRepository.findOne = jest.fn().mockResolvedValue(inactiveKey);

        await expect(service.getOpenRouterModels('api-key-uuid-1')).rejects.toThrow(
          new BadRequestException('Cette clé API est inactive')
        );
      });
    });
  });

  describe('getCompaniesStats', () => {
    it('should return companies with detailed statistics', async () => {
      const mockCompanies = [mockCompany];

      // Ensure company repository has proper createQueryBuilder
      companyRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      candidateRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      mockQueryBuilder.getMany.mockResolvedValue(mockCompanies);
      mockQueryBuilder.getCount.mockResolvedValue(10);
      mockQueryBuilder.getRawOne.mockResolvedValue({ avg: '85.5' });
      mockQueryBuilder.getOne.mockResolvedValue({ createdAt: new Date() });

      const result = await service.getCompaniesStats();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: mockCompany.id,
          name: mockCompany.name,
          domain: mockCompany.domain,
          totalCandidates: 10,
          averageScore: 86,
        })
      );
      expect(companyRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('getUsersByCompany', () => {
    it('should return users for a specific company', async () => {
      const users = [mockUser];
      userRepository.find = jest.fn().mockResolvedValue(users);

      const result = await service.getUsersByCompany('company-uuid-1');

      expect(result).toEqual(users);
      expect(userRepository.find).toHaveBeenCalledWith({
        where: { company_id: 'company-uuid-1' },
        relations: ['company'],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await service.getUserById('user-uuid-1');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        relations: ['company'],
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.getUserById('non-existing')).rejects.toThrow(
        new NotFoundException('Utilisateur introuvable')
      );
    });
  });

  describe('updateUser', () => {
    const updateData = { name: 'Updated User' };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateData };
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      userRepository.save = jest.fn().mockResolvedValue(updatedUser);

      const result = await service.updateUser('user-uuid-1', updateData);

      expect(result).toEqual(updatedUser);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.updateUser('non-existing', updateData)).rejects.toThrow(
        new NotFoundException('Utilisateur introuvable')
      );
    });

    it('should validate unique email when updating email', async () => {
      const updateWithEmail = { email: 'existing@test.com' };
      userRepository.findOne = jest.fn()
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ id: 'other-user' });

      await expect(service.updateUser('user-uuid-1', updateWithEmail)).rejects.toThrow(
        new BadRequestException('Un utilisateur avec cet email existe déjà')
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      userRepository.remove = jest.fn().mockResolvedValue(mockUser);

      const result = await service.deleteUser('user-uuid-1');

      expect(result).toEqual({ message: 'Utilisateur supprimé avec succès' });
      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.deleteUser('non-existing')).rejects.toThrow(
        new NotFoundException('Utilisateur introuvable')
      );
    });
  });

  describe('resendUserInvitation', () => {
    const invitedUser = { ...mockUser, is_invited: true, invitation_token: 'old-token' };

    it('should resend user invitation successfully', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(invitedUser);
      userRepository.save = jest.fn().mockResolvedValue({ ...invitedUser, invitation_token: 'new-token' });

      const result = await service.resendUserInvitation('user-uuid-1');

      expect(result.message).toContain('Invitation renvoyée à');
      expect(result.invitation_sent).toBe(true);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found or not invited', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.resendUserInvitation('non-existing')).rejects.toThrow(
        new NotFoundException('Utilisateur introuvable ou déjà activé')
      );
    });
  });

  describe('toggleUserStatus', () => {
    it('should toggle user status successfully', async () => {
      const activeUser = { ...mockUser, is_active: true };
      const inactiveUser = { ...mockUser, is_active: false };

      userRepository.findOne = jest.fn().mockResolvedValue(activeUser);
      userRepository.save = jest.fn().mockResolvedValue(inactiveUser);

      const result = await service.toggleUserStatus('user-uuid-1');

      expect(result.message).toBe('Utilisateur désactivé avec succès');
      expect(result.user).toEqual(inactiveUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.toggleUserStatus('non-existing')).rejects.toThrow(
        new NotFoundException('Utilisateur introuvable')
      );
    });
  });

  describe('Projects Management', () => {
    describe('getAllProjects', () => {
      it('should return all projects with relations', async () => {
        const projects = [{ id: 'project-1', title: 'Test Project' }];
        projectRepository.find = jest.fn().mockResolvedValue(projects);

        const result = await service.getAllProjects();

        expect(result).toEqual(projects);
        expect(projectRepository.find).toHaveBeenCalledWith({
          relations: ['company', 'createdBy', 'candidates'],
          order: { createdAt: 'DESC' },
        });
      });
    });

    describe('getProjectsByCompany', () => {
      it('should return projects for a specific company', async () => {
        const projects = [{ id: 'project-1', title: 'Test Project' }];
        projectRepository.find = jest.fn().mockResolvedValue(projects);

        const result = await service.getProjectsByCompany('company-uuid-1');

        expect(result).toEqual(projects);
        expect(projectRepository.find).toHaveBeenCalledWith({
          where: { company_id: 'company-uuid-1' },
          relations: ['company', 'createdBy', 'candidates'],
          order: { createdAt: 'DESC' },
        });
      });
    });
  });

  describe('updateApiKey', () => {
    const updateData = { name: 'Updated API Key' };

    it('should update API key successfully', async () => {
      const updatedKey = { ...mockApiKey, ...updateData };
      apiKeyRepository.findOne = jest.fn()
        .mockResolvedValueOnce(mockApiKey)
        .mockResolvedValueOnce(updatedKey);
      apiKeyRepository.save = jest.fn().mockResolvedValue(updatedKey);

      const result = await service.updateApiKey('api-key-uuid-1', updateData);

      expect(result).toEqual(updatedKey);
      expect(apiKeyRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when API key not found', async () => {
      apiKeyRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.updateApiKey('non-existing', updateData)).rejects.toThrow(
        new NotFoundException('Clé API introuvable')
      );
    });

    it('should validate company exists when updating company_id', async () => {
      const updateWithCompany = { company_id: 'non-existing-company' };
      apiKeyRepository.findOne = jest.fn().mockResolvedValue(mockApiKey);
      companyRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.updateApiKey('api-key-uuid-1', updateWithCompany)).rejects.toThrow(
        new BadRequestException('Entreprise introuvable')
      );
    });
  });

  describe('deleteApiKey', () => {
    it('should delete API key successfully', async () => {
      apiKeyRepository.findOne = jest.fn().mockResolvedValue(mockApiKey);
      apiKeyRepository.remove = jest.fn().mockResolvedValue(mockApiKey);

      const result = await service.deleteApiKey('api-key-uuid-1');

      expect(result).toEqual({ message: 'Clé API supprimée avec succès' });
      expect(apiKeyRepository.remove).toHaveBeenCalledWith(mockApiKey);
    });

    it('should throw NotFoundException when API key not found', async () => {
      apiKeyRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.deleteApiKey('non-existing')).rejects.toThrow(
        new NotFoundException('Clé API introuvable')
      );
    });
  });

  describe('toggleApiKeyStatus', () => {
    it('should toggle API key status successfully', async () => {
      const activeKey = { ...mockApiKey, isActive: true };
      const inactiveKey = { ...mockApiKey, isActive: false };

      apiKeyRepository.findOne = jest.fn().mockResolvedValue(activeKey);
      apiKeyRepository.save = jest.fn().mockResolvedValue(inactiveKey);

      const result = await service.toggleApiKeyStatus('api-key-uuid-1');

      expect(result.message).toBe('Clé API désactivée avec succès');
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when API key not found', async () => {
      apiKeyRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.toggleApiKeyStatus('non-existing')).rejects.toThrow(
        new NotFoundException('Clé API introuvable')
      );
    });
  });

  describe('getApiKeysStats', () => {
    it('should return API keys statistics', async () => {
      // Create a fresh mock for this test to avoid interference
      const freshApiKeyRepo = {
        count: jest.fn()
          .mockResolvedValueOnce(10)  // totalKeys
          .mockResolvedValueOnce(8)   // activeKeys
          .mockResolvedValueOnce(2),  // inactiveKeys
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };

      // Replace the repository for this test
      Object.assign(apiKeyRepository, freshApiKeyRepo);

      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '150' });
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { companyName: 'Test Company', companyId: 'company-1', keyCount: '3', totalRequests: '50' }
      ]);

      const result = await service.getApiKeysStats();

      expect(result).toEqual({
        totalKeys: 10,
        activeKeys: 8,
        inactiveKeys: 2,
        totalRequests: 150,
        keysByCompany: [{
          companyName: 'Test Company',
          companyId: 'company-1',
          keyCount: 3,
          totalRequests: 50,
        }],
      });
    });

    it('should handle errors gracefully', async () => {
      // Create a fresh mock that throws an error
      const errorApiKeyRepo = {
        count: jest.fn().mockRejectedValue(new Error('Database error')),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };

      // Replace the repository for this test
      Object.assign(apiKeyRepository, errorApiKeyRepo);

      const result = await service.getApiKeysStats();

      expect(result).toEqual({
        totalKeys: 0,
        activeKeys: 0,
        inactiveKeys: 0,
        totalRequests: 0,
        keysByCompany: [],
      });
    });
  });

  describe('System Settings', () => {
    describe('getSystemSettings', () => {
      it('should return system settings from configuration', async () => {
        const configurations = [
          { key: 'google_oauth_client_id', value: 'test-client-id', isActive: true },
          { key: 'maintenance_mode', value: 'false', isActive: true },
          { key: 'max_companies', value: '100', isActive: true },
        ];

        configurationRepository.find = jest.fn().mockResolvedValue(configurations);

        const result = await service.getSystemSettings();

        expect(result).toEqual({
          google_oauth_client_id: 'test-client-id',
          google_oauth_client_secret: '',
          google_oauth_redirect_uri: '',
          maintenance_mode: false,
          max_companies: 100,
          max_users_per_company: null,
          features: {
            ai_analysis: true,
            team_requests: true,
            public_jobs: true,
          },
        });
      });
    });

    describe('updateSystemSettings', () => {
      it('should update system settings', async () => {
        const settings = {
          maintenance_mode: true,
          max_companies: 50,
        };

        const existingConfig = {
          key: 'maintenance_mode',
          value: 'false',
          updatedAt: new Date(),
        };

        configurationRepository.findOne = jest.fn()
          .mockResolvedValueOnce(existingConfig)
          .mockResolvedValueOnce(null);

        configurationRepository.save = jest.fn().mockResolvedValue(existingConfig);
        configurationRepository.create = jest.fn().mockReturnValue({
          key: 'max_companies',
          value: '50',
          description: 'Configuration max_companies',
          isActive: true,
        });

        const result = await service.updateSystemSettings(settings);

        expect(result.message).toBe('Paramètres système mis à jour avec succès');
        expect(result.settings).toEqual(settings);
      });
    });
  });

  describe('OpenRouter Models Management', () => {
    describe('getOpenRouterProviders', () => {
      it('should return providers for valid OpenRouter API key', async () => {
        const providers = [{ id: 'provider-1', name: 'Test Provider' }];
        apiKeyRepository.findOne = jest.fn().mockResolvedValue(mockApiKey);
        mockOpenRouterService.getProviders.mockResolvedValue(providers);

        const result = await service.getOpenRouterProviders('api-key-uuid-1');

        expect(result).toEqual(providers);
        expect(mockOpenRouterService.getProviders).toHaveBeenCalledWith(mockApiKey.key);
      });

      it('should throw NotFoundException when API key not found', async () => {
        apiKeyRepository.findOne = jest.fn().mockResolvedValue(null);

        await expect(service.getOpenRouterProviders('non-existing')).rejects.toThrow(
          new NotFoundException('Clé API introuvable')
        );
      });

      it('should throw BadRequestException when API key is not for OpenRouter', async () => {
        const nonOpenRouterKey = { ...mockApiKey, provider: 'other' };
        apiKeyRepository.findOne = jest.fn().mockResolvedValue(nonOpenRouterKey);

        await expect(service.getOpenRouterProviders('api-key-uuid-1')).rejects.toThrow(
          new BadRequestException('Cette clé API n\'est pas pour OpenRouter')
        );
      });

      it('should throw BadRequestException when API key is inactive', async () => {
        const inactiveKey = { ...mockApiKey, isActive: false };
        apiKeyRepository.findOne = jest.fn().mockResolvedValue(inactiveKey);

        await expect(service.getOpenRouterProviders('api-key-uuid-1')).rejects.toThrow(
          new BadRequestException('Cette clé API est inactive')
        );
      });
    });

    describe('getOpenRouterModelById', () => {
      it('should return model for valid OpenRouter API key', async () => {
        const model = { id: 'model-1', name: 'Test Model' };
        apiKeyRepository.findOne = jest.fn().mockResolvedValue(mockApiKey);
        mockOpenRouterService.getModelById.mockResolvedValue(model);

        const result = await service.getOpenRouterModelById('api-key-uuid-1', 'model-1');

        expect(result).toEqual(model);
        expect(mockOpenRouterService.getModelById).toHaveBeenCalledWith(mockApiKey.key, 'model-1');
      });

      it('should throw NotFoundException when model not found', async () => {
        apiKeyRepository.findOne = jest.fn().mockResolvedValue(mockApiKey);
        mockOpenRouterService.getModelById.mockResolvedValue(null);

        await expect(service.getOpenRouterModelById('api-key-uuid-1', 'non-existing')).rejects.toThrow(
          new NotFoundException('Modèle introuvable')
        );
      });
    });
  });

  describe('API Key Model Configuration Management', () => {
    describe('getApiKeyModelConfig', () => {
      it('should return API key model configuration', async () => {
        const config = { apiKeyId: 'api-key-uuid-1', primaryModel: 'model-1' };
        mockApiKeyModelConfigService.findByApiKeyId.mockResolvedValue(config);

        const result = await service.getApiKeyModelConfig('api-key-uuid-1');

        expect(result).toEqual(config);
        expect(mockApiKeyModelConfigService.findByApiKeyId).toHaveBeenCalledWith('api-key-uuid-1');
      });
    });

    describe('createOrUpdateModelConfig', () => {
      it('should create or update model configuration', async () => {
        const configData = { primaryModel: 'model-1', fallbackModel1: 'model-2' };
        const savedConfig = { apiKeyId: 'api-key-uuid-1', ...configData };

        apiKeyRepository.findOne = jest.fn().mockResolvedValue(mockApiKey);
        mockApiKeyModelConfigService.createOrUpdateConfig.mockResolvedValue(savedConfig);

        const result = await service.createOrUpdateModelConfig('api-key-uuid-1', configData);

        expect(result).toEqual(savedConfig);
        expect(mockApiKeyModelConfigService.createOrUpdateConfig).toHaveBeenCalledWith('api-key-uuid-1', configData);
      });

      it('should throw NotFoundException when API key not found', async () => {
        const configData = { primaryModel: 'model-1' };
        apiKeyRepository.findOne = jest.fn().mockResolvedValue(null);

        await expect(service.createOrUpdateModelConfig('non-existing', configData)).rejects.toThrow(
          new NotFoundException('Clé API introuvable')
        );
      });
    });

    describe('deleteModelConfig', () => {
      it('should delete model configuration', async () => {
        const result = { message: 'Configuration supprimée' };
        mockApiKeyModelConfigService.deleteConfig.mockResolvedValue(result);

        const response = await service.deleteModelConfig('api-key-uuid-1');

        expect(response).toEqual(result);
        expect(mockApiKeyModelConfigService.deleteConfig).toHaveBeenCalledWith('api-key-uuid-1');
      });
    });

    describe('getAllModelConfigs', () => {
      it('should return all model configurations', async () => {
        const configs = [{ apiKeyId: 'api-key-1', primaryModel: 'model-1' }];
        mockApiKeyModelConfigService.getAllConfigs.mockResolvedValue(configs);

        const result = await service.getAllModelConfigs();

        expect(result).toEqual(configs);
        expect(mockApiKeyModelConfigService.getAllConfigs).toHaveBeenCalled();
      });
    });

    describe('getModelConfigStats', () => {
      it('should return model configuration statistics', async () => {
        const stats = { totalConfigs: 5, activeConfigs: 3 };
        mockApiKeyModelConfigService.getModelStats.mockResolvedValue(stats);

        const result = await service.getModelConfigStats();

        expect(result).toEqual(stats);
        expect(mockApiKeyModelConfigService.getModelStats).toHaveBeenCalled();
      });
    });
  });
});