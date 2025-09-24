import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationController } from './configuration.controller';
import { ConfigurationService } from './configuration.service';
import { StorageService } from '../storage/storage.service';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('ConfigurationController', () => {
  let controller: ConfigurationController;
  let configurationService: jest.Mocked<ConfigurationService>;
  let storageService: jest.Mocked<StorageService>;

  const mockConfigurationService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getAIConfiguration: jest.fn(),
    findByKey: jest.fn(),
    setValue: jest.fn(),
    initializeDefaultConfigurations: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getPrivacyPolicyConfiguration: jest.fn(),
    setPrivacyPolicyFile: jest.fn(),
    setPrivacyPolicyEnabled: jest.fn(),
    deletePrivacyPolicyFile: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockConfiguration = {
    id: 'config-1',
    key: 'test_key',
    value: 'test_value',
    description: 'Test configuration',
    isActive: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigurationController],
      providers: [
        {
          provide: ConfigurationService,
          useValue: mockConfigurationService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ConfigurationController>(ConfigurationController);
    configurationService = module.get(ConfigurationService);
    storageService = module.get(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new configuration', async () => {
      const createConfigurationDto: CreateConfigurationDto = {
        key: 'test_key',
        value: 'test_value',
        description: 'Test configuration',
        isActive: true,
      };

      configurationService.create.mockResolvedValue(mockConfiguration as any);

      const result = await controller.create(createConfigurationDto);

      expect(configurationService.create).toHaveBeenCalledWith(createConfigurationDto);
      expect(result).toEqual(mockConfiguration);
    });
  });

  describe('findAll', () => {
    it('should return all configurations', async () => {
      const mockConfigurations = [mockConfiguration, { ...mockConfiguration, id: 'config-2' }];
      configurationService.findAll.mockResolvedValue(mockConfigurations as any);

      const result = await controller.findAll();

      expect(configurationService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockConfigurations);
    });
  });

  describe('getAIConfiguration', () => {
    it('should return AI configuration', async () => {
      const mockAIConfig = {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        apiKey: 'sk-***',
      };
      configurationService.getAIConfiguration.mockResolvedValue(mockAIConfig as any);

      const result = await controller.getAIConfiguration();

      expect(configurationService.getAIConfiguration).toHaveBeenCalled();
      expect(result).toEqual(mockAIConfig);
    });
  });

  describe('findByKey', () => {
    it('should return configuration by key', async () => {
      configurationService.findByKey.mockResolvedValue(mockConfiguration as any);

      const result = await controller.findByKey('test_key');

      expect(configurationService.findByKey).toHaveBeenCalledWith('test_key');
      expect(result).toEqual(mockConfiguration);
    });

    it('should handle non-existent key', async () => {
      configurationService.findByKey.mockResolvedValue(null);

      const result = await controller.findByKey('non_existent_key');

      expect(configurationService.findByKey).toHaveBeenCalledWith('non_existent_key');
      expect(result).toBeNull();
    });
  });

  describe('setValue', () => {
    it('should set configuration value with description', async () => {
      const updatedConfig = { ...mockConfiguration, value: 'new_value' };
      configurationService.setValue.mockResolvedValue(updatedConfig as any);

      const body = {
        key: 'test_key',
        value: 'new_value',
        description: 'Updated description',
      };

      const result = await controller.setValue(body);

      expect(configurationService.setValue).toHaveBeenCalledWith(
        'test_key',
        'new_value',
        'Updated description'
      );
      expect(result).toEqual(updatedConfig);
    });

    it('should set configuration value without description', async () => {
      const updatedConfig = { ...mockConfiguration, value: 'new_value' };
      configurationService.setValue.mockResolvedValue(updatedConfig as any);

      const body = {
        key: 'test_key',
        value: 'new_value',
      };

      const result = await controller.setValue(body);

      expect(configurationService.setValue).toHaveBeenCalledWith(
        'test_key',
        'new_value',
        undefined
      );
      expect(result).toEqual(updatedConfig);
    });
  });

  describe('initializeDefaults', () => {
    it('should initialize default configurations', async () => {
      const mockResult = { initialized: true, count: 5 };
      configurationService.initializeDefaultConfigurations.mockResolvedValue(mockResult as any);

      const result = await controller.initializeDefaults();

      expect(configurationService.initializeDefaultConfigurations).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('update', () => {
    it('should update configuration', async () => {
      const updateConfigurationDto: UpdateConfigurationDto = {
        value: 'updated_value',
        description: 'Updated description',
      };

      const updatedConfig = { ...mockConfiguration, ...updateConfigurationDto };
      configurationService.update.mockResolvedValue(updatedConfig as any);

      const result = await controller.update('config-1', updateConfigurationDto);

      expect(configurationService.update).toHaveBeenCalledWith('config-1', updateConfigurationDto);
      expect(result).toEqual(updatedConfig);
    });
  });

  describe('remove', () => {
    it('should remove configuration', async () => {
      configurationService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('config-1');

      expect(configurationService.remove).toHaveBeenCalledWith('config-1');
      expect(result).toBeUndefined();
    });
  });

  describe('getPrivacyPolicyConfiguration', () => {
    it('should return privacy policy configuration', async () => {
      const mockPrivacyConfig = {
        enabled: true,
        fileUrl: 'https://storage.example.com/privacy-policy.pdf',
        fileName: 'privacy-policy.pdf',
      };
      configurationService.getPrivacyPolicyConfiguration.mockResolvedValue(mockPrivacyConfig as any);

      const result = await controller.getPrivacyPolicyConfiguration();

      expect(configurationService.getPrivacyPolicyConfiguration).toHaveBeenCalled();
      expect(result).toEqual(mockPrivacyConfig);
    });
  });

  describe('uploadPrivacyPolicy', () => {
    const mockFile: Partial<Express.Multer.File> = {
      buffer: Buffer.from('pdf content'),
      originalname: 'privacy-policy.pdf',
      mimetype: 'application/pdf',
      size: 1024 * 1024, // 1MB
    };

    it('should upload privacy policy successfully', async () => {
      const fileUrl = 'https://storage.example.com/privacy-policy.pdf';
      storageService.uploadFile.mockResolvedValue(fileUrl);
      configurationService.setPrivacyPolicyFile.mockResolvedValue(undefined);

      const result = await controller.uploadPrivacyPolicy(mockFile as Express.Multer.File);

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        mockFile.buffer,
        mockFile.originalname,
        mockFile.mimetype,
        'offer'
      );
      expect(configurationService.setPrivacyPolicyFile).toHaveBeenCalledWith(
        fileUrl,
        mockFile.originalname
      );
      expect(result).toEqual({
        success: true,
        fileUrl,
        fileName: 'privacy-policy.pdf',
        message: 'Politique de confidentialité téléchargée avec succès',
      });
    });

    it('should throw error when no file provided', async () => {
      await expect(controller.uploadPrivacyPolicy(undefined)).rejects.toThrow(
        'Aucun fichier fourni'
      );
    });

    it('should throw error for non-PDF files', async () => {
      const nonPdfFile = { ...mockFile, mimetype: 'text/plain' };

      await expect(
        controller.uploadPrivacyPolicy(nonPdfFile as Express.Multer.File)
      ).rejects.toThrow('Seuls les fichiers PDF sont autorisés');
    });

    it('should throw error for files too large', async () => {
      const largeFile = { ...mockFile, size: 15 * 1024 * 1024 }; // 15MB

      await expect(
        controller.uploadPrivacyPolicy(largeFile as Express.Multer.File)
      ).rejects.toThrow('Le fichier est trop volumineux (max 10MB)');
    });

    it('should handle upload errors', async () => {
      storageService.uploadFile.mockRejectedValue(new Error('Storage error'));

      await expect(
        controller.uploadPrivacyPolicy(mockFile as Express.Multer.File)
      ).rejects.toThrow('Erreur lors du téléchargement: Storage error');
    });
  });

  describe('enablePrivacyPolicy', () => {
    it('should enable privacy policy', async () => {
      configurationService.setPrivacyPolicyEnabled.mockResolvedValue(undefined);

      const result = await controller.enablePrivacyPolicy(true);

      expect(configurationService.setPrivacyPolicyEnabled).toHaveBeenCalledWith(true);
      expect(result).toEqual({
        success: true,
        enabled: true,
        message: 'Politique de confidentialité activée',
      });
    });

    it('should disable privacy policy', async () => {
      configurationService.setPrivacyPolicyEnabled.mockResolvedValue(undefined);

      const result = await controller.enablePrivacyPolicy(false);

      expect(configurationService.setPrivacyPolicyEnabled).toHaveBeenCalledWith(false);
      expect(result).toEqual({
        success: true,
        enabled: false,
        message: 'Politique de confidentialité désactivée',
      });
    });
  });

  describe('deletePrivacyPolicy', () => {
    it('should delete privacy policy with file', async () => {
      const mockConfig = {
        fileUrl: 'https://storage.example.com/privacy-policy.pdf',
      };
      configurationService.getPrivacyPolicyConfiguration.mockResolvedValue(mockConfig as any);
      storageService.deleteFile.mockResolvedValue(undefined);
      configurationService.deletePrivacyPolicyFile.mockResolvedValue(undefined);

      const result = await controller.deletePrivacyPolicy();

      expect(configurationService.getPrivacyPolicyConfiguration).toHaveBeenCalled();
      expect(storageService.deleteFile).toHaveBeenCalledWith(mockConfig.fileUrl);
      expect(configurationService.deletePrivacyPolicyFile).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Politique de confidentialité supprimée avec succès',
      });
    });

    it('should delete privacy policy without file', async () => {
      const mockConfig = { fileUrl: null };
      configurationService.getPrivacyPolicyConfiguration.mockResolvedValue(mockConfig as any);
      configurationService.deletePrivacyPolicyFile.mockResolvedValue(undefined);

      const result = await controller.deletePrivacyPolicy();

      expect(configurationService.getPrivacyPolicyConfiguration).toHaveBeenCalled();
      expect(storageService.deleteFile).not.toHaveBeenCalled();
      expect(configurationService.deletePrivacyPolicyFile).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Politique de confidentialité supprimée avec succès',
      });
    });

    it('should handle file deletion errors gracefully', async () => {
      const mockConfig = {
        fileUrl: 'https://storage.example.com/privacy-policy.pdf',
      };
      configurationService.getPrivacyPolicyConfiguration.mockResolvedValue(mockConfig as any);
      storageService.deleteFile.mockRejectedValue(new Error('File not found'));
      configurationService.deletePrivacyPolicyFile.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await controller.deletePrivacyPolicy();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Erreur lors de la suppression du fichier:',
        expect.any(Error)
      );
      expect(configurationService.deletePrivacyPolicyFile).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Politique de confidentialité supprimée avec succès',
      });

      consoleSpy.mockRestore();
    });
  });
});