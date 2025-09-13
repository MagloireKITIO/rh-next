import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailAutomation, VisibilityType } from './entities/mail-automation.entity';
import { AutomationLog, AutomationLogStatus } from './entities/automation-log.entity';
import { CreateMailAutomationDto, UpdateMailAutomationDto } from './dto/create-automation.dto';
import { UserRole } from '../auth/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Company } from '../companies/entities/company.entity';

@Injectable()
export class MailAutomationService {
  constructor(
    @InjectRepository(MailAutomation)
    private mailAutomationRepository: Repository<MailAutomation>,
    @InjectRepository(AutomationLog)
    private automationLogRepository: Repository<AutomationLog>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createDto: CreateMailAutomationDto, userId: string, userRole: UserRole, companyId?: string) {
    const automation = this.mailAutomationRepository.create({
      ...createDto,
      user_id: userId,
      company_id: userRole === UserRole.SUPER_ADMIN ? createDto.company_id : companyId,
    });

    const savedAutomation = await this.mailAutomationRepository.save(automation);
    
    // Emit event for signal registration if needed
    this.eventEmitter.emit('automation.created', { automation: savedAutomation });
    
    return savedAutomation;
  }

  async findAll(userRole: UserRole, companyId?: string) {
    const query = this.mailAutomationRepository.createQueryBuilder('automation')
      .leftJoinAndSelect('automation.mail_template', 'template')
      .leftJoinAndSelect('automation.user', 'user')
      .leftJoinAndSelect('automation.company', 'company');

    if (userRole === UserRole.SUPER_ADMIN) {
      // SuperAdmin voit tout
      return await query.getMany();
    } else {
      // AdminRH/RH voient seulement leur entreprise
      query.where('automation.company_id = :companyId', { companyId });
      query.andWhere('automation.visibility = :visibility', { visibility: VisibilityType.COMPANY });
      return await query.getMany();
    }
  }

  async findOne(id: string, userRole: UserRole, companyId?: string) {
    const query = this.mailAutomationRepository.createQueryBuilder('automation')
      .leftJoinAndSelect('automation.mail_template', 'template')
      .leftJoinAndSelect('automation.user', 'user')
      .leftJoinAndSelect('automation.company', 'company')
      .where('automation.id = :id', { id });

    if (userRole !== UserRole.SUPER_ADMIN) {
      query.andWhere('automation.company_id = :companyId', { companyId });
    }

    const automation = await query.getOne();
    
    if (!automation) {
      throw new NotFoundException('Automatisation non trouvée');
    }

    return automation;
  }

  async update(id: string, updateDto: UpdateMailAutomationDto, userRole: UserRole, companyId?: string) {
    const automation = await this.findOne(id, userRole, companyId);
    
    Object.assign(automation, updateDto);
    const updatedAutomation = await this.mailAutomationRepository.save(automation);
    
    // Emit event for signal re-registration if needed
    this.eventEmitter.emit('automation.updated', { automation: updatedAutomation });
    
    return updatedAutomation;
  }

  async remove(id: string, userRole: UserRole, companyId?: string) {
    const automation = await this.findOne(id, userRole, companyId);
    
    // Emit event for signal deregistration
    this.eventEmitter.emit('automation.deleted', { automation });
    
    await this.mailAutomationRepository.remove(automation);
    return { message: 'Automatisation supprimée avec succès' };
  }

  async toggleStatus(id: string, userRole: UserRole, companyId?: string) {
    const automation = await this.findOne(id, userRole, companyId);
    
    automation.is_active = !automation.is_active;
    const updatedAutomation = await this.mailAutomationRepository.save(automation);
    
    // Emit event for signal registration/deregistration
    this.eventEmitter.emit('automation.toggled', { automation: updatedAutomation });
    
    return updatedAutomation;
  }

  // Stats pour le dashboard
  async getStats(userRole: UserRole, companyId?: string) {
    // Query pour le total
    let totalQuery = this.mailAutomationRepository.createQueryBuilder('automation');
    if (userRole !== UserRole.SUPER_ADMIN) {
      totalQuery.where('automation.company_id = :companyId', { companyId });
    }
    const total = await totalQuery.getCount();

    // Query séparée pour les actives
    let activeQuery = this.mailAutomationRepository.createQueryBuilder('automation');
    if (userRole !== UserRole.SUPER_ADMIN) {
      activeQuery.where('automation.company_id = :companyId', { companyId });
    }
    activeQuery.andWhere('automation.is_active = true');
    const active = await activeQuery.getCount();

    // Logs de cette semaine
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let logQuery = this.automationLogRepository.createQueryBuilder('log')
      .leftJoin('log.automation', 'automation')
      .where('log.created_at >= :oneWeekAgo', { oneWeekAgo });

    if (userRole !== UserRole.SUPER_ADMIN) {
      logQuery.andWhere('automation.company_id = :companyId', { companyId });
    }

    const thisWeek = await logQuery.getCount();

    // Query séparée pour les erreurs
    let errorQuery = this.automationLogRepository.createQueryBuilder('log')
      .leftJoin('log.automation', 'automation')
      .where('log.created_at >= :oneWeekAgo', { oneWeekAgo })
      .andWhere('log.status = :status', { status: AutomationLogStatus.ERROR });

    if (userRole !== UserRole.SUPER_ADMIN) {
      errorQuery.andWhere('automation.company_id = :companyId', { companyId });
    }

    const errors = await errorQuery.getCount();

    return {
      total,
      active,
      thisWeek,
      errors,
    };
  }

