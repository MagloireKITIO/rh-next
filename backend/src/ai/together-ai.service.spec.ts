import { Test, TestingModule } from '@nestjs/testing';
import { TogetherAIService } from './together-ai.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { OpenRouterService } from '../openrouter/openrouter.service';
import { ApiKeyModelConfigService } from '../api-keys/api-key-model-config.service';
import { Logger } from '@nestjs/common';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TogetherAIService', () => {
  let service: TogetherAIService;
  let apiKeysService: ApiKeysService;
  let openRouterService: OpenRouterService;
  let apiKeyModelConfigService: ApiKeyModelConfigService;

  const mockApiKeysService = {
    findActiveWithIds: jest.fn(),
    findActiveByCompanyWithIds: jest.fn(),
    findActiveGlobalWithIds: jest.fn(),
  };

  const mockOpenRouterService = {
    analyzeCV: jest.fn(),
    getAvailableModels: jest.fn(),
  };

  const mockApiKeyModelConfigService = {
    getModelsFallbackOrder: jest.fn(),
    createOrUpdate: jest.fn(),
  };

  const mockApiKeys = [
    { id: 'api-key-1', key: 'sk-test1234567890abcdef' },
    { id: 'api-key-2', key: 'sk-test9876543210fedcba' },
  ];

  beforeEach(async () => {
    // Clear environment variables
    delete process.env.OPENROUTER_API_KEYS;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TogetherAIService,
        {
          provide: ApiKeysService,
          useValue: mockApiKeysService,
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

    service = module.get<TogetherAIService>(TogetherAIService);
    apiKeysService = module.get<ApiKeysService>(ApiKeysService);
    openRouterService = module.get<OpenRouterService>(OpenRouterService);
    apiKeyModelConfigService = module.get<ApiKeyModelConfigService>(ApiKeyModelConfigService);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializeAccounts', () => {
    it('should initialize accounts from database API keys', async () => {
      mockApiKeysService.findActiveWithIds.mockResolvedValue(mockApiKeys);

      await service['initializeAccounts']();

      expect(mockApiKeysService.findActiveWithIds).toHaveBeenCalled();
      expect(service['accounts']).toHaveLength(2);
      expect(service['accounts'][0]).toMatchObject({
        apiKeyId: 'api-key-1',
        apiKey: 'sk-test1234567890abcdef',
        isActive: true,
        requestCount: 0,
        maxRequests: 1000,
      });
    });

    it('should fallback to environment variables when database fails', async () => {
      process.env.OPENROUTER_API_KEYS = 'sk-env1,sk-env2,sk-env3';
      mockApiKeysService.findActiveWithIds.mockRejectedValue(new Error('Database error'));

      await service['initializeAccounts']();

      expect(service['accounts']).toHaveLength(3);
      expect(service['accounts'][0]).toMatchObject({
        apiKeyId: 'env-fallback-0',
        apiKey: 'sk-env1',
        isActive: true,
        requestCount: 0,
        maxRequests: 1000,
      });
    });

    it('should handle empty environment variables', async () => {
      delete process.env.OPENROUTER_API_KEYS;
      mockApiKeysService.findActiveWithIds.mockRejectedValue(new Error('Database error'));

      await service['initializeAccounts']();

      expect(service['accounts']).toHaveLength(0);
    });
  });

  describe('getAccountsForCompany', () => {
    it('should return company-specific API keys when available', async () => {
      const companyId = 'company-uuid-1';
      const companyKeys = [{ id: 'company-key-1', key: 'sk-company123' }];

      mockApiKeysService.findActiveByCompanyWithIds.mockResolvedValue(companyKeys);

      const result = await service['getAccountsForCompany'](companyId);

      expect(mockApiKeysService.findActiveByCompanyWithIds).toHaveBeenCalledWith(companyId);
      expect(result).toHaveLength(1);
      expect(result[0].apiKeyId).toBe('company-key-1');
    });

    it('should fallback to global keys when no company-specific keys', async () => {
      const companyId = 'company-uuid-1';
      const globalKeys = [{ id: 'global-key-1', key: 'sk-global123' }];

      mockApiKeysService.findActiveByCompanyWithIds.mockResolvedValue([]);
      mockApiKeysService.findActiveGlobalWithIds.mockResolvedValue(globalKeys);

      const result = await service['getAccountsForCompany'](companyId);

      expect(mockApiKeysService.findActiveByCompanyWithIds).toHaveBeenCalledWith(companyId);
      expect(mockApiKeysService.findActiveGlobalWithIds).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].apiKeyId).toBe('global-key-1');
    });

    it('should return all active keys when no company specified', async () => {
      mockApiKeysService.findActiveWithIds.mockResolvedValue(mockApiKeys);

      const result = await service['getAccountsForCompany']();

      expect(mockApiKeysService.findActiveWithIds).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return default accounts on database error', async () => {
      const companyId = 'company-uuid-1';
      mockApiKeysService.findActiveByCompanyWithIds.mockRejectedValue(new Error('DB Error'));

      // Set up default accounts
      service['accounts'] = [
        { apiKeyId: 'default-1', apiKey: 'sk-default', isActive: true, requestCount: 0, maxRequests: 1000 }
      ];

      const result = await service['getAccountsForCompany'](companyId);

      expect(result).toEqual(service['accounts']);
    });
  });

  describe('getNextAvailableAccount', () => {
    beforeEach(() => {
      service['accounts'] = [
        { apiKeyId: 'key-1', apiKey: 'sk-1', isActive: true, requestCount: 0, maxRequests: 100 },
        { apiKeyId: 'key-2', apiKey: 'sk-2', isActive: true, requestCount: 50, maxRequests: 100 },
        { apiKeyId: 'key-3', apiKey: 'sk-3', isActive: false, requestCount: 100, maxRequests: 100 },
      ];
      service['currentAccountIndex'] = 0;
    });

    it('should return next available account with rotation', () => {
      const account = service['getNextAvailableAccount']();

      expect(account).toMatchObject({
        apiKeyId: 'key-1',
        isActive: true,
        requestCount: 0,
      });
      expect(service['currentAccountIndex']).toBe(1);
    });

    it('should skip inactive accounts', () => {
      service['currentAccountIndex'] = 2; // Start with inactive account

      const account = service['getNextAvailableAccount']();

      expect(account).toMatchObject({
        apiKeyId: 'key-1',
        isActive: true,
      });
    });

    it('should reset account limits and retry when all accounts exhausted', () => {
      // Make all accounts exhausted
      service['accounts'].forEach(acc => {
        acc.requestCount = acc.maxRequests;
        acc.isActive = false;
        acc.lastUsed = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      });

      const resetSpy = jest.spyOn(service as any, 'resetAccountLimits');
      const account = service['getNextAvailableAccount']();

      expect(resetSpy).toHaveBeenCalled();
      expect(account).toBeTruthy();
      expect(account?.isActive).toBe(true);
    });

    it('should return null when no accounts available after reset', () => {
      // Make all accounts exhausted with recent usage
      service['accounts'].forEach(acc => {
        acc.requestCount = acc.maxRequests;
        acc.isActive = false;
        acc.lastUsed = new Date(); // Just now
      });

      const account = service['getNextAvailableAccount']();

      expect(account).toBeNull();
    });
  });

  describe('markAccountAsUsed', () => {
    it('should increment request count and update last used time', () => {
      const account = {
        apiKeyId: 'key-1',
        apiKey: 'sk-test',
        isActive: true,
        requestCount: 5,
        maxRequests: 100,
        lastUsed: new Date(),
      };

      service['markAccountAsUsed'](account);

      expect(account.requestCount).toBe(6);
      expect(account.lastUsed).toBeInstanceOf(Date);
      expect(account.isActive).toBe(true);
    });

    it('should deactivate account when limit reached', () => {
      const account = {
        apiKeyId: 'key-1',
        apiKey: 'sk-test',
        isActive: true,
        requestCount: 99,
        maxRequests: 100,
      };

      service['markAccountAsUsed'](account);

      expect(account.requestCount).toBe(100);
      expect(account.isActive).toBe(false);
    });
  });

  describe('resetAccountLimits', () => {
    it('should reset accounts after cooldown period', () => {
      const oldDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const recentDate = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

      service['accounts'] = [
        {
          apiKeyId: 'key-1',
          apiKey: 'sk-1',
          isActive: false,
          requestCount: 100,
          maxRequests: 100,
          lastUsed: oldDate,
        },
        {
          apiKeyId: 'key-2',
          apiKey: 'sk-2',
          isActive: false,
          requestCount: 100,
          maxRequests: 100,
          lastUsed: recentDate,
        },
      ];

      service['resetAccountLimits']();

      expect(service['accounts'][0].isActive).toBe(true);
      expect(service['accounts'][0].requestCount).toBe(0);
      expect(service['accounts'][1].isActive).toBe(false);
      expect(service['accounts'][1].requestCount).toBe(100);
    });

    it('should handle accounts without lastUsed date', () => {
      service['accounts'] = [
        {
          apiKeyId: 'key-1',
          apiKey: 'sk-1',
          isActive: false,
          requestCount: 100,
          maxRequests: 100,
        },
      ];

      expect(() => service['resetAccountLimits']()).not.toThrow();
      expect(service['accounts'][0].isActive).toBe(false);
    });
  });

  describe('getConfiguredModels', () => {
    const mockAccount = {
      apiKeyId: 'api-key-1',
      apiKey: 'sk-test',
      isActive: true,
      requestCount: 0,
      maxRequests: 100,
    };

    it('should return configured models when available', async () => {
      const configuredModels = ['gpt-4', 'gpt-3.5-turbo'];
      mockApiKeyModelConfigService.getModelsFallbackOrder.mockResolvedValue(configuredModels);

      const result = await service['getConfiguredModels'](mockAccount);

      expect(mockApiKeyModelConfigService.getModelsFallbackOrder).toHaveBeenCalledWith('api-key-1');
      expect(result).toEqual(configuredModels);
    });

    it('should return default models when no configuration found', async () => {
      mockApiKeyModelConfigService.getModelsFallbackOrder.mockResolvedValue([]);
      const defaultModelsSpy = jest.spyOn(service as any, 'getDefaultModels').mockReturnValue(['claude-3-sonnet']);

      const result = await service['getConfiguredModels'](mockAccount);

      expect(defaultModelsSpy).toHaveBeenCalled();
      expect(result).toEqual(['claude-3-sonnet']);
    });

    it('should handle errors and return default models', async () => {
      mockApiKeyModelConfigService.getModelsFallbackOrder.mockRejectedValue(new Error('Config error'));
      const defaultModelsSpy = jest.spyOn(service as any, 'getDefaultModels').mockReturnValue(['claude-3-sonnet']);

      const result = await service['getConfiguredModels'](mockAccount);

      expect(defaultModelsSpy).toHaveBeenCalled();
      expect(result).toEqual(['claude-3-sonnet']);
    });
  });

  describe('getDefaultModels', () => {
    it('should return array of default models', () => {
      const result = service['getDefaultModels']();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(model => typeof model === 'string')).toBe(true);
    });
  });
});