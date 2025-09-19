import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigurationService } from './configuration.service';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { StorageService } from '../storage/storage.service';

@Controller('configuration')
export class ConfigurationController {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly storageService: StorageService
  ) {}

  @Post()
  create(@Body() createConfigurationDto: CreateConfigurationDto) {
    return this.configurationService.create(createConfigurationDto);
  }

  @Get()
  findAll() {
    return this.configurationService.findAll();
  }

  @Get('ai')
  getAIConfiguration() {
    return this.configurationService.getAIConfiguration();
  }

  @Get('key/:key')
  findByKey(@Param('key') key: string) {
    return this.configurationService.findByKey(key);
  }

  @Post('set')
  setValue(@Body() body: { key: string; value: string; description?: string }) {
    return this.configurationService.setValue(body.key, body.value, body.description);
  }

  @Post('initialize')
  initializeDefaults() {
    return this.configurationService.initializeDefaultConfigurations();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateConfigurationDto: UpdateConfigurationDto) {
    return this.configurationService.update(id, updateConfigurationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.configurationService.remove(id);
  }

  @Get('privacy-policy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  getPrivacyPolicyConfiguration() {
    return this.configurationService.getPrivacyPolicyConfiguration();
  }

  @Post('privacy-policy/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPrivacyPolicy(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new Error('Seuls les fichiers PDF sont autorisés');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB max
      throw new Error('Le fichier est trop volumineux (max 10MB)');
    }

    try {
      const fileUrl = await this.storageService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'offer'
      );

      await this.configurationService.setPrivacyPolicyFile(fileUrl, file.originalname);

      return {
        success: true,
        fileUrl,
        fileName: file.originalname,
        message: 'Politique de confidentialité téléchargée avec succès'
      };
    } catch (error) {
      throw new Error(`Erreur lors du téléchargement: ${error.message}`);
    }
  }

  @Post('privacy-policy/enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async enablePrivacyPolicy(@Body('enabled') enabled: boolean) {
    await this.configurationService.setPrivacyPolicyEnabled(enabled);
    return {
      success: true,
      enabled,
      message: `Politique de confidentialité ${enabled ? 'activée' : 'désactivée'}`
    };
  }

  @Delete('privacy-policy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async deletePrivacyPolicy() {
    const config = await this.configurationService.getPrivacyPolicyConfiguration();

    if (config.fileUrl) {
      try {
        await this.storageService.deleteFile(config.fileUrl);
      } catch (error) {
        console.warn('Erreur lors de la suppression du fichier:', error);
      }
    }

    await this.configurationService.deletePrivacyPolicyFile();

    return {
      success: true,
      message: 'Politique de confidentialité supprimée avec succès'
    };
  }
}