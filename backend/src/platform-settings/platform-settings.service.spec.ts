import { Test, TestingModule } from '@nestjs/testing';
import { PlatformSettingsService } from './platform-settings.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlatformSettings } from './entities/platform-settings.entity';
import { NotFoundException } from '@nestjs/common';
import { CreatePlatformSettingsDto } from './dto/create-platform-settings.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

describe('PlatformSettingsService', () => {
  let service: PlatformSettingsService;
  let repository: Repository<PlatformSettings>;

  const mockPlatformSettings = {
    id: 'settings-uuid-1',
    key: 'theme_configuration',
    value: {
      primaryColor: 'oklch(0.577 0.2 280)',
      secondaryColor: 'oklch(0.97 0 0)',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    description: 'Configuration des couleurs et thème de la plateforme',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
        PlatformSettingsService,
        {
          provide: getRepositoryToken(PlatformSettings),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PlatformSettingsService>(PlatformSettingsService);
    repository = module.get<Repository<PlatformSettings>>(getRepositoryToken(PlatformSettings));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create platform settings successfully', async () => {
      const createDto: CreatePlatformSettingsDto = {
        key: 'test_setting',
        value: { setting: 'value' },
        description: 'Test setting',
        isActive: true,
      };

      mockRepository.create.mockReturnValue(mockPlatformSettings);
      mockRepository.save.mockResolvedValue(mockPlatformSettings);

      const result = await service.create(createDto);

      expect(result).toEqual(mockPlatformSettings);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockPlatformSettings);
    });
  });

  describe('findAll', () => {
    it('should return all platform settings ordered by key', async () => {
      const settings = [mockPlatformSettings];
      mockRepository.find.mockResolvedValue(settings);

      const result = await service.findAll();

      expect(result).toEqual(settings);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { key: 'ASC' },
      });
    });
  });

  describe('findByKey', () => {
    it('should return platform setting when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockPlatformSettings);

      const result = await service.findByKey('theme_configuration');

      expect(result).toEqual(mockPlatformSettings);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'theme_configuration', isActive: true },
      });
    });

    it('should return null when setting not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByKey('non_existing_key');

      expect(result).toBeNull();
    });
  });

  describe('getValue', () => {
    it('should return setting value when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockPlatformSettings);

      const result = await service.getValue('theme_configuration');

      expect(result).toEqual(mockPlatformSettings.value);
    });

    it('should return null when setting not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getValue('non_existing_key');

      expect(result).toBeNull();
    });
  });

  describe('setValue', () => {
    const key = 'test_setting';
    const value = { newValue: 'test' };
    const description = 'Updated description';

    it('should update existing setting', async () => {
      const updatedSetting = { ...mockPlatformSettings, value, description };

      mockRepository.findOne
        .mockResolvedValueOnce(mockPlatformSettings) // findByKey call
        .mockResolvedValueOnce(updatedSetting); // final findOne call
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.setValue(key, value, description);

      expect(result).toEqual(updatedSetting);
      expect(mockRepository.update).toHaveBeenCalledWith(mockPlatformSettings.id, {
        value,
        description,
      });
    });

    it('should create new setting when not exists', async () => {
      const newSetting = {
        id: 'new-setting-id',
        key,
        value,
        description,
        isActive: true,
      };

      mockRepository.findOne.mockResolvedValue(null); // findByKey returns null
      mockRepository.create.mockReturnValue(newSetting);
      mockRepository.save.mockResolvedValue(newSetting);

      const result = await service.setValue(key, value, description);

      expect(result).toEqual(newSetting);
      expect(mockRepository.create).toHaveBeenCalledWith({
        key,
        value,
        description,
        isActive: true,
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdatePlatformSettingsDto = {
      value: { updated: 'value' },
      description: 'Updated description',
    };

    it('should update platform setting successfully', async () => {
      const updatedSetting = { ...mockPlatformSettings, ...updateDto };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(updatedSetting);

      const result = await service.update('settings-uuid-1', updateDto);

      expect(result).toEqual(updatedSetting);
      expect(mockRepository.update).toHaveBeenCalledWith('settings-uuid-1', updateDto);
    });

    it('should throw NotFoundException when setting not found after update', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existing', updateDto)).rejects.toThrow(
        new NotFoundException('Platform Settings with ID non-existing not found')
      );
    });
  });

  describe('remove', () => {
    it('should remove platform setting successfully', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('settings-uuid-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('settings-uuid-1');
    });

    it('should throw NotFoundException when setting not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('non-existing')).rejects.toThrow(
        new NotFoundException('Platform Settings with ID non-existing not found')
      );
    });
  });

  describe('getVisualIdentitySettings', () => {
    it('should return visual identity settings with defaults when not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getVisualIdentitySettings();

      expect(result).toHaveProperty('theme');
      expect(result).toHaveProperty('branding');
      expect(result).toHaveProperty('layout');
      expect(result).toHaveProperty('pageSettings');

      // Check default theme settings
      expect(result.theme).toEqual({
        primaryColor: 'oklch(0.577 0.2 280)',
        secondaryColor: 'oklch(0.97 0 0)',
        accentColor: 'oklch(0.97 0 0)',
        destructiveColor: 'oklch(0.577 0.245 27.325)',
        borderRadius: '0.625rem',
        fontFamily: 'Inter, system-ui, sans-serif',
      });

      // Check default branding settings
      expect(result.branding).toEqual({
        logoUrl: '',
        title: 'RH Analytics Pro',
        favicon: '',
        companyName: 'RH Analytics Pro',
      });
    });

    it('should return actual settings when found', async () => {
      const themeSettings = { primaryColor: 'red' };
      const brandingSettings = { title: 'Custom Title' };

      mockRepository.findOne
        .mockResolvedValueOnce({ value: themeSettings }) // theme_configuration
        .mockResolvedValueOnce({ value: brandingSettings }) // branding_configuration
        .mockResolvedValueOnce(null) // layout_configuration
        .mockResolvedValueOnce(null); // page_configuration

      const result = await service.getVisualIdentitySettings();

      expect(result.theme).toEqual(themeSettings);
      expect(result.branding).toEqual(brandingSettings);
      expect(result.layout).toEqual({
        showHeader: true,
        showFooter: true,
        sidebarStyle: 'expanded',
      });
    });
  });

  describe('updateVisualIdentitySettings', () => {
    it('should update visual identity settings for given section', async () => {
      const section = 'theme';
      const settings = { primaryColor: 'blue' };

      const existingSetting = { id: 'existing-id', value: { oldValue: 'old' } };
      const updatedSetting = { ...existingSetting, value: settings };

      mockRepository.findOne
        .mockResolvedValueOnce(existingSetting) // findByKey call
        .mockResolvedValueOnce(updatedSetting); // final findOne call
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateVisualIdentitySettings(section, settings);

      expect(mockRepository.update).toHaveBeenCalledWith(existingSetting.id, {
        value: settings,
        description: 'Configuration theme de l\'identité visuelle',
      });
    });
  });

  describe('initializeDefaultSettings', () => {
    it('should create default settings when they do not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null); // No existing settings
      mockRepository.create.mockImplementation((dto) => ({ id: 'new-id', ...dto }));
      mockRepository.save.mockImplementation((setting) => Promise.resolve(setting));

      await service.initializeDefaultSettings();

      expect(mockRepository.create).toHaveBeenCalledTimes(4); // 4 default settings
      expect(mockRepository.save).toHaveBeenCalledTimes(4);

      // Verify theme configuration was created
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'theme_configuration',
          value: expect.objectContaining({
            primaryColor: 'oklch(0.577 0.2 280)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }),
          isActive: true,
        })
      );
    });

    it('should not create settings that already exist', async () => {
      mockRepository.findOne.mockResolvedValue(mockPlatformSettings); // Existing settings

      await service.initializeDefaultSettings();

      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should create only missing settings', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(mockPlatformSettings) // theme exists
        .mockResolvedValueOnce(null) // branding doesn't exist
        .mockResolvedValueOnce(null) // layout doesn't exist
        .mockResolvedValueOnce(null); // page doesn't exist

      mockRepository.create.mockImplementation((dto) => ({ id: 'new-id', ...dto }));
      mockRepository.save.mockImplementation((setting) => Promise.resolve(setting));

      await service.initializeDefaultSettings();

      expect(mockRepository.create).toHaveBeenCalledTimes(3); // 3 missing settings
      expect(mockRepository.save).toHaveBeenCalledTimes(3);
    });
  });
});