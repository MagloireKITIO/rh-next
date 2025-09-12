import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  Patch
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { MailService, CreateMailConfigDto, UpdateMailConfigDto } from './mail.service';

@Controller('admin/mail-configs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get()
  async getAllConfigurations() {
    const configs = await this.mailService.getAllConfigurations();
    return { data: configs };
  }

  @Get(':id')
  async getConfigurationById(@Param('id') id: string) {
    const config = await this.mailService.getConfigurationById(id);
    return { data: config };
  }

  @Post()
  async createConfiguration(@Body() createDto: CreateMailConfigDto) {
    const config = await this.mailService.createConfiguration(createDto);
    return { data: config, message: 'Configuration créée avec succès' };
  }

  @Put(':id')
  async updateConfiguration(
    @Param('id') id: string,
    @Body() updateDto: UpdateMailConfigDto
  ) {
    const config = await this.mailService.updateConfiguration(id, updateDto);
    return { data: config, message: 'Configuration mise à jour avec succès' };
  }

  @Delete(':id')
  async deleteConfiguration(@Param('id') id: string) {
    await this.mailService.deleteConfiguration(id);
    return { message: 'Configuration supprimée avec succès' };
  }

  @Patch(':id/toggle')
  async toggleConfigurationStatus(@Param('id') id: string) {
    const config = await this.mailService.toggleConfigurationStatus(id);
    return { 
      data: config, 
      message: `Configuration ${config.is_active ? 'activée' : 'désactivée'} avec succès` 
    };
  }

  @Post(':id/assign-companies')
  async assignCompaniesToConfiguration(
    @Param('id') configId: string,
    @Body() body: { companyIds: string[] }
  ) {
    await this.mailService.assignCompaniesToConfiguration(configId, body.companyIds);
    return { message: 'Entreprises assignées avec succès' };
  }

  @Get(':id/companies')
  async getConfigurationCompanies(@Param('id') configId: string) {
    const companies = await this.mailService.getConfigurationCompanies(configId);
    return { data: companies };
  }
}

@Controller('admin/mail-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class MailTestController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  async testMailConfiguration(
    @Body() body: { email: string; company_id?: string }
  ) {
    await this.mailService.sendTestEmail(body.email, body.company_id);
    return { message: 'Email de test envoyé avec succès' };
  }

  @Get('status')
  async getMailConfigurationStatus() {
    const configs = await this.mailService.getAllConfigurations();
    const activeConfigs = configs.filter(c => c.is_active);
    const defaultConfig = configs.find(c => c.is_default);
    
    return {
      data: {
        totalConfigs: configs.length,
        activeConfigs: activeConfigs.length,
        hasDefault: !!defaultConfig,
        defaultConfig: defaultConfig || null
      }
    };
  }
}