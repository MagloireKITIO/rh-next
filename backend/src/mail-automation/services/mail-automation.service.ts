import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailAutomation, AutomationStatus } from '../entities/mail-automation.entity';
import { AutomationCondition } from '../entities/automation-condition.entity';
import { MailService } from '../../mail-configuration/mail.service';
import { MailTemplateService } from '../../mail-configuration/mail-template.service';
import { CreateMailAutomationDto } from '../dto/create-mail-automation.dto';
import { UpdateMailAutomationDto } from '../dto/update-mail-automation.dto';

@Injectable()
export class MailAutomationService {
  constructor(
    @InjectRepository(MailAutomation)
    private mailAutomationRepository: Repository<MailAutomation>,
    
    @InjectRepository(AutomationCondition)
    private automationConditionRepository: Repository<AutomationCondition>,
    
    private mailService: MailService,
    private mailTemplateService: MailTemplateService,
  ) {}

  /**
   * Créer une nouvelle automatisation
   */
  async create(createDto: CreateMailAutomationDto, userId: string): Promise<MailAutomation> {
    // Vérifier que le template existe
    const template = await this.mailTemplateService.findOne(createDto.mail_template_id);
    if (!template) {
      throw new NotFoundException('Template de mail non trouvé');
    }

    const automation = this.mailAutomationRepository.create({
      ...createDto,
      created_by: userId,
      status: AutomationStatus.DRAFT, // Par défaut en brouillon
    });

    const savedAutomation = await this.mailAutomationRepository.save(automation);

    // Créer les conditions si fournies
    if (createDto.conditions && createDto.conditions.length > 0) {
      const conditions = createDto.conditions.map((conditionDto, index) => 
        this.automationConditionRepository.create({
          ...conditionDto,
          mail_automation_id: savedAutomation.id,
          order: index,
        })
      );
      
      await this.automationConditionRepository.save(conditions);
    }

    return this.findOne(savedAutomation.id);
  }

  /**
   * Récupérer toutes les automatisations d'une entreprise
   */
  async findAll(companyId: string, includeInactive: boolean = false): Promise<MailAutomation[]> {
    const queryBuilder = this.mailAutomationRepository.createQueryBuilder('automation')
      .leftJoinAndSelect('automation.mail_template', 'template')
      .leftJoinAndSelect('automation.conditions', 'conditions')
      .leftJoinAndSelect('automation.created_by_user', 'user')
      .where('automation.company_id = :companyId', { companyId })
      .orderBy('automation.created_at', 'DESC');

    if (!includeInactive) {
      queryBuilder.andWhere('automation.status != :inactiveStatus', { 
        inactiveStatus: AutomationStatus.INACTIVE 
      });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Récupérer une automatisation par ID
   */
  async findOne(id: string): Promise<MailAutomation> {
    const automation = await this.mailAutomationRepository.findOne({
      where: { id },
      relations: [
        'mail_template',
        'conditions',
        'created_by_user',
        'company'
      ]
    });

    if (!automation) {
      throw new NotFoundException('Automatisation non trouvée');
    }

    return automation;
  }

  /**
   * Mettre à jour une automatisation
   */
  async update(id: string, updateDto: UpdateMailAutomationDto, userId: string): Promise<MailAutomation> {
    const automation = await this.findOne(id);

    // Vérifier que l'utilisateur a le droit de modifier
    if (automation.created_by !== userId) {
      throw new BadRequestException('Vous n\'avez pas le droit de modifier cette automatisation');
    }

    // Séparer les conditions du DTO pour éviter l'erreur TypeORM
    const { conditions, ...automationUpdateData } = updateDto;

    // Mettre à jour les champs de base de l'automatisation (sans les relations)
    await this.mailAutomationRepository.update(id, automationUpdateData);

    // Mettre à jour les conditions si fournies
    if (conditions !== undefined) {
      // Supprimer les anciennes conditions
      await this.automationConditionRepository.delete({ mail_automation_id: id });

      // Créer les nouvelles conditions
      if (conditions.length > 0) {
        const newConditions = conditions.map((conditionDto, index) => 
          this.automationConditionRepository.create({
            ...conditionDto,
            mail_automation_id: id,
            order: index,
          })
        );
        
        await this.automationConditionRepository.save(newConditions);
      }
    }

    return this.findOne(id);
  }

  /**
   * Activer/Désactiver une automatisation
   */
  async toggleStatus(id: string, userId: string): Promise<MailAutomation> {
    const automation = await this.findOne(id);

    if (automation.created_by !== userId) {
      throw new BadRequestException('Vous n\'avez pas le droit de modifier cette automatisation');
    }

    const newStatus = automation.status === AutomationStatus.ACTIVE 
      ? AutomationStatus.INACTIVE 
      : AutomationStatus.ACTIVE;

    await this.mailAutomationRepository.update(id, { status: newStatus });

    return this.findOne(id);
  }

  /**
   * Supprimer une automatisation
   */
  async remove(id: string, userId: string): Promise<void> {
    const automation = await this.findOne(id);

    if (automation.created_by !== userId) {
      throw new BadRequestException('Vous n\'avez pas le droit de supprimer cette automatisation');
    }

    await this.mailAutomationRepository.delete(id);
  }

  /**
   * Récupérer les automatisations actives pour un type d'entité et un déclencheur
   */
  async findActiveByTrigger(
    entityType: string,
    trigger: string,
    companyId: string
  ): Promise<MailAutomation[]> {
    return await this.mailAutomationRepository.find({
      where: {
        entity_type: entityType as any,
        trigger: trigger as any,
        company_id: companyId,
        status: AutomationStatus.ACTIVE,
      },
      relations: ['mail_template', 'conditions']
    });
  }

  /**
   * Mettre à jour les statistiques d'une automatisation
   */
  async updateStats(
    automationId: string, 
    success: boolean,
    triggeredAt: Date = new Date()
  ): Promise<void> {
    const automation = await this.mailAutomationRepository.findOne({
      where: { id: automationId }
    });

    if (automation) {
      await this.mailAutomationRepository.update(automationId, {
        sent_count: automation.sent_count + 1,
        success_count: success ? automation.success_count + 1 : automation.success_count,
        failed_count: success ? automation.failed_count : automation.failed_count + 1,
        last_triggered_at: triggeredAt,
      });
    }
  }

  /**
   * Obtenir les statistiques globales d'une entreprise
   */
  async getCompanyStats(companyId: string): Promise<{
    total_automations: number;
    active_automations: number;
    total_sent: number;
    success_rate: number;
  }> {
    const automations = await this.mailAutomationRepository.find({
      where: { company_id: companyId }
    });

    const total_automations = automations.length;
    const active_automations = automations.filter(a => a.status === AutomationStatus.ACTIVE).length;
    const total_sent = automations.reduce((sum, a) => sum + a.sent_count, 0);
    const total_success = automations.reduce((sum, a) => sum + a.success_count, 0);
    const success_rate = total_sent > 0 ? (total_success / total_sent) * 100 : 0;

    return {
      total_automations,
      active_automations,
      total_sent,
      success_rate: Math.round(success_rate * 100) / 100,
    };
  }
}