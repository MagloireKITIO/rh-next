import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlatformSettingsService } from './platform-settings.service';
import { CreatePlatformSettingsDto } from './dto/create-platform-settings.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { StorageService } from '../storage/storage.service';

@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly storageService: StorageService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() createPlatformSettingsDto: CreatePlatformSettingsDto) {
    return this.platformSettingsService.create(createPlatformSettingsDto);
  }

  @Get()
  findAll() {
    return this.platformSettingsService.findAll();
  }

  @Get('visual-identity')
  getVisualIdentitySettings() {
    return this.platformSettingsService.getVisualIdentitySettings();
  }

  @Get('key/:key')
  findByKey(@Param('key') key: string) {
    return this.platformSettingsService.findByKey(key);
  }

  @Post('set')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  setValue(@Body() body: { key: string; value: Record<string, any>; description?: string }) {
    return this.platformSettingsService.setValue(body.key, body.value, body.description);
  }

  @Post('visual-identity/:section')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async updateVisualIdentitySection(@Param('section') section: string, @Body() settings: Record<string, any>) {
    await this.platformSettingsService.updateVisualIdentitySettings(section, settings);
    return {
      success: true,
      message: `Configuration ${section} mise à jour avec succès`
    };
  }

  @Post('branding/upload-logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    // Vérifier le type de fichier
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new Error('Seuls les fichiers PNG, JPG, SVG et WebP sont autorisés');
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Le fichier est trop volumineux (max 5MB)');
    }

    try {
      const logoUrl = await this.storageService.uploadFile(
        file.buffer,
        `logo-${Date.now()}.${file.originalname.split('.').pop()}`,
        file.mimetype,
        'offer'
      );

      // Mettre à jour les paramètres de branding
      const currentBranding = await this.platformSettingsService.getValue('branding_configuration') || {};
      await this.platformSettingsService.setValue('branding_configuration', {
        ...currentBranding,
        logoUrl
      });

      return {
        success: true,
        logoUrl,
        message: 'Logo téléchargé avec succès'
      };
    } catch (error) {
      throw new Error(`Erreur lors du téléchargement: ${error.message}`);
    }
  }

  @Post('branding/upload-favicon')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFavicon(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    // Vérifier le type de fichier
    const allowedMimes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new Error('Seuls les fichiers ICO, PNG et SVG sont autorisés pour le favicon');
    }

    // Vérifier la taille (1MB max)
    if (file.size > 1 * 1024 * 1024) {
      throw new Error('Le fichier est trop volumineux (max 1MB)');
    }

    try {
      const faviconUrl = await this.storageService.uploadFile(
        file.buffer,
        `favicon-${Date.now()}.${file.originalname.split('.').pop()}`,
        file.mimetype,
        'offer'
      );

      // Mettre à jour les paramètres de branding
      const currentBranding = await this.platformSettingsService.getValue('branding_configuration') || {};
      await this.platformSettingsService.setValue('branding_configuration', {
        ...currentBranding,
        favicon: faviconUrl
      });

      return {
        success: true,
        faviconUrl,
        message: 'Favicon téléchargé avec succès'
      };
    } catch (error) {
      throw new Error(`Erreur lors du téléchargement: ${error.message}`);
    }
  }

  @Post('initialize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  initializeDefaults() {
    return this.platformSettingsService.initializeDefaultSettings();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updatePlatformSettingsDto: UpdatePlatformSettingsDto) {
    return this.platformSettingsService.update(id, updatePlatformSettingsDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.platformSettingsService.remove(id);
  }
}