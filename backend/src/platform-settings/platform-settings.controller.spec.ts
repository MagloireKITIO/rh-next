import { Test, TestingModule } from '@nestjs/testing';
import { PlatformSettingsController } from './platform-settings.controller';
import { PlatformSettingsService } from './platform-settings.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../auth/entities/user.entity';
import { CreatePlatformSettingsDto } from './dto/create-platform-settings.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

describe('PlatformSettingsController', () => {
  let controller: PlatformSettingsController;
  let platformSettingsService: PlatformSettingsService;
  let storageService: StorageService;

  const mockPlatformSettingsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getVisualIdentitySettings: jest.fn(),
    findByKey: jest.fn(),
    setValue: jest.fn(),
    getValue: jest.fn(),
    updateVisualIdentitySettings: jest.fn(),
    initializeDefaultSettings: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
  };

  const mockPlatformSetting = {
    id: 'setting-123',
    key: 'app_name',
    value: { name: 'My App' },
    description: 'Application name configuration',
    isActive: true,
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:00:00Z'),
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'logo.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1024 * 500, // 500KB
    buffer: Buffer.from('fake image data'),
    destination: '',
    filename: 'logo.png',
    path: '',
    stream: null as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformSettingsController],
      providers: [
        {
          provide: PlatformSettingsService,
          useValue: mockPlatformSettingsService,
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

    controller = module.get<PlatformSettingsController>(PlatformSettingsController);
    platformSettingsService = module.get<PlatformSettingsService>(PlatformSettingsService);
    storageService = module.get<StorageService>(StorageService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create platform setting', async () => {
      const createDto: CreatePlatformSettingsDto = {
        key: 'test_setting',
        value: { enabled: true },
        description: 'Test setting',
        isActive: true,
      };
      mockPlatformSettingsService.create.mockResolvedValue(mockPlatformSetting);

      const result = await controller.create(createDto);

      expect(platformSettingsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockPlatformSetting);
    });

    it('should handle creation errors', async () => {
      const createDto: CreatePlatformSettingsDto = {
        key: 'invalid_setting',
        value: { enabled: true },
      };
      const error = new Error('Creation failed');
      mockPlatformSettingsService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(error);
      expect(platformSettingsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all platform settings', async () => {
      const settings = [mockPlatformSetting];
      mockPlatformSettingsService.findAll.mockResolvedValue(settings);

      const result = await controller.findAll();

      expect(platformSettingsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(settings);
    });

    it('should handle empty results', async () => {
      mockPlatformSettingsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(platformSettingsService.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockPlatformSettingsService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(error);
      expect(platformSettingsService.findAll).toHaveBeenCalled();
    });
  });

  describe('getVisualIdentitySettings', () => {
    it('should return visual identity settings', async () => {
      const visualSettings = {
        colors: { primary: '#007bff', secondary: '#6c757d' },
        fonts: { primary: 'Arial', secondary: 'Helvetica' },
      };
      mockPlatformSettingsService.getVisualIdentitySettings.mockResolvedValue(visualSettings);

      const result = await controller.getVisualIdentitySettings();

      expect(platformSettingsService.getVisualIdentitySettings).toHaveBeenCalled();
      expect(result).toEqual(visualSettings);
    });

    it('should handle service errors', async () => {
      const error = new Error('Settings not found');
      mockPlatformSettingsService.getVisualIdentitySettings.mockRejectedValue(error);

      await expect(controller.getVisualIdentitySettings()).rejects.toThrow(error);
      expect(platformSettingsService.getVisualIdentitySettings).toHaveBeenCalled();
    });
  });

  describe('findByKey', () => {
    it('should return setting by key', async () => {
      mockPlatformSettingsService.findByKey.mockResolvedValue(mockPlatformSetting);

      const result = await controller.findByKey('app_name');

      expect(platformSettingsService.findByKey).toHaveBeenCalledWith('app_name');
      expect(result).toEqual(mockPlatformSetting);
    });

    it('should handle key not found', async () => {
      mockPlatformSettingsService.findByKey.mockResolvedValue(null);

      const result = await controller.findByKey('non_existent');

      expect(platformSettingsService.findByKey).toHaveBeenCalledWith('non_existent');
      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockPlatformSettingsService.findByKey.mockRejectedValue(error);

      await expect(controller.findByKey('app_name')).rejects.toThrow(error);
      expect(platformSettingsService.findByKey).toHaveBeenCalledWith('app_name');
    });
  });

  describe('setValue', () => {
    it('should set value successfully', async () => {
      const body = {
        key: 'theme_config',
        value: { darkMode: true },
        description: 'Theme configuration',
      };
      mockPlatformSettingsService.setValue.mockResolvedValue(mockPlatformSetting);

      const result = await controller.setValue(body);

      expect(platformSettingsService.setValue).toHaveBeenCalledWith(
        'theme_config',
        { darkMode: true },
        'Theme configuration'
      );
      expect(result).toEqual(mockPlatformSetting);
    });

    it('should set value without description', async () => {
      const body = {
        key: 'simple_setting',
        value: { enabled: false },
      };
      mockPlatformSettingsService.setValue.mockResolvedValue(mockPlatformSetting);

      const result = await controller.setValue(body);

      expect(platformSettingsService.setValue).toHaveBeenCalledWith(
        'simple_setting',
        { enabled: false },
        undefined
      );
      expect(result).toEqual(mockPlatformSetting);
    });

    it('should handle setValue errors', async () => {
      const body = {
        key: 'invalid_key',
        value: { test: true },
      };
      const error = new Error('Invalid key format');
      mockPlatformSettingsService.setValue.mockRejectedValue(error);

      await expect(controller.setValue(body)).rejects.toThrow(error);
      expect(platformSettingsService.setValue).toHaveBeenCalledWith('invalid_key', { test: true }, undefined);
    });
  });

  describe('updateVisualIdentitySection', () => {
    it('should update visual identity section', async () => {
      const settings = { primaryColor: '#ff0000' };
      mockPlatformSettingsService.updateVisualIdentitySettings.mockResolvedValue(undefined);

      const result = await controller.updateVisualIdentitySection('colors', settings);

      expect(platformSettingsService.updateVisualIdentitySettings).toHaveBeenCalledWith('colors', settings);
      expect(result).toEqual({
        success: true,
        message: 'Configuration colors mise à jour avec succès',
      });
    });

    it('should handle different sections', async () => {
      const sections = ['fonts', 'layout', 'branding'];
      mockPlatformSettingsService.updateVisualIdentitySettings.mockResolvedValue(undefined);

      for (const section of sections) {
        const settings = { testProperty: 'testValue' };
        const result = await controller.updateVisualIdentitySection(section, settings);

        expect(platformSettingsService.updateVisualIdentitySettings).toHaveBeenCalledWith(section, settings);
        expect(result.message).toContain(section);
      }
    });

    it('should handle update errors', async () => {
      const settings = { invalidProperty: 'value' };
      const error = new Error('Update failed');
      mockPlatformSettingsService.updateVisualIdentitySettings.mockRejectedValue(error);

      await expect(controller.updateVisualIdentitySection('colors', settings)).rejects.toThrow(error);
      expect(platformSettingsService.updateVisualIdentitySettings).toHaveBeenCalledWith('colors', settings);
    });
  });

  describe('uploadLogo', () => {
    it('should upload logo successfully', async () => {
      const logoUrl = 'https://storage.example.com/logo-123456.png';
      const currentBranding = { theme: 'light' };

      mockStorageService.uploadFile.mockResolvedValue(logoUrl);
      mockPlatformSettingsService.getValue.mockResolvedValue(currentBranding);
      mockPlatformSettingsService.setValue.mockResolvedValue(mockPlatformSetting);

      const result = await controller.uploadLogo(mockFile);

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        mockFile.buffer,
        expect.stringMatching(/logo-\d+\.png/),
        'image/png',
        'offer'
      );
      expect(platformSettingsService.getValue).toHaveBeenCalledWith('branding_configuration');
      expect(platformSettingsService.setValue).toHaveBeenCalledWith('branding_configuration', {
        ...currentBranding,
        logoUrl,
      });
      expect(result).toEqual({
        success: true,
        logoUrl,
        message: 'Logo téléchargé avec succès',
      });
    });

    it('should throw error when no file provided', async () => {
      await expect(controller.uploadLogo(undefined as any)).rejects.toThrow('Aucun fichier fourni');
    });

    it('should throw error for invalid file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'text/plain' };

      await expect(controller.uploadLogo(invalidFile)).rejects.toThrow(
        'Seuls les fichiers PNG, JPG, SVG et WebP sont autorisés'
      );
    });

    it('should throw error for oversized file', async () => {
      const oversizedFile = { ...mockFile, size: 6 * 1024 * 1024 }; // 6MB

      await expect(controller.uploadLogo(oversizedFile)).rejects.toThrow(
        'Le fichier est trop volumineux (max 5MB)'
      );
    });

    it('should handle valid file types', async () => {
      const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
      const logoUrl = 'https://storage.example.com/logo.png';

      mockStorageService.uploadFile.mockResolvedValue(logoUrl);
      mockPlatformSettingsService.getValue.mockResolvedValue({});
      mockPlatformSettingsService.setValue.mockResolvedValue(mockPlatformSetting);

      for (const mimetype of validMimeTypes) {
        const validFile = { ...mockFile, mimetype };

        const result = await controller.uploadLogo(validFile);

        expect(result.success).toBe(true);
        expect(result.logoUrl).toBe(logoUrl);
      }
    });

    it('should handle storage service errors', async () => {
      const error = new Error('Storage upload failed');
      mockStorageService.uploadFile.mockRejectedValue(error);

      await expect(controller.uploadLogo(mockFile)).rejects.toThrow(
        'Erreur lors du téléchargement: Storage upload failed'
      );
    });

    it('should handle branding update errors', async () => {
      const logoUrl = 'https://storage.example.com/logo.png';
      const error = new Error('Database update failed');

      mockStorageService.uploadFile.mockResolvedValue(logoUrl);
      mockPlatformSettingsService.getValue.mockResolvedValue({});
      mockPlatformSettingsService.setValue.mockRejectedValue(error);

      await expect(controller.uploadLogo(mockFile)).rejects.toThrow(
        'Erreur lors du téléchargement: Database update failed'
      );
    });
  });

  describe('uploadFavicon', () => {
    const mockFaviconFile: Express.Multer.File = {
      ...mockFile,
      originalname: 'favicon.ico',
      mimetype: 'image/x-icon',
      size: 1024 * 100, // 100KB
    };

    it('should upload favicon successfully', async () => {
      const faviconUrl = 'https://storage.example.com/favicon-123456.ico';
      const currentBranding = { logoUrl: 'logo.png' };

      mockStorageService.uploadFile.mockResolvedValue(faviconUrl);
      mockPlatformSettingsService.getValue.mockResolvedValue(currentBranding);
      mockPlatformSettingsService.setValue.mockResolvedValue(mockPlatformSetting);

      const result = await controller.uploadFavicon(mockFaviconFile);

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        mockFaviconFile.buffer,
        expect.stringMatching(/favicon-\d+\.ico/),
        'image/x-icon',
        'offer'
      );
      expect(platformSettingsService.getValue).toHaveBeenCalledWith('branding_configuration');
      expect(platformSettingsService.setValue).toHaveBeenCalledWith('branding_configuration', {
        ...currentBranding,
        favicon: faviconUrl,
      });
      expect(result).toEqual({
        success: true,
        faviconUrl,
        message: 'Favicon téléchargé avec succès',
      });
    });

    it('should throw error when no file provided', async () => {
      await expect(controller.uploadFavicon(undefined as any)).rejects.toThrow('Aucun fichier fourni');
    });

    it('should throw error for invalid favicon file type', async () => {
      const invalidFile = { ...mockFaviconFile, mimetype: 'image/jpeg' };

      await expect(controller.uploadFavicon(invalidFile)).rejects.toThrow(
        'Seuls les fichiers ICO, PNG et SVG sont autorisés pour le favicon'
      );
    });

    it('should throw error for oversized favicon file', async () => {
      const oversizedFile = { ...mockFaviconFile, size: 2 * 1024 * 1024 }; // 2MB

      await expect(controller.uploadFavicon(oversizedFile)).rejects.toThrow(
        'Le fichier est trop volumineux (max 1MB)'
      );
    });

    it('should handle valid favicon file types', async () => {
      const validMimeTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml'];
      const faviconUrl = 'https://storage.example.com/favicon.ico';

      mockStorageService.uploadFile.mockResolvedValue(faviconUrl);
      mockPlatformSettingsService.getValue.mockResolvedValue({});
      mockPlatformSettingsService.setValue.mockResolvedValue(mockPlatformSetting);

      for (const mimetype of validMimeTypes) {
        const validFile = { ...mockFaviconFile, mimetype };

        const result = await controller.uploadFavicon(validFile);

        expect(result.success).toBe(true);
        expect(result.faviconUrl).toBe(faviconUrl);
      }
    });

    it('should handle storage service errors for favicon', async () => {
      const error = new Error('Storage upload failed');
      mockStorageService.uploadFile.mockRejectedValue(error);

      await expect(controller.uploadFavicon(mockFaviconFile)).rejects.toThrow(
        'Erreur lors du téléchargement: Storage upload failed'
      );
    });
  });

  describe('initializeDefaults', () => {
    it('should initialize default settings', async () => {
      const defaultSettings = [mockPlatformSetting];
      mockPlatformSettingsService.initializeDefaultSettings.mockResolvedValue(defaultSettings);

      const result = await controller.initializeDefaults();

      expect(platformSettingsService.initializeDefaultSettings).toHaveBeenCalled();
      expect(result).toEqual(defaultSettings);
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockPlatformSettingsService.initializeDefaultSettings.mockRejectedValue(error);

      await expect(controller.initializeDefaults()).rejects.toThrow(error);
      expect(platformSettingsService.initializeDefaultSettings).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update platform setting', async () => {
      const updateDto: UpdatePlatformSettingsDto = {
        value: { updated: true },
        description: 'Updated setting',
      };
      const updatedSetting = { ...mockPlatformSetting, ...updateDto };
      mockPlatformSettingsService.update.mockResolvedValue(updatedSetting);

      const result = await controller.update('setting-123', updateDto);

      expect(platformSettingsService.update).toHaveBeenCalledWith('setting-123', updateDto);
      expect(result).toEqual(updatedSetting);
    });

    it('should handle update errors', async () => {
      const updateDto: UpdatePlatformSettingsDto = { value: { invalid: true } };
      const error = new Error('Setting not found');
      mockPlatformSettingsService.update.mockRejectedValue(error);

      await expect(controller.update('non-existent', updateDto)).rejects.toThrow(error);
      expect(platformSettingsService.update).toHaveBeenCalledWith('non-existent', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove platform setting', async () => {
      mockPlatformSettingsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('setting-123');

      expect(platformSettingsService.remove).toHaveBeenCalledWith('setting-123');
      expect(result).toBeUndefined();
    });

    it('should handle removal errors', async () => {
      const error = new Error('Setting not found');
      mockPlatformSettingsService.remove.mockRejectedValue(error);

      await expect(controller.remove('non-existent')).rejects.toThrow(error);
      expect(platformSettingsService.remove).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should protect create with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.create);
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);
    });

    it('should protect setValue with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.setValue);
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);
    });

    it('should protect updateVisualIdentitySection with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.updateVisualIdentitySection);
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);
    });

    it('should protect uploadLogo with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.uploadLogo);
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);
    });

    it('should protect uploadFavicon with JwtAuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.uploadFavicon);
      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(RolesGuard);
    });

    it('should require SUPER_ADMIN role for protected endpoints', () => {
      const protectedMethods = [
        controller.create,
        controller.setValue,
        controller.updateVisualIdentitySection,
        controller.uploadLogo,
        controller.uploadFavicon,
        controller.initializeDefaults,
        controller.update,
        controller.remove,
      ];

      protectedMethods.forEach(method => {
        const roles = Reflect.getMetadata('roles', method);
        expect(roles).toContain(UserRole.SUPER_ADMIN);
      });
    });

    it('should NOT protect public endpoints', () => {
      const publicMethods = [
        controller.findAll,
        controller.getVisualIdentitySettings,
        controller.findByKey,
      ];

      publicMethods.forEach(method => {
        const guards = Reflect.getMetadata('__guards__', method);
        expect(guards).toBeFalsy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing branding configuration in uploadLogo', async () => {
      const logoUrl = 'https://storage.example.com/logo.png';

      mockStorageService.uploadFile.mockResolvedValue(logoUrl);
      mockPlatformSettingsService.getValue.mockResolvedValue(null); // No existing branding
      mockPlatformSettingsService.setValue.mockResolvedValue(mockPlatformSetting);

      const result = await controller.uploadLogo(mockFile);

      expect(platformSettingsService.setValue).toHaveBeenCalledWith('branding_configuration', {
        logoUrl,
      });
      expect(result.success).toBe(true);
    });

    it('should handle file extension extraction in uploadLogo', async () => {
      const fileWithComplexName = {
        ...mockFile,
        originalname: 'my.logo.with.dots.png',
      };
      const logoUrl = 'https://storage.example.com/logo.png';

      mockStorageService.uploadFile.mockResolvedValue(logoUrl);
      mockPlatformSettingsService.getValue.mockResolvedValue({});
      mockPlatformSettingsService.setValue.mockResolvedValue(mockPlatformSetting);

      await controller.uploadLogo(fileWithComplexName);

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        fileWithComplexName.buffer,
        expect.stringMatching(/logo-\d+\.png/),
        'image/png',
        'offer'
      );
    });

    it('should handle empty settings object in visual identity update', async () => {
      mockPlatformSettingsService.updateVisualIdentitySettings.mockResolvedValue(undefined);

      const result = await controller.updateVisualIdentitySection('colors', {});

      expect(platformSettingsService.updateVisualIdentitySettings).toHaveBeenCalledWith('colors', {});
      expect(result.success).toBe(true);
    });

    it('should handle null value in setValue', async () => {
      const body = {
        key: 'nullable_setting',
        value: null as any,
      };
      mockPlatformSettingsService.setValue.mockResolvedValue(mockPlatformSetting);

      const result = await controller.setValue(body);

      expect(platformSettingsService.setValue).toHaveBeenCalledWith('nullable_setting', null, undefined);
      expect(result).toEqual(mockPlatformSetting);
    });
  });
});