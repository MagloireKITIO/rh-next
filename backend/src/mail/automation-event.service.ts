import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailAutomationService } from './mail-automation.service';
import { MailService } from './mail.service';
import { TriggerType } from './entities/mail-automation.entity';
import { AutomationLogStatus } from './entities/automation-log.entity';
import { Project } from '../projects/entities/project.entity';

@Injectable()
export class AutomationEventService {
  constructor(
    private mailAutomationService: MailAutomationService,
    private mailService: MailService,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  // Gestionnaire générique d'événements d'entités - FONCTIONNE POUR TOUTE ENTITÉ
  async handleEntityEvent(event: {
    eventType: 'created' | 'updated' | 'deleted',
    entityType: string,
    entity: any,
    companyId?: string
  }) {
    console.log(`🎯 [AUTOMATION] Generic event ${event.entityType}.${event.eventType} triggered for: ${event.entity?.name || event.entity?.id}`, {
      entityId: event.entity?.id,
      entityName: event.entity?.name,
      entityType: event.entityType,
      companyId: event.companyId
    });

    let companyId = event.companyId;
    
    // Résolution automatique du companyId selon le type d'entité
    if (!companyId) {
      companyId = await this.resolveCompanyId(event.entityType, event.entity);
    }

    // Mapping du type d'événement
    const triggerType = this.mapEventTypeToTrigger(event.eventType);
    
    if (triggerType) {
      await this.processAutomationTrigger(event.entityType, triggerType, event.entity, companyId);
    }
  }

  // Ancien gestionnaire pour compatibilité - redirige vers le nouveau
  @OnEvent('candidate.created')
  async handleCandidateCreated(event: any) {
    await this.handleEntityEvent({
      eventType: 'created',
      entityType: 'candidates',
      entity: event.candidate,
      companyId: event.companyId
    });
  }

  @OnEvent('candidate.updated')
  async handleCandidateUpdated(event: any) {
    await this.processAutomationTrigger('candidates', TriggerType.ON_UPDATE, event.candidate, event.companyId, event.previousCandidate);
  }

  @OnEvent('candidate.deleted')
  async handleCandidateDeleted(event: any) {
    await this.processAutomationTrigger('candidates', TriggerType.ON_DELETE, event.candidate, event.companyId);
  }

  // Événements Projets
  @OnEvent('project.created')
  async handleProjectCreated(event: any) {
    await this.processAutomationTrigger('projects', TriggerType.ON_CREATE, event.project, event.companyId);
  }

  @OnEvent('project.updated')
  async handleProjectUpdated(event: any) {
    await this.processAutomationTrigger('projects', TriggerType.ON_UPDATE, event.project, event.companyId, event.previousProject);
  }

  @OnEvent('project.deleted')
  async handleProjectDeleted(event: any) {
    await this.processAutomationTrigger('projects', TriggerType.ON_DELETE, event.project, event.companyId);
  }

  // Événements Entreprises
  @OnEvent('company.created')
  async handleCompanyCreated(event: any) {
    await this.processAutomationTrigger('companies', TriggerType.ON_CREATE, event.company);
  }

  @OnEvent('company.updated')
  async handleCompanyUpdated(event: any) {
    await this.processAutomationTrigger('companies', TriggerType.ON_UPDATE, event.company, event.company.id, event.previousCompany);
  }

  // Méthode principale pour traiter les déclencheurs d'automation
  private async processAutomationTrigger(
    entityType: string, 
    triggerType: TriggerType, 
    entity: any, 
    companyId?: string,
    previousEntity?: any
  ) {
    try {
      console.log(`📋 [AUTOMATION] Processing trigger for ${entityType}:${triggerType}`, {
        entityId: entity?.id,
        entityName: entity?.name,
        companyId
      });

      // Récupérer les automatisations actives pour ce type d'entité et ce déclencheur
      const automations = await this.mailAutomationService.getActiveAutomationsForTrigger(
        entityType,
        triggerType,
        companyId
      );

      console.log(`📨 [AUTOMATION] Found ${automations.length} active automation(s) for ${entityType}:${triggerType}`, {
        automationIds: automations.map(a => a.id),
        automationTitles: automations.map(a => a.title)
      });

      if (automations.length === 0) {
        console.log(`⚠️ [AUTOMATION] No active automations found for ${entityType}:${triggerType} in company ${companyId}`);
        return;
      }

      // Traiter chaque automation en parallèle
      await Promise.all(
        automations.map(automation => 
          this.processAutomationAsync(automation, entity, previousEntity)
        )
      );

    } catch (error) {
      console.error(`❌ [AUTOMATION] Error processing automations for ${entityType}:${triggerType}`, error);
    }
  }

  // Traitement asynchrone d'une automation individuelle (équivalent du threading d'Horilla)
  private async processAutomationAsync(automation: any, entity: any, previousEntity?: any) {
    setImmediate(async () => {
      try {
        console.log(`🔄 [AUTOMATION] Processing automation "${automation.title}" (${automation.id}) for entity ${entity.id}`);

        // 1. Évaluer les conditions si elles existent
        const shouldTrigger = await this.evaluateConditions(automation, entity, previousEntity);
        
        if (!shouldTrigger) {
          console.log(`⏭️ [AUTOMATION] Automation "${automation.title}" skipped: conditions not met`);
          // Logger que l'automation a été ignorée à cause des conditions
          await this.mailAutomationService.logExecution(
            automation.id,
            entity.id,
            automation.target_entity,
            AutomationLogStatus.SKIPPED,
            'Conditions non remplies'
          );
          return;
        }

        console.log(`✅ [AUTOMATION] Automation "${automation.title}" conditions passed`);

        // 2. Déterminer les destinataires
        const recipients = await this.getRecipients(automation, entity);
        
        console.log(`📧 [AUTOMATION] Recipients found for "${automation.title}":`, recipients);
        
        if (!recipients || recipients.length === 0) {
          console.log(`⚠️ [AUTOMATION] No recipients found for automation "${automation.title}"`);
          await this.mailAutomationService.logExecution(
            automation.id,
            entity.id,
            automation.target_entity,
            AutomationLogStatus.SKIPPED,
            'Aucun destinataire trouvé'
          );
          return;
        }

        // 3. Envoyer l'email
        console.log(`🚀 [AUTOMATION] Sending email for "${automation.title}" to ${recipients.length} recipient(s)`);
        for (const recipient of recipients) {
          await this.sendAutomationEmail(automation, entity, recipient);
        }

        // 4. Logger le succès
        await this.mailAutomationService.logExecution(
          automation.id,
          entity.id,
          automation.target_entity,
          AutomationLogStatus.SUCCESS,
          null,
          recipients.join(', '),
          { entity: entity.id, automation: automation.title }
        );

        console.log(`✅ [AUTOMATION] Successfully processed automation "${automation.title}"`);

      } catch (error) {
        console.error(`❌ [AUTOMATION] Error processing automation "${automation.title}":`, error);
        
        // Logger l'erreur
        await this.mailAutomationService.logExecution(
          automation.id,
          entity.id,
          automation.target_entity,
          AutomationLogStatus.ERROR,
          error.message,
          null,
          { error: error.stack }
        );
      }
    });
  }

  // Évaluation simple des conditions (à développer selon vos besoins)
  private async evaluateConditions(automation: any, entity: any, previousEntity?: any): Promise<boolean> {
    // Si pas de conditions, on déclenche toujours
    if (!automation.conditions) {
      return true;
    }

    // TODO: Implémenter la logique d'évaluation des conditions (comme dans Horilla)
    // Pour l'instant, on retourne toujours true
    return true;
  }

  // Détermination des destinataires basée sur les règles
  private async getRecipients(automation: any, entity: any): Promise<string[]> {
    try {
      console.log(`🎯 [AUTOMATION] Getting recipients for automation "${automation.title}"`, {
        recipientRules: automation.recipient_rules,
        entityType: automation.target_entity,
        entityData: {
          id: entity.id,
          name: entity.name,
          email: entity.email
        }
      });

      const recipientRules = JSON.parse(automation.recipient_rules);
      const recipients: string[] = [];

      // Logic simple : chercher un champ email dans l'entité
      if (recipientRules.field && entity[recipientRules.field]) {
        console.log(`📧 [AUTOMATION] Adding recipient from field "${recipientRules.field}": ${entity[recipientRules.field]}`);
        recipients.push(entity[recipientRules.field]);
      }

      // Si c'est un candidat, prendre son email
      if (automation.target_entity === 'candidates' && entity.email) {
        console.log(`👤 [AUTOMATION] Adding candidate email: ${entity.email}`);
        recipients.push(entity.email);
      }

      // Dédupliquer les emails
      const uniqueRecipients = [...new Set(recipients)];
      
      console.log(`✅ [AUTOMATION] Final recipients for "${automation.title}":`, uniqueRecipients);
      
      return uniqueRecipients;
    } catch (error) {
      console.error(`❌ [AUTOMATION] Error getting recipients for "${automation.title}":`, error);
      return [];
    }
  }

  // Envoi de l'email avec le template
  private async sendAutomationEmail(automation: any, entity: any, recipient: string) {
    try {
      console.log(`📤 [AUTOMATION] Preparing to send email for "${automation.title}" to ${recipient}`, {
        automationId: automation.id,
        templateId: automation.mail_template_id,
        recipient,
        entityId: entity.id,
        companyId: automation.company_id
      });

      // Récupérer les données nécessaires pour le contexte
      let project = entity.project;
      let company = automation.company;

      // Si le projet n'est pas chargé, le récupérer
      if (!project && entity.projectId) {
        project = await this.projectRepository.findOne({
          where: { id: entity.projectId },
          relations: ['company']
        });
        company = project?.company;
      }

      // Construire le contexte dynamique pour le template
      const context = await this.buildDynamicContext(automation.target_entity, entity, project, company, recipient);

      console.log(`🔍 [AUTOMATION] Template context for "${automation.title}" (${Object.keys(context).length} variables):`, 
        Object.keys(context).slice(0, 10).reduce((obj, key) => ({ ...obj, [key]: context[key] }), {})
      );

      // Vérifier si le template existe
      if (!automation.mail_template) {
        throw new Error(`Template non trouvé pour l'automation ${automation.id}`);
      }

      console.log(`📨 [AUTOMATION] Sending automation email to ${recipient} with template "${automation.mail_template.subject}"`);
      
      // Envoi réel de l'email avec le template
      await this.mailService.sendWithTemplate(
        recipient,
        automation.mail_template,
        context,
        automation.company_id
      );
      
      console.log(`✅ [AUTOMATION] Email sent successfully to ${recipient}`);

    } catch (error) {
      console.error(`❌ [AUTOMATION] Failed to send email to ${recipient}:`, error);
      throw new Error(`Échec de l'envoi d'email vers ${recipient}: ${error.message}`);
    }
  }

  // Méthodes utilitaires génériques

  /**
   * Résout automatiquement le company_id selon le type d'entité
   */
  private async resolveCompanyId(entityType: string, entity: any): Promise<string | undefined> {
    try {
      switch (entityType) {
        case 'candidates':
          if (entity.projectId) {
            const project = await this.projectRepository.findOne({
              where: { id: entity.projectId }
            });
            return project?.company_id;
          }
          return entity.company_id;
        
        case 'projects':
          return entity.company_id;
        
        case 'companies':
          return entity.id;
        
        case 'users':
          return entity.company_id;
        
        default:
          // Essai générique
          return entity.company_id || entity.companyId;
      }
    } catch (error) {
      console.error(`❌ [AUTOMATION] Error resolving companyId for ${entityType}:`, error);
      return undefined;
    }
  }

  /**
   * Mappe les types d'événements aux triggers d'automatisation
   */
  private mapEventTypeToTrigger(eventType: string): TriggerType | null {
    const mapping = {
      'created': TriggerType.ON_CREATE,
      'updated': TriggerType.ON_UPDATE,
      'deleted': TriggerType.ON_DELETE
    };
    return mapping[eventType] || null;
  }

  /**
   * Construit dynamiquement TOUTES les variables disponibles pour les templates
   * ✅ FONCTIONNE POUR TOUTE ENTITÉ ET TOUTE VARIABLE POSSIBLE
   */
  private async buildDynamicContext(
    entityType: string, 
    entity: any, 
    project?: any, 
    company?: any, 
    recipient?: string
  ): Promise<Record<string, any>> {
    const context: Record<string, any> = {};

    // 1. Ajouter toutes les propriétés de l'entité principale
    this.addEntityProperties(context, entity, entityType.slice(0, -1)); // "candidates" -> "candidate"

    // 2. Ajouter les propriétés du projet si disponible
    if (project) {
      this.addEntityProperties(context, project, 'project');
      context.position_title = project.name;
      context.position_description = project.description;
    }

    // 3. Ajouter les propriétés de l'entreprise si disponible
    if (company) {
      this.addEntityProperties(context, company, 'company');
    }

    // 4. Variables génériques
    context.recipient = recipient;
    context.current_date = new Date().toLocaleDateString('fr-FR');
    context.current_time = new Date().toLocaleTimeString('fr-FR');
    context.current_datetime = new Date().toLocaleString('fr-FR');

    // 5. Variables d'alias courantes pour compatibilité
    context.candidate_name = entity.name || context.name || 'Candidat';
    context.candidate_email = entity.email || recipient;
    context.position_title = project?.name || 'Poste non spécifié';
    context.company_name = company?.name || 'Notre entreprise';
    context.project_name = project?.name;

    return context;
  }

  /**
   * Ajoute dynamiquement toutes les propriétés d'une entité au contexte
   * avec différents formats de nommage
   */
  private addEntityProperties(context: Record<string, any>, entity: any, prefix: string) {
    if (!entity) return;

    Object.keys(entity).forEach(key => {
      const value = entity[key];
      
      // Ignorer les objets complexes, relations, et champs système
      if (value !== null && value !== undefined && 
          typeof value !== 'object' && 
          !key.startsWith('_') && 
          !['password', 'hash', 'salt'].includes(key)) {
        
        // Formats multiples pour maximum de compatibilité
        context[key] = value;                           // name
        context[`${prefix}_${key}`] = value;           // candidate_name
        context[`${prefix}${key.charAt(0).toUpperCase() + key.slice(1)}`] = value; // candidateName
      }
    });
  }
}