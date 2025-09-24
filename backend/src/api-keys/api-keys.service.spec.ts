import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysService } from './api-keys.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let apiKeyRepository: Repository<ApiKey>;

  const mockApiKey = {
    id: 'api-key-uuid-1',
    name: 'Test API Key',
    key: 'sk-test-1234567890abcdef',
    provider: 'openrouter',
    model: 'gpt-4',
    isActive: true,
    requestCount: 0,
    monthlyLimit: 1000,
    usage: 0,
    company_id: 'company-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGlobalApiKey = {
    id: 'api-key-uuid-2',
    name: 'Global API Key',
    key: 'sk-global-1234567890abcdef',
    provider: 'openrouter',
    model: 'gpt-3.5-turbo',
    isActive: true,
    requestCount: 5,
    monthlyLimit: 2000,
    usage: 25,
    company_id: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApiKeyRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    increment: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: getRepositoryToken(ApiKey),
          useValue: mockApiKeyRepository,
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    apiKeyRepository = module.get<Repository<ApiKey>>(getRepositoryToken(ApiKey));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createApiKeyDto: CreateApiKeyDto = {
      key: 'sk-test-1234567890abcdef',
      name: 'Test API Key',
      provider: 'openrouter',
      isActive: true,
    };

    it('should create API key successfully', async () => {
      mockApiKeyRepository.findOne.mockResolvedValue(null); // No existing key
      mockApiKeyRepository.create.mockReturnValue(mockApiKey);
      mockApiKeyRepository.save.mockResolvedValue(mockApiKey);

      const result = await service.create(createApiKeyDto);

      expect(mockApiKeyRepository.findOne).toHaveBeenCalledWith({
        where: { key: createApiKeyDto.key }
      });
      expect(mockApiKeyRepository.create).toHaveBeenCalledWith(createApiKeyDto);
      expect(mockApiKeyRepository.save).toHaveBeenCalledWith(mockApiKey);
      expect(result).toEqual(expect.not.objectContaining({ key: expect.any(String) }));
      expect(result.id).toBe(mockApiKey.id);
      expect(result.name).toBe(mockApiKey.name);
    });

    it('should throw ConflictException when API key already exists', async () => {
      mockApiKeyRepository.findOne.mockResolvedValue(mockApiKey);

      await expect(service.create(createApiKeyDto)).rejects.toThrow(
        new ConflictException('This API key already exists')
      );

      expect(mockApiKeyRepository.create).not.toHaveBeenCalled();
      expect(mockApiKeyRepository.save).not.toHaveBeenCalled();
    });

    it('should create global API key without company_id', async () => {
      const globalCreateDto = { ...createApiKeyDto, company_id: undefined };
      const globalApiKey = { ...mockApiKey, company_id: null };

      mockApiKeyRepository.findOne.mockResolvedValue(null);
      mockApiKeyRepository.create.mockReturnValue(globalApiKey);
      mockApiKeyRepository.save.mockResolvedValue(globalApiKey);

      const result = await service.create(globalCreateDto);

      expect(result).toEqual(expect.objectContaining({
        id: globalApiKey.id,
        name: globalApiKey.name,
      }));
      expect(result).not.toHaveProperty('key');
    });
  });

  describe('findAll', () => {
    it('should return all API keys without exposing keys', async () => {
      const apiKeys = [mockApiKey, mockGlobalApiKey];
      mockApiKeyRepository.find.mockResolvedValue(apiKeys);

      const result = await service.findAll();

      expect(mockApiKeyRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('key');
      expect(result[1]).not.toHaveProperty('key');
      expect(result[0].id).toBe(mockApiKey.id);
      expect(result[1].id).toBe(mockGlobalApiKey.id);
    });

    it('should return empty array when no API keys exist', async () => {
      mockApiKeyRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findActive', () => {
    it('should return active API keys ordered by usage', async () => {
      const activeKeys = [mockApiKey, mockGlobalApiKey];
      mockApiKeyRepository.find.mockResolvedValue(activeKeys);

      const result = await service.findActive();

      expect(mockApiKeyRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        select: ['key'],
        order: { requestCount: 'ASC' },
      });
      expect(result).toEqual([mockApiKey.key, mockGlobalApiKey.key]);
    });

    it('should return empty array when no active keys exist', async () => {
      mockApiKeyRepository.find.mockResolvedValue([]);

      const result = await service.findActive();

      expect(result).toEqual([]);
    });
  });

  describe('findActiveByCompany', () => {
    it('should return active API keys for specific company', async () => {
      const companyKeys = [mockApiKey];
      mockApiKeyRepository.find.mockResolvedValue(companyKeys);

      const result = await service.findActiveByCompany('company-uuid-1');

      expect(mockApiKeyRepository.find).toHaveBeenCalledWith({
        where: {
          isActive: true,
          company_id: 'company-uuid-1'
        },
        select: ['key'],
        order: { requestCount: 'ASC' },
      });
      expect(result).toEqual([mockApiKey.key]);
    });

    it('should return empty array when company has no active keys', async () => {
      mockApiKeyRepository.find.mockResolvedValue([]);

      const result = await service.findActiveByCompany('company-uuid-2');

      expect(result).toEqual([]);
    });
  });

  describe('findActiveGlobal', () => {
    it('should return active global API keys', async () => {
      const globalKeys = [mockGlobalApiKey];
      mockApiKeyRepository.find.mockResolvedValue(globalKeys);

      const result = await service.findActiveGlobal();

      expect(mockApiKeyRepository.find).toHaveBeenCalledWith({
        where: {
          isActive: true,
          company_id: null
        },
        select: ['key'],
        order: { requestCount: 'ASC' },
      });
      expect(result).toEqual([mockGlobalApiKey.key]);
    });
  });

  describe('findActiveWithIds', () => {
    it('should return active API keys with IDs', async () => {
      const activeKeys = [
        { id: mockApiKey.id, key: mockApiKey.key },
        { id: mockGlobalApiKey.id, key: mockGlobalApiKey.key },
      ];
      mockApiKeyRepository.find.mockResolvedValue(activeKeys);

      const result = await service.findActiveWithIds();

      expect(mockApiKeyRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        select: ['id', 'key'],
        order: { requestCount: 'ASC' },
      });
      expect(result).toEqual([
        { id: mockApiKey.id, key: mockApiKey.key },
        { id: mockGlobalApiKey.id, key: mockGlobalApiKey.key },
      ]);
    });
  });

  describe('findActiveByCompanyWithIds', () => {
    it('should return active company API keys with IDs', async () => {
      const companyKeys = [{ id: mockApiKey.id, key: mockApiKey.key }];
      mockApiKeyRepository.find.mockResolvedValue(companyKeys);

      const result = await service.findActiveByCompanyWithIds('company-uuid-1');

      expect(mockApiKeyRepository.find).toHaveBeenCalledWith({
        where: {
          isActive: true,
          company_id: 'company-uuid-1'
        },
        select: ['id', 'key'],
        order: { requestCount: 'ASC' },
      });
      expect(result).toEqual([{ id: mockApiKey.id, key: mockApiKey.key }]);
    });
  });

  describe('findActiveGlobalWithIds', () => {
    it('should return active global API keys with IDs', async () => {
      const globalKeys = [{ id: mockGlobalApiKey.id, key: mockGlobalApiKey.key }];
      mockApiKeyRepository.find.mockResolvedValue(globalKeys);

      const result = await service.findActiveGlobalWithIds();

      expect(mockApiKeyRepository.find).toHaveBeenCalledWith({
        where: {
          isActive: true,
          company_id: null
        },
        select: ['id', 'key'],
        order: { requestCount: 'ASC' },
      });
      expect(result).toEqual([{ id: mockGlobalApiKey.id, key: mockGlobalApiKey.key }]);
    });
  });

  describe('update', () => {
    const updateApiKeyDto: UpdateApiKeyDto = {
      name: 'Updated API Key',
      isActive: false,
    };

    it('should update API key successfully', async () => {
      const updatedApiKey = { ...mockApiKey, ...updateApiKeyDto };

      mockApiKeyRepository.findOne
        .mockResolvedValueOnce(mockApiKey)
        .mockResolvedValueOnce(updatedApiKey);
      mockApiKeyRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('api-key-uuid-1', updateApiKeyDto);

      expect(mockApiKeyRepository.update).toHaveBeenCalledWith('api-key-uuid-1', updateApiKeyDto);
      expect(result).toEqual(expect.not.objectContaining({ key: expect.any(String) }));
      expect(result.name).toBe(updateApiKeyDto.name);
    });

    it('should throw NotFoundException when API key not found', async () => {
      mockApiKeyRepository.findOne.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateApiKeyDto)).rejects.toThrow(
        new NotFoundException('API key with ID invalid-id not found')
      );
    });
  });


  describe('remove', () => {
    it('should delete API key successfully', async () => {
      mockApiKeyRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('api-key-uuid-1');

      expect(mockApiKeyRepository.delete).toHaveBeenCalledWith('api-key-uuid-1');
    });

    it('should throw NotFoundException when API key not found', async () => {
      mockApiKeyRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('invalid-id')).rejects.toThrow(
        new NotFoundException('API key with ID invalid-id not found')
      );
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage and request count', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      mockApiKeyRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.incrementUsage('sk-test-1234567890abcdef');

      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        requestCount: expect.any(Function),
        lastUsedAt: expect.any(Date)
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('key = :key', { key: 'sk-test-1234567890abcdef' });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should handle multiple calls', async () => {
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      mockApiKeyRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.incrementUsage('sk-test-1234567890abcdef');

      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return API keys statistics', async () => {
      mockApiKeyRepository.count
        .mockResolvedValueOnce(7)  // total
        .mockResolvedValueOnce(5); // active

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ totalRequests: '365' })
      };
      mockApiKeyRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getStats();

      expect(result).toEqual({
        total: 7,
        active: 5,
        inactive: 2,
        totalRequests: 365,
      });
    });

    it('should handle empty statistics', async () => {
      mockApiKeyRepository.count
        .mockResolvedValueOnce(0)  // total
        .mockResolvedValueOnce(0); // active

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ totalRequests: null })
      };
      mockApiKeyRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getStats();

      expect(result).toEqual({
        total: 0,
        active: 0,
        inactive: 0,
        totalRequests: 0,
      });
    });
  });
});