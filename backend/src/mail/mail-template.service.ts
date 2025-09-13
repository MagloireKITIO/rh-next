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

  // ✅ SUPPRESSION TOTALE DU SYSTÈME STATIQUE
  // Les variables sont maintenant gérées dynamiquement par le MailAutomationService

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

    // ✅ Plus de variables statiques - tout est dynamique maintenant

    const template = this.templateRepository.create({
      ...createDto,
      available_variables: null // ✅ Plus de variables statiques stockées
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

  // ✅ MÉTHODE SUPPRIMÉE - Variables maintenant gérées par le système d'automatisation dynamique
  // Utiliser MailAutomationService.getAvailableVariables() à la place

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