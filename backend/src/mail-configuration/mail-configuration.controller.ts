import { Controller, Get, Post, Body, Patch, Put, Delete, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

import { MailConfigurationService } from './mail-configuration.service';
import { CreateMailConfigurationDto } from './dto/create-mail-configuration.dto';
import { UpdateMailConfigurationDto } from './dto/update-mail-configuration.dto';
import { TestMailDto } from './dto/test-mail.dto';

@Controller('admin/mail-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class MailConfigurationController {
  constructor(private readonly mailConfigurationService: MailConfigurationService) {}

  /**
   * Créer ou mettre à jour la configuration mail
   */
  @Post()
  async createOrUpdate(@Body() createMailConfigurationDto: CreateMailConfigurationDto) {
    const config = await this.mailConfigurationService.createOrUpdate(createMailConfigurationDto);
    
    console.log('📤 [API] Envoi réponse sauvegarde config:', {
      success: true,
      provider_type: config.provider_type,
      from_email: config.from_email
    });
    
    return {
      success: true,
      message: 'Configuration mail sauvegardée avec succès',
      data: config
    };
  }

  /**
   * Récupérer la configuration mail pour l'interface
   */
  @Get()
  async getConfiguration() {
    const config = await this.mailConfigurationService.getConfigurationForUI();
    
    const response = {
      success: true,
      data: config
    };
    
    console.log('📤 [API] Envoi réponse GET config:', {
      success: response.success,
      provider_type: config.provider_type,
      from_email: config.from_email,
      id: config.id
    });
    
    return response;
  }

  /**
   * Mettre à jour la configuration mail
   */
  @Patch()
  async update(@Body() updateMailConfigurationDto: UpdateMailConfigurationDto) {
    const config = await this.mailConfigurationService.createOrUpdate(updateMailConfigurationDto as CreateMailConfigurationDto);
    
    return {
      success: true,
      message: 'Configuration mail mise à jour avec succès',
      data: config
    };
  }

  /**
   * Tester la configuration mail
   */
  @Post('test')
  async testConfiguration(@Body() testMailDto: TestMailDto) {
    const result = await this.mailConfigurationService.testConfiguration(testMailDto);
    
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    
    return {
      success: result.success,
      message: result.message
    };
  }

  /**
   * Obtenir le statut de la configuration mail
   */
  @Get('status')
  async getStatus() {
    const status = await this.mailConfigurationService.getConfigurationStatus();
    
    return {
      success: true,
      data: status
    };
  }
}

@Controller('admin/mail-configs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class MailConfigurationsController {
  constructor(private readonly mailConfigurationService: MailConfigurationService) {}

  /**
   * Récupérer toutes les configurations mail
   */
  @Get()
  async getAllConfigurations() {
    const configs = await this.mailConfigurationService.getAllConfigurations();
    
    return {
      success: true,
      data: configs
    };
  }

  /**
   * Créer une nouvelle configuration mail
   */
  @Post()
  async create(@Body() createMailConfigurationDto: CreateMailConfigurationDto) {
    const config = await this.mailConfigurationService.createOrUpdate(createMailConfigurationDto);
    
    return {
      success: true,
      message: 'Configuration mail créée avec succès',
      data: config
    };
  }

  /**
   * Récupérer une configuration mail par ID
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    const config = await this.mailConfigurationService.getConfigurationById(id);
    
    return {
      success: true,
      data: config
    };
  }

  /**
   * Mettre à jour une configuration mail par ID
   */
  @Put(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateMailConfigurationDto: UpdateMailConfigurationDto
  ) {
    const config = await this.mailConfigurationService.updateConfiguration(id, updateMailConfigurationDto);
    
    return {
      success: true,
      message: 'Configuration mail mise à jour avec succès',
      data: config
    };
  }

  /**
   * Supprimer une configuration mail par ID
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.mailConfigurationService.deleteConfiguration(id);
    
    return {
      success: true,
      message: 'Configuration mail supprimée avec succès'
    };
  }

  /**
   * Activer/Désactiver une configuration mail
   */
  @Patch(':id/toggle')
  async toggle(
    @Param('id') id: string,
    @Body() body: { is_active: boolean }
  ) {
    const config = await this.mailConfigurationService.toggleConfiguration(id, body.is_active);
    
    return {
      success: true,
      message: `Configuration ${body.is_active ? 'activée' : 'désactivée'} avec succès`,
      data: config
    };
  }

  /**
   * Dupliquer une configuration mail
   */
  @Post(':id/duplicate')
  async duplicate(
    @Param('id') id: string,
    @Body() body: { name?: string }
  ) {
    const config = await this.mailConfigurationService.duplicateConfiguration(id, body.name);
    
    return {
      success: true,
      message: 'Configuration dupliquée avec succès',
      data: config
    };
  }

  /**
   * Affecter plusieurs entreprises à une configuration
   */
  @Post(':id/assign-companies')
  async assignCompanies(
    @Param('id') configId: string,
    @Body() body: { companyIds: string[] }
  ) {
    await this.mailConfigurationService.assignCompaniesToConfiguration(configId, body.companyIds);
    
    return {
      success: true,
      message: 'Entreprises affectées avec succès'
    };
  }

  /**
   * Récupérer les entreprises affectées à une configuration
   */
  @Get(':id/companies')
  async getConfigurationCompanies(@Param('id') configId: string) {
    const companies = await this.mailConfigurationService.getConfigurationCompanies(configId);
    
    return {
      success: true,
      data: companies
    };
  }
}