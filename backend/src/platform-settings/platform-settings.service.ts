import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSettings } from './entities/platform-settings.entity';
import { CreatePlatformSettingsDto } from './dto/create-platform-settings.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

@Injectable()
export class PlatformSettingsService {
  constructor(
    @InjectRepository(PlatformSettings)
    private platformSettingsRepository: Repository<PlatformSettings>,
  ) {}

  async create(createPlatformSettingsDto: CreatePlatformSettingsDto): Promise<PlatformSettings> {
    const settings = this.platformSettingsRepository.create(createPlatformSettingsDto);
    return await this.platformSettingsRepository.save(settings);
  }

  async findAll(): Promise<PlatformSettings[]> {
    return await this.platformSettingsRepository.find({
      order: { key: 'ASC' },
    });
  }

  async findByKey(key: string): Promise<PlatformSettings | null> {
    return await this.platformSettingsRepository.findOne({
      where: { key, isActive: true },
    });
  }

  async getValue(key: string): Promise<Record<string, any> | null> {
    const settings = await this.findByKey(key);
    return settings ? settings.value : null;
  }

  async setValue(key: string, value: Record<string, any>, description?: string): Promise<PlatformSettings> {
    const existingSettings = await this.findByKey(key);

    if (existingSettings) {
      await this.platformSettingsRepository.update(existingSettings.id, { value, description });
      return this.platformSettingsRepository.findOne({ where: { id: existingSettings.id } });
    } else {
      return this.create({ key, value, description, isActive: true });
    }
  }

  async update(id: string, updatePlatformSettingsDto: UpdatePlatformSettingsDto): Promise<PlatformSettings> {
    await this.platformSettingsRepository.update(id, updatePlatformSettingsDto);
    const settings = await this.platformSettingsRepository.findOne({ where: { id } });

    if (!settings) {
      throw new NotFoundException(`Platform Settings with ID ${id} not found`);
    }

    return settings;
  }

  async remove(id: string): Promise<void> {
    const result = await this.platformSettingsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Platform Settings with ID ${id} not found`);
    }
  }

  async getVisualIdentitySettings() {
    const themeSettings = await this.getValue('theme_configuration');
    const brandingSettings = await this.getValue('branding_configuration');
    const layoutSettings = await this.getValue('layout_configuration');
    const pageSettings = await this.getValue('page_configuration');

    return {
      theme: themeSettings || this.getDefaultThemeSettings(),
      branding: brandingSettings || this.getDefaultBrandingSettings(),
      layout: layoutSettings || this.getDefaultLayoutSettings(),
      pageSettings: pageSettings || this.getDefaultPageSettings(),
    };
  }

  async updateVisualIdentitySettings(section: string, settings: Record<string, any>): Promise<void> {
    const key = `${section}_configuration`;
    await this.setValue(key, settings, `Configuration ${section} de l'identité visuelle`);
  }

  private getDefaultThemeSettings(): Record<string, any> {
    return {
      primaryColor: 'oklch(0.577 0.2 280)', // Purple par défaut
      secondaryColor: 'oklch(0.97 0 0)',
      accentColor: 'oklch(0.97 0 0)',
      destructiveColor: 'oklch(0.577 0.245 27.325)',
      borderRadius: '0.625rem',
      fontFamily: 'Inter, system-ui, sans-serif'
    };
  }

  private getDefaultBrandingSettings(): Record<string, any> {
    return {
      logoUrl: '',
      title: 'RH Analytics Pro',
      favicon: '',
      companyName: 'RH Analytics Pro'
    };
  }

  private getDefaultLayoutSettings(): Record<string, any> {
    return {
      showHeader: true,
      showFooter: true,
      sidebarStyle: 'expanded'
    };
  }

  private getDefaultPageSettings(): Record<string, any> {
    return {
      jobs: {
        header: { enabled: true, content: '' },
        footer: { enabled: true, content: '' }
      },
      dashboard: {
        header: { enabled: true, content: '' },
        footer: { enabled: true, content: '' }
      },
      candidates: {
        header: { enabled: true, content: '' },
        footer: { enabled: true, content: '' }
      }
    };
  }

  async initializeDefaultSettings() {
    const defaultSettings = [
      {
        key: 'theme_configuration',
        value: this.getDefaultThemeSettings(),
        description: 'Configuration des couleurs et thème de la plateforme'
      },
      {
        key: 'branding_configuration',
        value: this.getDefaultBrandingSettings(),
        description: 'Configuration du branding (logo, titre, etc.)'
      },
      {
        key: 'layout_configuration',
        value: this.getDefaultLayoutSettings(),
        description: 'Configuration de la mise en page globale'
      },
      {
        key: 'page_configuration',
        value: this.getDefaultPageSettings(),
        description: 'Configuration spécifique par page'
      }
    ];

    for (const setting of defaultSettings) {
      const existing = await this.findByKey(setting.key);
      if (!existing) {
        await this.create({
          ...setting,
          isActive: true
        });
      }
    }
  }
}