  // Logs récents
  async getRecentLogs(userRole: UserRole, companyId?: string, limit = 10) {
    let query = this.automationLogRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.automation', 'automation')
      .orderBy('log.created_at', 'DESC')
      .limit(limit);

    if (userRole !== UserRole.SUPER_ADMIN) {
      query.where('automation.company_id = :companyId', { companyId });
    }

    return await query.getMany();
  }

  // Méthode pour logger l'exécution d'une automation
  async logExecution(automationId: string, entityId: string, entityType: string, status: AutomationLogStatus, errorMessage?: string, emailSentTo?: string, contextData?: Record<string, any>) {
    const log = this.automationLogRepository.create({
      automation_id: automationId,
      entity_id: entityId,
      entity_type: entityType,
      status,
      error_message: errorMessage,
      email_sent_to: emailSentTo,
      context_data: contextData,
    });

    return await this.automationLogRepository.save(log);
  }

  // Méthode pour récupérer les automatisations actives pour un type d'entité et un trigger
  async getActiveAutomationsForTrigger(entityType: string, triggerType: string, companyId?: string) {
    const query = this.mailAutomationRepository.createQueryBuilder('automation')
      .leftJoinAndSelect('automation.mail_template', 'template')
      .where('automation.target_entity = :entityType', { entityType })
      .andWhere('automation.trigger_type = :triggerType', { triggerType })
      .andWhere('automation.is_active = true');

    if (companyId) {
      query.andWhere('(automation.company_id = :companyId OR automation.visibility = :systemVisibility)', {
        companyId,
        systemVisibility: VisibilityType.SYSTEM
      });
    } else {
      query.andWhere('automation.visibility = :systemVisibility', {
        systemVisibility: VisibilityType.SYSTEM
      });
    }

    return await query.getMany();
  }

