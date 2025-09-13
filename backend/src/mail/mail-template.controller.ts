import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../auth/entities/user.entity';
import { 
  MailTemplateService, 
  CreateMailTemplateDto, 
  UpdateMailTemplateDto 
} from './mail-template.service';
import { TemplateType } from './entities/mail-template.entity';

@Controller('admin/mail-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class MailTemplateController {
  constructor(private readonly templateService: MailTemplateService) {}

  @Get()
  async getAllTemplates(@CurrentUser() user: User, @Query('company_id') companyId?: string) {
    // Les super admin peuvent voir tous les templates
    // Les admin ne voient que ceux de leur entreprise
    const effectiveCompanyId = user.role === UserRole.SUPER_ADMIN ? companyId : user.company_id;
    
    const templates = await this.templateService.getAllTemplates(effectiveCompanyId);
    return { data: templates };
  }

  @Get('types')
  async getTemplateTypes() {
    const types = Object.values(TemplateType).map(type => ({
      value: type,
      label: this.getTypeLabel(type),
      description: this.getTypeDescription(type)
    }));
    
    return { data: types };
  }

  // ✅ ENDPOINT SUPPRIMÉ - Variables maintenant gérées dynamiquement
  // Utiliser GET /admin/mail-automations/available-variables/:entityType à la place

  @Get(':id')
  async getTemplateById(@Param('id') id: string) {
    const template = await this.templateService.getTemplateById(id);
    return { data: template };
  }

  @Post()
  async createTemplate(
    @Body() createDto: CreateMailTemplateDto,
    @CurrentUser() user: User
  ) {
    // Si pas de company_id spécifié et que c'est un admin, utiliser son entreprise
    if (!createDto.company_id && user.role === UserRole.ADMIN) {
      createDto.company_id = user.company_id;
    }

    const template = await this.templateService.createTemplate(createDto);
    return { data: template, message: 'Template créé avec succès' };
  }

  @Put(':id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateMailTemplateDto
  ) {
    const template = await this.templateService.updateTemplate(id, updateDto);
    return { data: template, message: 'Template mis à jour avec succès' };
  }

  @Delete(':id')
  async deleteTemplate(@Param('id') id: string) {
    await this.templateService.deleteTemplate(id);
    return { message: 'Template supprimé avec succès' };
  }

  @Post(':id/duplicate')
  async duplicateTemplate(
    @Param('id') id: string,
    @Body() body: { subject?: string }
  ) {
    const template = await this.templateService.duplicateTemplate(id, body.subject);
    return { data: template, message: 'Template dupliqué avec succès' };
  }

  @Post('render')
  async renderTemplate(
    @Body() body: {
      template_type: TemplateType;
      variables: Record<string, string>;
      company_id?: string;
    }
  ) {
    const rendered = await this.templateService.renderTemplate(
      body.template_type,
      body.variables,
      body.company_id
    );
    return { data: rendered };
  }

  @Post('create-defaults')
  @Roles(UserRole.SUPER_ADMIN)
  async createDefaultTemplates() {
    await this.templateService.createDefaultTemplates();
    return { message: 'Templates par défaut créés avec succès' };
  }

  private getTypeLabel(type: TemplateType): string {
    const labels: Record<TemplateType, string> = {
      [TemplateType.CONFIRM_SIGNUP]: 'Confirmation d\'inscription',
      [TemplateType.INVITE_USER]: 'Invitation utilisateur',
      [TemplateType.MAGIC_LINK]: 'Lien magique',
      [TemplateType.CHANGE_EMAIL]: 'Changement d\'email',
      [TemplateType.RESET_PASSWORD]: 'Réinitialisation mot de passe',
      [TemplateType.REAUTHENTICATION]: 'Ré-authentification',
      [TemplateType.TEAM_REQUEST_NOTIFICATION]: 'Notification demande équipe',
      [TemplateType.CANDIDATE_ANALYSIS_COMPLETE]: 'Analyse candidat terminée',
      [TemplateType.CANDIDATE_APPLICATION]: 'Candidature reçue',
      [TemplateType.PROJECT_SHARED]: 'Projet partagé'
    };
    return labels[type] || type;
  }

  private getTypeDescription(type: TemplateType): string {
    const descriptions: Record<TemplateType, string> = {
      [TemplateType.CONFIRM_SIGNUP]: 'Email envoyé pour confirmer l\'inscription d\'un nouvel utilisateur',
      [TemplateType.INVITE_USER]: 'Email d\'invitation pour rejoindre une équipe',
      [TemplateType.MAGIC_LINK]: 'Email avec lien de connexion sans mot de passe',
      [TemplateType.CHANGE_EMAIL]: 'Email de confirmation pour changement d\'adresse email',
      [TemplateType.RESET_PASSWORD]: 'Email pour réinitialiser le mot de passe',
      [TemplateType.REAUTHENTICATION]: 'Email demandant une nouvelle authentification',
      [TemplateType.TEAM_REQUEST_NOTIFICATION]: 'Notification d\'une demande d\'équipe externe',
      [TemplateType.CANDIDATE_ANALYSIS_COMPLETE]: 'Notification de fin d\'analyse des candidats',
      [TemplateType.CANDIDATE_APPLICATION]: 'Email envoyé lors de la réception d\'une nouvelle candidature',
      [TemplateType.PROJECT_SHARED]: 'Notification de partage d\'un projet'
    };
    return descriptions[type] || '';
  }
}