import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailTemplate, TemplateType } from './entities/mail-template.entity';
import { Company } from '../companies/entities/company.entity';

export interface CreateMailTemplateDto {
  template_type: TemplateType;
  subject: string;
  html_body: string;
  text_body?: string;
  is_active?: boolean;
  is_default?: boolean;
  company_id?: string;
  description?: string;
}

export interface UpdateMailTemplateDto extends Partial<CreateMailTemplateDto> {}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

@Injectable()
export class MailTemplateService {
  constructor(
    @InjectRepository(MailTemplate)
    private templateRepository: Repository<MailTemplate>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  // Variables disponibles par type de template
  private getTemplateVariables(templateType: TemplateType): TemplateVariable[] {
    const commonVariables: TemplateVariable[] = [
      { name: '{{company_name}}', description: 'Nom de l\'entreprise', example: 'RH Analytics Pro' },
      { name: '{{app_name}}', description: 'Nom de l\'application', example: 'RH Analytics Pro' },
      { name: '{{support_email}}', description: 'Email de support', example: 'support@rh-analytics.com' },
      { name: '{{base_url}}', description: 'URL de base de l\'application', example: 'https://app.rh-analytics.com' },
    ];

    const specificVariables: { [key in TemplateType]: TemplateVariable[] } = {
      [TemplateType.CONFIRM_SIGNUP]: [
        { name: '{{user_name}}', description: 'Nom de l\'utilisateur', example: 'Jean Dupont' },
        { name: '{{user_email}}', description: 'Email de l\'utilisateur', example: 'jean@exemple.com' },
        { name: '{{confirmation_url}}', description: 'URL de confirmation', example: 'https://app.rh-analytics.com/confirm?token=abc123' },
        { name: '{{token}}', description: 'Token de confirmation', example: 'abc123xyz' },
      ],
      [TemplateType.INVITE_USER]: [
        { name: '{{user_name}}', description: 'Nom de l\'utilisateur invité', example: 'Marie Martin' },
        { name: '{{user_email}}', description: 'Email de l\'utilisateur invité', example: 'marie@exemple.com' },
        { name: '{{inviter_name}}', description: 'Nom de la personne qui invite', example: 'Admin RH' },
        { name: '{{invitation_url}}', description: 'URL d\'invitation', example: 'https://app.rh-analytics.com/invite?token=def456' },
        { name: '{{role}}', description: 'Rôle assigné', example: 'HR Manager' },
      ],
      [TemplateType.MAGIC_LINK]: [
        { name: '{{user_name}}', description: 'Nom de l\'utilisateur', example: 'Pierre Paul' },
        { name: '{{magic_link_url}}', description: 'URL du lien magique', example: 'https://app.rh-analytics.com/magic?token=ghi789' },
        { name: '{{expiry_time}}', description: 'Temps d\'expiration', example: '15 minutes' },
      ],
      [TemplateType.CHANGE_EMAIL]: [
        { name: '{{user_name}}', description: 'Nom de l\'utilisateur', example: 'Sophie Durand' },
        { name: '{{old_email}}', description: 'Ancien email', example: 'sophie.old@exemple.com' },
        { name: '{{new_email}}', description: 'Nouveau email', example: 'sophie.new@exemple.com' },
        { name: '{{confirmation_url}}', description: 'URL de confirmation', example: 'https://app.rh-analytics.com/change-email?token=jkl012' },
      ],
      [TemplateType.RESET_PASSWORD]: [
        { name: '{{user_name}}', description: 'Nom de l\'utilisateur', example: 'Antoine Moreau' },
        { name: '{{user_email}}', description: 'Email de l\'utilisateur', example: 'antoine@exemple.com' },
        { name: '{{reset_url}}', description: 'URL de réinitialisation', example: 'https://app.rh-analytics.com/reset?token=mno345' },
        { name: '{{expiry_time}}', description: 'Temps d\'expiration', example: '1 heure' },
      ],
      [TemplateType.REAUTHENTICATION]: [
        { name: '{{user_name}}', description: 'Nom de l\'utilisateur', example: 'Lucie Bernard' },
        { name: '{{login_url}}', description: 'URL de connexion', example: 'https://app.rh-analytics.com/login' },
        { name: '{{security_reason}}', description: 'Raison de la ré-authentification', example: 'Activité suspecte détectée' },
      ],
      [TemplateType.TEAM_REQUEST_NOTIFICATION]: [
        { name: '{{requester_name}}', description: 'Nom du demandeur', example: 'Équipe Marketing' },
        { name: '{{requester_email}}', description: 'Email du demandeur', example: 'marketing@entreprise.com' },
        { name: '{{project_name}}', description: 'Nom du projet', example: 'Recrutement Chef de Produit' },
        { name: '{{request_url}}', description: 'URL de la demande', example: 'https://app.rh-analytics.com/requests/123' },
        { name: '{{message}}', description: 'Message de la demande', example: 'Nous avons besoin d\'aide pour analyser les candidats...' },
      ],
      [TemplateType.CANDIDATE_ANALYSIS_COMPLETE]: [
        { name: '{{user_name}}', description: 'Nom de l\'utilisateur', example: 'Manager RH' },
        { name: '{{project_name}}', description: 'Nom du projet', example: 'Recrutement Développeur' },
        { name: '{{candidate_count}}', description: 'Nombre de candidats analysés', example: '12' },
        { name: '{{project_url}}', description: 'URL du projet', example: 'https://app.rh-analytics.com/projects/456' },
        { name: '{{analysis_summary}}', description: 'Résumé de l\'analyse', example: 'Score moyen: 8.5/10' },
      ],
      [TemplateType.PROJECT_SHARED]: [
        { name: '{{user_name}}', description: 'Nom de l\'utilisateur', example: 'Partenaire RH' },
        { name: '{{project_name}}', description: 'Nom du projet partagé', example: 'Analyse Candidats Stage' },
        { name: '{{shared_by}}', description: 'Partagé par', example: 'Direction RH' },
        { name: '{{share_url}}', description: 'URL de partage', example: 'https://app.rh-analytics.com/shared/789' },
        { name: '{{access_level}}', description: 'Niveau d\'accès', example: 'Lecture seule' },
      ],
    };

    return [...commonVariables, ...specificVariables[templateType]];
  }

  // CRUD Operations
  async getAllTemplates(companyId?: string): Promise<MailTemplate[]> {
    const queryBuilder = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.company', 'company')
      .orderBy('template.template_type', 'ASC')
      .addOrderBy('template.created_at', 'DESC');

    if (companyId) {
      queryBuilder.where('template.company_id = :companyId OR template.company_id IS NULL', { companyId });
    } else {
      // Pour les super admin, voir tous les templates
    }

    return queryBuilder.getMany();
  }

  async getTemplateById(id: string): Promise<MailTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!template) {
      throw new NotFoundException('Template introuvable');
    }