  async getAvailableVariables(entityType: string): Promise<any[]> {
    const variables = [];

    // Variables communes à toutes les entités
    const commonVariables = [
      { name: '{{recipient}}', description: 'Email du destinataire', example: 'user@example.com' },
      { name: '{{current_date}}', description: 'Date actuelle', example: '13/09/2025' },
      { name: '{{current_time}}', description: 'Heure actuelle', example: '14:30:00' },
      { name: '{{current_datetime}}', description: 'Date et heure actuelles', example: '13/09/2025 14:30:00' },
    ];

    // Variables spécifiques selon le type d'entité
    const entityVariables: Record<string, any[]> = {
      candidates: [
        // Formats multiples pour maximum de compatibilité
        { name: '{{name}}', description: 'Nom du candidat', example: 'Jean Dupont' },
        { name: '{{candidate_name}}', description: 'Nom du candidat', example: 'Jean Dupont' },
        { name: '{{candidateName}}', description: 'Nom du candidat', example: 'Jean Dupont' },
        { name: '{{email}}', description: 'Email du candidat', example: 'jean@example.com' },
        { name: '{{candidate_email}}', description: 'Email du candidat', example: 'jean@example.com' },
        { name: '{{candidateEmail}}', description: 'Email du candidat', example: 'jean@example.com' },
        { name: '{{phone}}', description: 'Téléphone du candidat', example: '+33 1 23 45 67 89' },
        { name: '{{candidate_phone}}', description: 'Téléphone du candidat', example: '+33 1 23 45 67 89' },
        { name: '{{candidatePhone}}', description: 'Téléphone du candidat', example: '+33 1 23 45 67 89' },
        { name: '{{status}}', description: 'Statut du candidat', example: 'pending' },
        { name: '{{candidate_status}}', description: 'Statut du candidat', example: 'pending' },
        { name: '{{candidateStatus}}', description: 'Statut du candidat', example: 'pending' },
        { name: '{{score}}', description: 'Score du candidat', example: '85' },
        { name: '{{candidate_score}}', description: 'Score du candidat', example: '85' },
        { name: '{{candidateScore}}', description: 'Score du candidat', example: '85' },
        { name: '{{cv_url}}', description: 'URL du CV', example: 'https://example.com/cv.pdf' },
        { name: '{{candidate_cv_url}}', description: 'URL du CV', example: 'https://example.com/cv.pdf' },
        { name: '{{candidateCvUrl}}', description: 'URL du CV', example: 'https://example.com/cv.pdf' },
        // Variables liées au projet/poste
        { name: '{{position_title}}', description: 'Titre du poste', example: 'Développeur Full Stack' },
        { name: '{{project_name}}', description: 'Nom du projet', example: 'Recrutement Dev 2025' },
        { name: '{{projectName}}', description: 'Nom du projet', example: 'Recrutement Dev 2025' },
        { name: '{{project_description}}', description: 'Description du projet', example: 'Poste de développeur pour notre équipe' },
        { name: '{{projectDescription}}', description: 'Description du projet', example: 'Poste de développeur pour notre équipe' },
      ],
      projects: [
        { name: '{{name}}', description: 'Nom du projet', example: 'Recrutement CTO' },
        { name: '{{project_name}}', description: 'Nom du projet', example: 'Recrutement CTO' },
        { name: '{{projectName}}', description: 'Nom du projet', example: 'Recrutement CTO' },
        { name: '{{description}}', description: 'Description du projet', example: 'Recherche d\'un CTO expérimenté' },
        { name: '{{project_description}}', description: 'Description du projet', example: 'Recherche d\'un CTO expérimenté' },
        { name: '{{projectDescription}}', description: 'Description du projet', example: 'Recherche d\'un CTO expérimenté' },
        { name: '{{status}}', description: 'Statut du projet', example: 'active' },
        { name: '{{project_status}}', description: 'Statut du projet', example: 'active' },
        { name: '{{projectStatus}}', description: 'Statut du projet', example: 'active' },
        { name: '{{budget}}', description: 'Budget du projet', example: '50000' },
        { name: '{{project_budget}}', description: 'Budget du projet', example: '50000' },
        { name: '{{projectBudget}}', description: 'Budget du projet', example: '50000' },
      ],
      companies: [
        { name: '{{name}}', description: 'Nom de l\'entreprise', example: 'Tech Solutions SA' },
        { name: '{{company_name}}', description: 'Nom de l\'entreprise', example: 'Tech Solutions SA' },
        { name: '{{companyName}}', description: 'Nom de l\'entreprise', example: 'Tech Solutions SA' },
        { name: '{{email}}', description: 'Email de l\'entreprise', example: 'contact@techsolutions.fr' },
        { name: '{{company_email}}', description: 'Email de l\'entreprise', example: 'contact@techsolutions.fr' },
        { name: '{{companyEmail}}', description: 'Email de l\'entreprise', example: 'contact@techsolutions.fr' },
        { name: '{{phone}}', description: 'Téléphone de l\'entreprise', example: '+33 1 23 45 67 89' },
        { name: '{{company_phone}}', description: 'Téléphone de l\'entreprise', example: '+33 1 23 45 67 89' },
        { name: '{{companyPhone}}', description: 'Téléphone de l\'entreprise', example: '+33 1 23 45 67 89' },
        { name: '{{address}}', description: 'Adresse de l\'entreprise', example: '123 Rue de la Tech, Paris' },
        { name: '{{company_address}}', description: 'Adresse de l\'entreprise', example: '123 Rue de la Tech, Paris' },
        { name: '{{companyAddress}}', description: 'Adresse de l\'entreprise', example: '123 Rue de la Tech, Paris' },
      ],
      users: [
        { name: '{{name}}', description: 'Nom de l\'utilisateur', example: 'Marie Dubois' },
        { name: '{{user_name}}', description: 'Nom de l\'utilisateur', example: 'Marie Dubois' },
        { name: '{{userName}}', description: 'Nom de l\'utilisateur', example: 'Marie Dubois' },
        { name: '{{email}}', description: 'Email de l\'utilisateur', example: 'marie@example.com' },
        { name: '{{user_email}}', description: 'Email de l\'utilisateur', example: 'marie@example.com' },
        { name: '{{userEmail}}', description: 'Email de l\'utilisateur', example: 'marie@example.com' },
        { name: '{{role}}', description: 'Rôle de l\'utilisateur', example: 'hr' },
        { name: '{{user_role}}', description: 'Rôle de l\'utilisateur', example: 'hr' },
        { name: '{{userRole}}', description: 'Rôle de l\'utilisateur', example: 'hr' },
      ]
    };

    // Ajouter les variables communes
    variables.push(...commonVariables);

    // Ajouter les variables spécifiques à l'entité
    if (entityVariables[entityType]) {
      variables.push(...entityVariables[entityType]);
    }

    // Variables entreprise toujours disponibles
    const companyVariables = [
      { name: '{{company_name}}', description: 'Nom de l\'entreprise', example: 'Votre Entreprise' },
      { name: '{{companyName}}', description: 'Nom de l\'entreprise', example: 'Votre Entreprise' },
      { name: '{{company_email}}', description: 'Email de l\'entreprise', example: 'contact@entreprise.com' },
      { name: '{{companyEmail}}', description: 'Email de l\'entreprise', example: 'contact@entreprise.com' },
      { name: '{{company_address}}', description: 'Adresse de l\'entreprise', example: '123 Rue de l\'Entreprise' },
      { name: '{{companyAddress}}', description: 'Adresse de l\'entreprise', example: '123 Rue de l\'Entreprise' },
    ];

    variables.push(...companyVariables);

    return variables;
  }
}