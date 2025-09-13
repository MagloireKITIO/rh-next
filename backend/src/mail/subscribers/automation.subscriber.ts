import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Logger } from '@nestjs/common';
import { AutomationEventService } from '../automation-event.service';

@EventSubscriber()
export class AutomationSubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger(AutomationSubscriber.name);
  private static automationEventService: AutomationEventService;

  // Méthode statique pour injecter le service
  static setAutomationEventService(service: AutomationEventService) {
    this.automationEventService = service;
  }

  /**
   * Écoute tous les événements pour toutes les entités
   */
  listenTo() {
    return Object; // Écoute toutes les entités
  }

  /**
   * Après insertion (création)
   */
  async afterInsert(event: InsertEvent<any>) {
    const entity = event.entity;
    const entityName = this.getEntityName(entity);
    
    if (!entityName) return;

    const companyId = await this.extractCompanyId(entity);
    
    this.logger.log(`📋 [AUTOMATION SUBSCRIBER] ${entityName}.created - Entity: ${entity.id}, Company: ${companyId}`);
    
    if (AutomationSubscriber.automationEventService) {
      // Appel générique et dynamique - fonctionne pour TOUTE entité
      AutomationSubscriber.automationEventService.handleEntityEvent({
        eventType: 'created',
        entityType: entityName,
        entity: entity,
        companyId: companyId
      });
    } else {
      this.logger.error('❌ [AUTOMATION SUBSCRIBER] AutomationEventService not initialized');
    }
  }

  /**
   * Après mise à jour
   */
  async afterUpdate(event: UpdateEvent<any>) {
    const entity = event.entity;
    if (!entity) return;
    
    const entityName = this.getEntityName(entity);
    if (!entityName) return;

    const companyId = await this.extractCompanyId(entity);
    
    this.logger.log(`📋 [AUTOMATION SUBSCRIBER] ${entityName}.updated - Entity: ${entity.id}, Company: ${companyId}`);
    
    if (AutomationSubscriber.automationEventService) {
      // Pour l'instant, on log juste les mises à jour
      this.logger.log(`📝 [AUTOMATION SUBSCRIBER] Update event for ${entityName} - skipping for now`);
    } else {
      this.logger.error('❌ [AUTOMATION SUBSCRIBER] AutomationEventService not initialized');
    }
  }

  /**
   * Après suppression
   */
  async afterRemove(event: RemoveEvent<any>) {
    const entity = event.entity || event.databaseEntity;
    if (!entity) return;
    
    const entityName = this.getEntityName(entity);
    if (!entityName) return;

    const companyId = await this.extractCompanyId(entity);
    
    this.logger.log(`📋 [AUTOMATION SUBSCRIBER] ${entityName}.deleted - Entity: ${entity.id}, Company: ${companyId}`);
    
    if (AutomationSubscriber.automationEventService) {
      // Pour l'instant, on log juste les suppressions
      this.logger.log(`🗑️ [AUTOMATION SUBSCRIBER] Delete event for ${entityName} - skipping for now`);
    } else {
      this.logger.error('❌ [AUTOMATION SUBSCRIBER] AutomationEventService not initialized');
    }
  }

  /**
   * Détermine le nom de l'entité pour l'événement
   */
  private getEntityName(entity: any): string | null {
    const entityMap = {
      'Candidate': 'candidates',
      'Project': 'projects', 
      'Company': 'companies',
      'User': 'users'
    };

    const constructor = entity.constructor;
    const entityType = constructor.name;
    
    return entityMap[entityType] || null;
  }

  /**
   * Extrait le company_id selon le type d'entité
   */
  private async extractCompanyId(entity: any): Promise<string | undefined> {
    const entityType = entity.constructor.name;
    
    // Candidate -> doit récupérer le project pour avoir company_id
    if (entityType === 'Candidate') {
      // Si le candidat a déjà la relation project chargée
      if (entity.project?.company_id) {
        return entity.project.company_id;
      }
      
      // Si le candidat a un projectId, il faut que le service récupère le company_id
      if (entity.projectId) {
        this.logger.log(`🔍 [AUTOMATION SUBSCRIBER] Candidate ${entity.id} has projectId ${entity.projectId} - company_id will be resolved by AutomationEventService`);
        return undefined; // Le service se chargera de récupérer le company_id
      }
      
      return entity.company_id;
    }
    
    // Project -> company_id direct
    if (entityType === 'Project') {
      return entity.company_id;
    }
    
    // Company -> son propre id
    if (entityType === 'Company') {
      return entity.id;
    }
    
    // User -> company_id
    if (entityType === 'User') {
      return entity.company_id;
    }

    // Fallback générique
    return entity.company_id;
  }
}