    return template;
  }

  async getTemplateByType(templateType: TemplateType, companyId?: string): Promise<MailTemplate | null> {
    let template: MailTemplate | null = null;

    // D'abord chercher un template spécifique à l'entreprise
    if (companyId) {
      template = await this.templateRepository.findOne({
        where: { 
          template_type: templateType, 
          company_id: companyId,
          is_active: true 
        }
      });
    }

    // Si pas trouvé, chercher le template par défaut
    if (!template) {
      template = await this.templateRepository.findOne({
        where: { 
          template_type: templateType, 
          is_default: true,
          is_active: true 
        }
      });
    }

    // En dernier recours, prendre le premier template actif de ce type
    if (!template) {
      template = await this.templateRepository.findOne({
        where: { 
          template_type: templateType,
          is_active: true 
        },
        order: { created_at: 'ASC' }
      });
    }

    return template;
  }

  async createTemplate(createDto: CreateMailTemplateDto): Promise<MailTemplate> {
    // Vérifier si un template par défaut existe déjà pour ce type
    if (createDto.is_default) {
      const existingDefault = await this.templateRepository.findOne({
        where: { template_type: createDto.template_type, is_default: true }
      });

      if (existingDefault) {
        existingDefault.is_default = false;
        await this.templateRepository.save(existingDefault);
      }
    }

    // Ajouter les variables disponibles pour ce type
    const availableVariables = JSON.stringify(this.getTemplateVariables(createDto.template_type));

    const template = this.templateRepository.create({
      ...createDto,
      available_variables: availableVariables
    });

    return this.templateRepository.save(template);
  }

  async updateTemplate(id: string, updateDto: UpdateMailTemplateDto): Promise<MailTemplate> {
    const template = await this.getTemplateById(id);

    // Si on définit ce template comme par défaut, enlever le flag des autres
    if (updateDto.is_default && !template.is_default) {
      await this.templateRepository.update(
        { template_type: template.template_type, is_default: true },
        { is_default: false }
      );
    }

    Object.assign(template, updateDto);
    return this.templateRepository.save(template);
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.getTemplateById(id);
    
    if (template.is_default) {
      throw new BadRequestException('Impossible de supprimer le template par défaut');
    }

    await this.templateRepository.remove(template);
  }

  async duplicateTemplate(id: string, newSubject?: string): Promise<MailTemplate> {
    const template = await this.getTemplateById(id);
    
    const duplicatedTemplate = this.templateRepository.create({
      template_type: template.template_type,
      subject: newSubject || `${template.subject} (Copie)`,
      html_body: template.html_body,
      text_body: template.text_body,
      is_active: false,
      is_default: false,
      company_id: template.company_id,
      description: template.description,
      available_variables: template.available_variables
    });

    return this.templateRepository.save(duplicatedTemplate);
  }

  // Méthode pour remplacer les variables dans un template
  async renderTemplate(templateType: TemplateType, variables: Record<string, string>, companyId?: string): Promise<{subject: string, html: string, text?: string}> {
    const template = await this.getTemplateByType(templateType, companyId);
    
    if (!template) {
      throw new NotFoundException(`Template de type ${templateType} introuvable`);
    }

    const renderString = (str: string, vars: Record<string, string>): string => {
      return Object.entries(vars).reduce((result, [key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        return result.replace(regex, value || '');
      }, str);
    };

    return {
      subject: renderString(template.subject, variables),
      html: renderString(template.html_body, variables),
      text: template.text_body ? renderString(template.text_body, variables) : undefined
    };
  }

  // Obtenir les variables disponibles pour un type de template
  async getAvailableVariables(templateType: TemplateType): Promise<TemplateVariable[]> {
    return this.getTemplateVariables(templateType);
  }

  // Créer les templates par défaut
  async createDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        template_type: TemplateType.CONFIRM_SIGNUP,
        subject: 'Confirmez votre inscription - {{app_name}}',
        html_body: `
          <h2>Bienvenue {{user_name}} !</h2>
          <p>Merci de vous être inscrit sur {{app_name}}.</p>
          <p>Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
          <a href="{{confirmation_url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirmer mon compte</a>
          <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
          <p>{{confirmation_url}}</p>
          <p>Ce lien expire dans 24 heures.</p>
          <p>Cordialement,<br>L'équipe {{company_name}}</p>
        `,
        description: 'Template pour la confirmation d\'inscription d\'un nouvel utilisateur',
        is_default: true
      },
      {
        template_type: TemplateType.INVITE_USER,
        subject: 'Invitation à rejoindre {{company_name}} sur {{app_name}}',
        html_body: `
          <h2>Vous êtes invité(e) à rejoindre {{company_name}} !</h2>
          <p>Bonjour {{user_name}},</p>
          <p>{{inviter_name}} vous invite à rejoindre l'équipe {{company_name}} sur {{app_name}}.</p>
          <p>Votre rôle sera : <strong>{{role}}</strong></p>
          <p>Pour accepter cette invitation et créer votre compte, cliquez sur le lien ci-dessous :</p>
          <a href="{{invitation_url}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accepter l'invitation</a>
          <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
          <p>{{invitation_url}}</p>
          <p>Cette invitation expire dans 7 jours.</p>
          <p>À bientôt sur {{app_name}} !</p>
          <p>L'équipe {{company_name}}</p>
        `,
        description: 'Template pour inviter un nouvel utilisateur à rejoindre l\'équipe',
        is_default: true
      },
      {
        template_type: TemplateType.RESET_PASSWORD,
        subject: 'Réinitialisation de votre mot de passe - {{app_name}}',
        html_body: `
          <h2>Réinitialisation de mot de passe</h2>
          <p>Bonjour {{user_name}},</p>
          <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte {{user_email}}.</p>
          <p>Pour créer un nouveau mot de passe, cliquez sur le lien ci-dessous :</p>
          <a href="{{reset_url}}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a>
          <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
          <p>{{reset_url}}</p>
          <p>Ce lien expire dans {{expiry_time}}.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p>
          <p>Cordialement,<br>L'équipe {{company_name}}</p>
        `,
        description: 'Template pour la réinitialisation de mot de passe',
        is_default: true
      }
    ];

    for (const templateData of defaultTemplates) {
      const existing = await this.templateRepository.findOne({
        where: { template_type: templateData.template_type, is_default: true }
      });

      if (!existing) {
        await this.createTemplate(templateData);
      }
    }
  }
}