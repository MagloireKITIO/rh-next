import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

describe('ApiKeysController', () => {
  let controller: ApiKeysController;
  let apiKeysService: jest.Mocked<ApiKeysService>;

  const mockApiKeysService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getStats: jest.fn(),
    findActive: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockApiKey = {
    id: 'api-key-1',
    key: 'sk-1234567890abcdef',
    name: 'Test API Key',
    isActive: true,
    provider: 'together_ai',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeysController],
      providers: [
        {
          provide: ApiKeysService,
          useValue: mockApiKeysService,
        },
      ],
    }).compile();

    controller = module.get<ApiKeysController>(ApiKeysController);
    apiKeysService = module.get(ApiKeysService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new API key', async () => {
      const createApiKeyDto: CreateApiKeyDto = {
        key: 'sk-1234567890abcdef',
        name: 'Test API Key',
        isActive: true,
        provider: 'together_ai',
      };

      apiKeysService.create.mockResolvedValue(mockApiKey as any);

      const result = await controller.create(createApiKeyDto);

      expect(apiKeysService.create).toHaveBeenCalledWith(createApiKeyDto);
      expect(result).toEqual(mockApiKey);
    });

    it('should create API key with minimal data', async () => {
      const createApiKeyDto: CreateApiKeyDto = {
        key: 'sk-1234567890abcdef',
      };

      const expectedApiKey = {
        ...mockApiKey,
        name: null,
        provider: 'together_ai',
      };

      apiKeysService.create.mockResolvedValue(expectedApiKey as any);

      const result = await controller.create(createApiKeyDto);

      expect(apiKeysService.create).toHaveBeenCalledWith(createApiKeyDto);
      expect(result).toEqual(expectedApiKey);
    });
  });

  describe('findAll', () => {
    it('should return all API keys', async () => {
      const mockApiKeys = [mockApiKey, { ...mockApiKey, id: 'api-key-2', name: 'Another Key' }];
      apiKeysService.findAll.mockResolvedValue(mockApiKeys as any);

      const result = await controller.findAll();

      expect(apiKeysService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockApiKeys);
    });

    it('should return empty array when no API keys exist', async () => {
      apiKeysService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(apiKeysService.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return API keys statistics', async () => {
      const mockStats = {
        total: 5,
        active: 4,
        inactive: 1,
        byProvider: {
          together_ai: 3,
          openai: 2,
        },
      };
      apiKeysService.getStats.mockResolvedValue(mockStats as any);

      const result = await controller.getStats();

      expect(apiKeysService.getStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('findActive', () => {
    it('should return only active API keys', async () => {
      const mockActiveKeys = [mockApiKey];
      apiKeysService.findActive.mockResolvedValue(mockActiveKeys as any);

      const result = await controller.findActive();

      expect(apiKeysService.findActive).toHaveBeenCalled();
      expect(result).toEqual(mockActiveKeys);
    });
  });

  describe('findOne', () => {
    it('should return a specific API key', async () => {
      apiKeysService.findOne.mockResolvedValue(mockApiKey as any);

      const result = await controller.findOne('api-key-1');

      expect(apiKeysService.findOne).toHaveBeenCalledWith('api-key-1');
      expect(result).toEqual(mockApiKey);
    });

    it('should handle non-existent API key', async () => {
      apiKeysService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('non-existent-id');

      expect(apiKeysService.findOne).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an API key', async () => {
      const updateApiKeyDto: UpdateApiKeyDto = {
        name: 'Updated API Key',
        isActive: false,
      };

      const updatedApiKey = {
        ...mockApiKey,
        name: 'Updated API Key',
        isActive: false,
      };

      apiKeysService.update.mockResolvedValue(updatedApiKey as any);

      const result = await controller.update('api-key-1', updateApiKeyDto);

      expect(apiKeysService.update).toHaveBeenCalledWith('api-key-1', updateApiKeyDto);
      expect(result).toEqual(updatedApiKey);
    });

    it('should update only name', async () => {
      const updateApiKeyDto: UpdateApiKeyDto = {
        name: 'New Name Only',
      };

      const updatedApiKey = {
        ...mockApiKey,
        name: 'New Name Only',
      };

      apiKeysService.update.mockResolvedValue(updatedApiKey as any);

      const result = await controller.update('api-key-1', updateApiKeyDto);

      expect(apiKeysService.update).toHaveBeenCalledWith('api-key-1', updateApiKeyDto);
      expect(result).toEqual(updatedApiKey);
    });

    it('should update only isActive status', async () => {
      const updateApiKeyDto: UpdateApiKeyDto = {
        isActive: false,
      };

      const updatedApiKey = {
        ...mockApiKey,
        isActive: false,
      };

      apiKeysService.update.mockResolvedValue(updatedApiKey as any);

      const result = await controller.update('api-key-1', updateApiKeyDto);

      expect(apiKeysService.update).toHaveBeenCalledWith('api-key-1', updateApiKeyDto);
      expect(result).toEqual(updatedApiKey);
    });
  });

  describe('remove', () => {
    it('should remove an API key', async () => {
      apiKeysService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('api-key-1');

      expect(apiKeysService.remove).toHaveBeenCalledWith('api-key-1');
      expect(result).toBeUndefined();
    });
  });

  describe('toggleStatus', () => {
    it('should toggle API key status from active to inactive', async () => {
      const activeApiKey = { ...mockApiKey, isActive: true };
      const inactiveApiKey = { ...mockApiKey, isActive: false };

      apiKeysService.findOne.mockResolvedValue(activeApiKey as any);
      apiKeysService.update.mockResolvedValue(inactiveApiKey as any);

      const result = await controller.toggleStatus('api-key-1');

      expect(apiKeysService.findOne).toHaveBeenCalledWith('api-key-1');
      expect(apiKeysService.update).toHaveBeenCalledWith('api-key-1', { isActive: false });
      expect(result).toEqual(inactiveApiKey);
    });

    it('should toggle API key status from inactive to active', async () => {
      const inactiveApiKey = { ...mockApiKey, isActive: false };
      const activeApiKey = { ...mockApiKey, isActive: true };

      apiKeysService.findOne.mockResolvedValue(inactiveApiKey as any);
      apiKeysService.update.mockResolvedValue(activeApiKey as any);

      const result = await controller.toggleStatus('api-key-1');

      expect(apiKeysService.findOne).toHaveBeenCalledWith('api-key-1');
      expect(apiKeysService.update).toHaveBeenCalledWith('api-key-1', { isActive: true });
      expect(result).toEqual(activeApiKey);
    });
  });
});