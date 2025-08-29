import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailTemplate, MailTemplateType, MailTemplateStatus } from './entities/mail-template.entity';
import { CreateMailTemplateDto } from './dto/create-mail-template.dto';
import { UpdateMailTemplateDto } from './dto/update-mail-template.dto';

@Injectable()
export class MailTemplateService {
  constructor(
    @InjectRepository(MailTemplate)
    private mailTemplateRepository: Repository<MailTemplate>,
  ) {}

  async findAll(companyId?: string): Promise<MailTemplate[]> {
    const query = this.mailTemplateRepository.createQueryBuilder('template')
      .where('(template.company_id = :companyId OR template.company_id IS NULL)', { companyId })
      .orderBy('template.type', 'ASC')
      .addOrderBy('template.is_default', 'DESC')
      .addOrderBy('template.created_at', 'DESC');

    return await query.getMany();
  }

  async findByType(type: MailTemplateType, companyId?: string): Promise<MailTemplate[]> {
    const query = this.mailTemplateRepository.createQueryBuilder('template')
      .where('template.type = :type', { type })
      .andWhere('(template.company_id = :companyId OR template.company_id IS NULL)', { companyId })
      .orderBy('template.is_default', 'DESC')
      .addOrderBy('template.created_at', 'DESC');

    return await query.getMany();
  }

  async findActiveByType(type: MailTemplateType, companyId?: string): Promise<MailTemplate | null> {
    // D'abord chercher un template actif spécifique à l'entreprise
    if (companyId) {
      const companyTemplate = await this.mailTemplateRepository.findOne({
        where: {
          type,
          company_id: companyId,
          status: MailTemplateStatus.ACTIVE
        },
        order: {
          is_default: 'DESC',
          created_at: 'DESC'
        }
      });

      if (companyTemplate) {
        return companyTemplate;
      }
    }

    // Sinon, chercher un template par défaut global
    return await this.mailTemplateRepository.findOne({
      where: {
        type,
        company_id: null,
        status: MailTemplateStatus.ACTIVE,
        is_default: true
      }
    });
  }

  async findOne(id: string): Promise<MailTemplate> {
    const template = await this.mailTemplateRepository.findOne({
      where: { id },
      relations: ['company']
    });

    if (!template) {
      throw new NotFoundException('Template non trouvé');
    }

    return template;
  }

  async create(createDto: CreateMailTemplateDto): Promise<MailTemplate> {
    // Vérifier s'il y a déjà un template par défaut pour ce type
    if (createDto.is_default) {
      const existingDefault = await this.mailTemplateRepository.findOne({
        where: {
          type: createDto.type,
          company_id: createDto.company_id || null,
          is_default: true
        }
      });

      if (existingDefault) {
        // Désactiver l'ancien template par défaut
        await this.mailTemplateRepository.update(existingDefault.id, { is_default: false });
      }
    }

    const template = this.mailTemplateRepository.create({
      ...createDto,
      version: 1
    });

    return await this.mailTemplateRepository.save(template);
  }

  async update(id: string, updateDto: UpdateMailTemplateDto): Promise<MailTemplate> {
    const template = await this.findOne(id);

    // Vérifier s'il y a déjà un template par défaut pour ce type
    if (updateDto.is_default && !template.is_default) {
      const existingDefault = await this.mailTemplateRepository.findOne({
        where: {
          type: template.type,
          company_id: template.company_id || null,
          is_default: true
        }
      });

      if (existingDefault) {
        // Désactiver l'ancien template par défaut
        await this.mailTemplateRepository.update(existingDefault.id, { is_default: false });
      }
    }

    // Incrémenter la version si le contenu change
    if (updateDto.html_content || updateDto.text_content || updateDto.subject) {
      updateDto.version = template.version + 1;
    }

    await this.mailTemplateRepository.update(id, updateDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    
    if (template.is_default) {
      throw new BadRequestException('Impossible de supprimer un template par défaut');
    }

    await this.mailTemplateRepository.remove(template);
  }

  async duplicate(id: string, name?: string): Promise<MailTemplate> {
    const original = await this.findOne(id);
    
    const duplicated = this.mailTemplateRepository.create({
      ...original,
      id: undefined,
      name: name || `${original.name} (Copie)`,
      is_default: false,
      status: MailTemplateStatus.DRAFT,
      version: 1,
      created_at: undefined,
      updated_at: undefined
    });

    return await this.mailTemplateRepository.save(duplicated);
  }

  async setAsDefault(id: string): Promise<MailTemplate> {
    const template = await this.findOne(id);

    // Désactiver tous les autres templates par défaut du même type
    await this.mailTemplateRepository.update(
      {
        type: template.type,
        company_id: template.company_id || null,
        is_default: true
      },
      { is_default: false }
    );

    // Activer ce template comme défaut
    await this.mailTemplateRepository.update(id, { 
      is_default: true,
      status: MailTemplateStatus.ACTIVE
    });

    return await this.findOne(id);
  }

  async previewTemplate(id: string, variables: Record<string, any> = {}): Promise<{
    subject: string;
    html_content: string;
    text_content?: string;
  }> {
    const template = await this.findOne(id);

    return {
      subject: this.processTemplateVariables(template.subject, variables),
      html_content: this.processTemplateVariables(template.html_content, variables),
      text_content: template.text_content 
        ? this.processTemplateVariables(template.text_content, variables)
        : undefined
    };
  }

  private processTemplateVariables(content: string, variables: Record<string, any>): string {
    let processed = content;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, variables[key] || '');
    });
    
    return processed;
  }

  async getTemplateTypes(): Promise<{ type: string; label: string; description: string }[]> {
    return [
      {
        type: MailTemplateType.INVITATION,
        label: 'Invitation',
        description: 'Templates pour les invitations utilisateur'
      },
      {
        type: MailTemplateType.VERIFICATION,
        label: 'Vérification',
        description: 'Templates pour la vérification d\'email'
      },
      {
        type: MailTemplateType.PASSWORD_RESET,
        label: 'Réinitialisation',
        description: 'Templates pour la réinitialisation de mot de passe'
      },
      {
        type: MailTemplateType.WELCOME,
        label: 'Bienvenue',
        description: 'Templates de bienvenue'
      },
      {
        type: MailTemplateType.NOTIFICATION,
        label: 'Notification',
        description: 'Templates de notification'
      },
      {
        type: MailTemplateType.CUSTOM,
        label: 'Personnalisé',
        description: 'Templates personnalisés'
      }
    ];
  }
}