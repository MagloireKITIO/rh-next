import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { Configuration } from './entities/configuration.entity';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';

describe('ConfigurationService', () => {
  let service: ConfigurationService;
  let repository: jest.Mocked<Repository<Configuration>>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        {
          provide: getRepositoryToken(Configuration),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ConfigurationService>(ConfigurationService);
    repository = module.get(getRepositoryToken(Configuration));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new configuration', async () => {
      const createDto: CreateConfigurationDto = {
        key: 'TEST_KEY',
        value: 'test value',
        description: 'Test configuration',
        isActive: true,
      };

      const mockConfig = { id: '1', ...createDto };

      repository.create.mockReturnValue(mockConfig as any);
      repository.save.mockResolvedValue(mockConfig as any);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockConfig);
      expect(result).toEqual(mockConfig);
    });

    it('should handle database errors during creation', async () => {
      const createDto: CreateConfigurationDto = {
        key: 'TEST_KEY',
        value: 'test value',
        isActive: true,
      };

      const error = new Error('Database error');
      repository.save.mockRejectedValue(error);
      repository.create.mockReturnValue({} as any);

      await expect(service.create(createDto)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all configurations ordered by key', async () => {
      const mockConfigs = [
        { id: '1', key: 'A_KEY', value: 'value1', isActive: true },
        { id: '2', key: 'B_KEY', value: 'value2', isActive: true },
      ];

      repository.find.mockResolvedValue(mockConfigs as any);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: { key: 'ASC' },
      });
      expect(result).toEqual(mockConfigs);
    });

    it('should return empty array when no configurations exist', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByKey', () => {
    it('should find configuration by key when active', async () => {
      const mockConfig = {
        id: '1',
        key: 'TEST_KEY',
        value: 'test value',
        isActive: true,
      };

      repository.findOne.mockResolvedValue(mockConfig as any);

      const result = await service.findByKey('TEST_KEY');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { key: 'TEST_KEY', isActive: true },
      });
      expect(result).toEqual(mockConfig);
    });

    it('should return null when configuration not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByKey('NONEXISTENT_KEY');

      expect(result).toBeNull();
    });

    it('should return null when configuration is inactive', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByKey('INACTIVE_KEY');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { key: 'INACTIVE_KEY', isActive: true },
      });
      expect(result).toBeNull();
    });
  });

  describe('getValue', () => {
    it('should return value when configuration exists', async () => {
      const mockConfig = {
        id: '1',
        key: 'TEST_KEY',
        value: 'test value',
        isActive: true,
      };

      repository.findOne.mockResolvedValue(mockConfig as any);

      const result = await service.getValue('TEST_KEY');

      expect(result).toBe('test value');
    });

    it('should return null when configuration does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getValue('NONEXISTENT_KEY');

      expect(result).toBeNull();
    });
  });

  describe('setValue', () => {
    it('should update existing configuration', async () => {
      const existingConfig = {
        id: '1',
        key: 'TEST_KEY',
        value: 'old value',
        isActive: true,
      };

      const updatedConfig = {
        ...existingConfig,
        value: 'new value',
        description: 'updated description',
      };

      repository.findOne
        .mockResolvedValueOnce(existingConfig as any) // First call in setValue
        .mockResolvedValueOnce(updatedConfig as any); // Second call after update

      repository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.setValue('TEST_KEY', 'new value', 'updated description');

      expect(repository.update).toHaveBeenCalledWith('1', {
        value: 'new value',
        description: 'updated description',
      });
      expect(result).toEqual(updatedConfig);
    });

    it('should create new configuration when it does not exist', async () => {
      const newConfig = {
        id: '1',
        key: 'NEW_KEY',
        value: 'new value',
        description: 'new description',
        isActive: true,
      };

      repository.findOne.mockResolvedValue(null); // Configuration doesn't exist
      repository.create.mockReturnValue(newConfig as any);
      repository.save.mockResolvedValue(newConfig as any);

      const result = await service.setValue('NEW_KEY', 'new value', 'new description');

      expect(repository.create).toHaveBeenCalledWith({
        key: 'NEW_KEY',
        value: 'new value',
        description: 'new description',
        isActive: true,
      });
      expect(result).toEqual(newConfig);
    });

    it('should handle case when description is not provided', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({} as any);
      repository.save.mockResolvedValue({} as any);

      await service.setValue('TEST_KEY', 'test value');

      expect(repository.create).toHaveBeenCalledWith({
        key: 'TEST_KEY',
        value: 'test value',
        description: undefined,
        isActive: true,
      });
    });
  });

  describe('update', () => {
    it('should update configuration successfully', async () => {
      const updateDto: UpdateConfigurationDto = {
        value: 'updated value',
        description: 'updated description',
      };

      const updatedConfig = {
        id: '1',
        key: 'TEST_KEY',
        value: 'updated value',
        description: 'updated description',
        isActive: true,
      };

      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValue(updatedConfig as any);

      const result = await service.update('1', updateDto);

      expect(repository.update).toHaveBeenCalledWith('1', updateDto);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(updatedConfig);
    });

    it('should throw NotFoundException when configuration not found after update', async () => {
      const updateDto: UpdateConfigurationDto = {
        value: 'updated value',
      };

      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(
        new NotFoundException('Configuration with ID nonexistent not found')
      );
    });
  });

  describe('remove', () => {
    it('should remove configuration successfully', async () => {
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove('1');

      expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when configuration not found', async () => {
      repository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        new NotFoundException('Configuration with ID nonexistent not found')
      );
    });
  });

  describe('getAIConfiguration', () => {
    it('should return AI configuration with multiple keys', async () => {
      repository.findOne
        .mockResolvedValueOnce({
          key: 'TOGETHER_AI_KEYS',
          value: 'key1,key2,key3',
          isActive: true,
        } as any)
        .mockResolvedValueOnce({
          key: 'DEFAULT_AI_PROMPT',
          value: 'Custom prompt',
          isActive: true,
        } as any);

      const result = await service.getAIConfiguration();

      expect(result).toEqual({
        togetherAiKeys: 3,
        hasDefaultPrompt: true,
        defaultPrompt: 'Custom prompt',
      });
    });

    it('should return AI configuration with no keys', async () => {
      repository.findOne
        .mockResolvedValueOnce(null) // No TOGETHER_AI_KEYS
        .mockResolvedValueOnce(null); // No DEFAULT_AI_PROMPT

      const result = await service.getAIConfiguration();

      expect(result).toEqual({
        togetherAiKeys: 0,
        hasDefaultPrompt: false,
        defaultPrompt: expect.stringContaining('You are an expert HR recruiter'),
      });
    });

    it('should use default prompt when custom prompt not found', async () => {
      repository.findOne
        .mockResolvedValueOnce({
          key: 'TOGETHER_AI_KEYS',
          value: 'key1',
          isActive: true,
        } as any)
        .mockResolvedValueOnce(null); // No DEFAULT_AI_PROMPT

      const result = await service.getAIConfiguration();

      expect(result.defaultPrompt).toContain('You are an expert HR recruiter');
      expect(result.hasDefaultPrompt).toBe(false);
    });
  });

  describe('getPrivacyPolicyConfiguration', () => {
    it('should return privacy policy configuration when enabled', async () => {
      repository.findOne
        .mockResolvedValueOnce({
          key: 'privacy_policy_enabled',
          value: 'true',
          isActive: true,
        } as any)
        .mockResolvedValueOnce({
          key: 'privacy_policy_file_url',
          value: 'https://example.com/privacy.pdf',
          isActive: true,
        } as any)
        .mockResolvedValueOnce({
          key: 'privacy_policy_file_name',
          value: 'privacy-policy.pdf',
          isActive: true,
        } as any);

      const result = await service.getPrivacyPolicyConfiguration();

      expect(result).toEqual({
        enabled: true,
        fileUrl: 'https://example.com/privacy.pdf',
        fileName: 'privacy-policy.pdf',
        hasFile: true,
      });
    });

    it('should return privacy policy configuration when disabled', async () => {
      repository.findOne
        .mockResolvedValueOnce({
          key: 'privacy_policy_enabled',
          value: 'false',
          isActive: true,
        } as any)
        .mockResolvedValueOnce(null) // No file URL
        .mockResolvedValueOnce(null); // No file name

      const result = await service.getPrivacyPolicyConfiguration();

      expect(result).toEqual({
        enabled: false,
        fileUrl: null,
        fileName: null,
        hasFile: false,
      });
    });

    it('should handle partial privacy policy configuration', async () => {
      repository.findOne
        .mockResolvedValueOnce({
          key: 'privacy_policy_enabled',
          value: 'true',
          isActive: true,
        } as any)
        .mockResolvedValueOnce({
          key: 'privacy_policy_file_url',
          value: 'https://example.com/privacy.pdf',
          isActive: true,
        } as any)
        .mockResolvedValueOnce(null); // No file name

      const result = await service.getPrivacyPolicyConfiguration();

      expect(result).toEqual({
        enabled: true,
        fileUrl: 'https://example.com/privacy.pdf',
        fileName: null,
        hasFile: false, // Because both URL and name are required
      });
    });
  });

  describe('setPrivacyPolicyFile', () => {
    it('should set privacy policy file URL and name', async () => {
      const mockConfig = { id: '1', key: 'test', value: 'test', isActive: true };

      repository.findOne.mockResolvedValue(null); // Config doesn't exist
      repository.create.mockReturnValue(mockConfig as any);
      repository.save.mockResolvedValue(mockConfig as any);

      await service.setPrivacyPolicyFile('https://example.com/privacy.pdf', 'privacy-policy.pdf');

      expect(repository.create).toHaveBeenCalledTimes(2);
      expect(repository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('setPrivacyPolicyEnabled', () => {
    it('should enable privacy policy', async () => {
      const mockConfig = { id: '1', key: 'privacy_policy_enabled', value: 'true', isActive: true };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockConfig as any);
      repository.save.mockResolvedValue(mockConfig as any);

      await service.setPrivacyPolicyEnabled(true);

      expect(repository.create).toHaveBeenCalledWith({
        key: 'privacy_policy_enabled',
        value: 'true',
        description: undefined,
        isActive: true,
      });
    });

    it('should disable privacy policy', async () => {
      const mockConfig = { id: '1', key: 'privacy_policy_enabled', value: 'false', isActive: true };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockConfig as any);
      repository.save.mockResolvedValue(mockConfig as any);

      await service.setPrivacyPolicyEnabled(false);

      expect(repository.create).toHaveBeenCalledWith({
        key: 'privacy_policy_enabled',
        value: 'false',
        description: undefined,
        isActive: true,
      });
    });
  });

  describe('deletePrivacyPolicyFile', () => {
    it('should clear privacy policy file configuration', async () => {
      const mockConfig = { id: '1', key: 'test', value: '', isActive: true };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockConfig as any);
      repository.save.mockResolvedValue(mockConfig as any);

      await service.deletePrivacyPolicyFile();

      expect(repository.create).toHaveBeenCalledTimes(3);
      expect(repository.save).toHaveBeenCalledTimes(3);
    });
  });

  describe('initializeDefaultConfigurations', () => {
    it('should create default configurations when they do not exist', async () => {
      repository.findOne.mockResolvedValue(null); // No existing configs
      repository.create.mockReturnValue({} as any);
      repository.save.mockResolvedValue({} as any);

      await service.initializeDefaultConfigurations();

      expect(repository.create).toHaveBeenCalledTimes(7); // 7 default configs
      expect(repository.save).toHaveBeenCalledTimes(7);

      // Verify specific default configurations
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'DEFAULT_AI_PROMPT',
          isActive: true,
        })
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'MAX_UPLOAD_SIZE',
          value: '10485760',
          isActive: true,
        })
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'SUPPORTED_FILE_TYPES',
          value: 'pdf',
          isActive: true,
        })
      );
    });

    it('should not create configurations that already exist', async () => {
      const existingConfig = {
        id: '1',
        key: 'DEFAULT_AI_PROMPT',
        value: 'existing prompt',
        isActive: true,
      };

      repository.findOne
        .mockResolvedValueOnce(existingConfig as any) // First config exists
        .mockResolvedValue(null); // Others don't exist

      repository.create.mockReturnValue({} as any);
      repository.save.mockResolvedValue({} as any);

      await service.initializeDefaultConfigurations();

      expect(repository.create).toHaveBeenCalledTimes(6); // 6 configs created (1 already exists)
      expect(repository.save).toHaveBeenCalledTimes(6);
    });

    it('should handle errors during initialization gracefully', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({} as any);
      repository.save
        .mockResolvedValueOnce({} as any) // First save succeeds
        .mockRejectedValueOnce(new Error('Database error')) // Second save fails
        .mockResolvedValue({} as any); // Remaining saves succeed

      // Should not throw error, but continue with other configurations
      await expect(service.initializeDefaultConfigurations()).rejects.toThrow('Database error');
    });
  });

  describe('Default Prompt', () => {
    it('should return a comprehensive default prompt', () => {
      // Access private method through service instance
      const defaultPrompt = (service as any).getDefaultPrompt();

      expect(defaultPrompt).toContain('HR recruiter');
      expect(defaultPrompt).toContain('score');
      expect(defaultPrompt).toContain('skills');
      expect(defaultPrompt).toContain('experience');
      expect(defaultPrompt).toContain('education');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty string values correctly', async () => {
      const configWithEmptyValue = {
        id: '1',
        key: 'EMPTY_KEY',
        value: '',
        isActive: true,
      };

      repository.findOne.mockResolvedValue(configWithEmptyValue as any);

      const result = await service.getValue('EMPTY_KEY');

      expect(result).toBe('');
    });

    it('should handle null values in database gracefully', async () => {
      const configWithNullValue = {
        id: '1',
        key: 'NULL_KEY',
        value: null,
        isActive: true,
      };

      repository.findOne.mockResolvedValue(configWithNullValue as any);

      const result = await service.getValue('NULL_KEY');

      expect(result).toBeNull();
    });

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed');
      repository.find.mockRejectedValue(dbError);

      await expect(service.findAll()).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid configuration keys', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByKey('');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { key: '', isActive: true },
      });
      expect(result).toBeNull();
    });

    it('should handle very long configuration values', async () => {
      const longValue = 'a'.repeat(10000);
      const createDto: CreateConfigurationDto = {
        key: 'LONG_VALUE_KEY',
        value: longValue,
        isActive: true,
      };

      const mockConfig = { id: '1', ...createDto };
      repository.create.mockReturnValue(mockConfig as any);
      repository.save.mockResolvedValue(mockConfig as any);

      const result = await service.create(createDto);

      expect(result.value).toBe(longValue);
    });
  });
});