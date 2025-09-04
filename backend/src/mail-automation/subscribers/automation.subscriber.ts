import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  DataSource,
} from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

// Import des entités
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Project } from '../../projects/entities/project.entity';
import { Analysis } from '../../analysis/entities/analysis.entity';
import { User } from '../../auth/entities/user.entity';

// Import des services d'automatisation
import { AutomationTriggerService } from '../services/automation-trigger.service';
import { AutomationTrigger, AutomationEntityType } from '../entities/mail-automation.entity';

/**
 * Subscriber TypeORM pour déclencher automatiquement les automatisations
 * lors des opérations CRUD sur les entités principales
 * 
 * Ce système remplace les appels manuels aux services d'automatisation
 * et garantit que toutes les automatisations sont déclenchées de manière cohérente.
 */
@Injectable()
@EventSubscriber()
export class AutomationSubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger(AutomationSubscriber.name);
  private automationTriggerService: AutomationTriggerService;

  constructor(
    private moduleRef: ModuleRef,
    private dataSource: DataSource,
  ) {
    this.logger.log('🔧 AutomationSubscriber constructor called');
    this.logger.log(`🔧 DataSource available: ${!!this.dataSource}`);
    
    // S'enregistrer manuellement auprès de TypeORM
    if (this.dataSource) {
      this.dataSource.subscribers.push(this);
      this.logger.log('✅ AutomationSubscriber manually registered with DataSource');
    } else {
      this.logger.error('❌ DataSource not available for subscriber registration');
    }
  }

  /**
   * Injection retardée du service d'automatisation pour éviter les dépendances circulaires
   */
  private getAutomationTriggerService(): AutomationTriggerService {
    if (!this.automationTriggerService) {
      this.automationTriggerService = this.moduleRef.get(AutomationTriggerService, { strict: false });
    }
    return this.automationTriggerService;
  }

  /**
   * Définit les entités que ce subscriber surveille
   */
  listenTo(): any {
    return [Candidate, Project, Analysis, User];
  }

  /**
   * Déclenchement après insertion d'une entité
   */
  async afterInsert(event: InsertEvent<any>): Promise<void> {
    this.logger.log('🔧 afterInsert called');
    this.logger.log(`🔧 Entity: ${event.entity?.constructor?.name}, ID: ${event.entity?.id}`);
    
    const entityInfo = this.getEntityInfo(event.entity);
    this.logger.log(`🔧 EntityInfo: ${JSON.stringify(entityInfo)}`);
    
    if (!entityInfo) {
      this.logger.log('🔧 No entityInfo - returning early');
      return;
    }

    try {
      this.logger.log(`🎯 Auto-triggering ${entityInfo.type} ON_CREATE automation for entity ${event.entity.id}`);
      
      // Charger l'entité avec ses relations pour l'automatisation
      const entityWithRelations = await this.loadEntityWithRelations(
        event.entity,
        entityInfo.type,
        event.manager
      );

      if (entityWithRelations) {
        const triggerService = this.getAutomationTriggerService();
        await this.callSpecificTrigger(
          triggerService,
          entityInfo.type,
          AutomationTrigger.ON_CREATE,
          entityWithRelations
        );
        
        this.logger.log(`✅ Successfully triggered ${entityInfo.type} ON_CREATE automation`);
      }
    } catch (error) {
      this.logger.error(`❌ Error triggering ${entityInfo.type} ON_CREATE automation:`, error.message);
      // Ne pas faire échouer l'opération principale si les automatisations échouent
    }
  }

  /**
   * Déclenchement après mise à jour d'une entité
   */
  async afterUpdate(event: UpdateEvent<any>): Promise<void> {
    const entityInfo = this.getEntityInfo(event.entity);
    if (!entityInfo) return;

    try {
      this.logger.log(`🎯 Auto-triggering ${entityInfo.type} ON_UPDATE automation for entity ${event.entity.id}`);
      
      // Charger l'entité mise à jour avec ses relations
      const entityWithRelations = await this.loadEntityWithRelations(
        event.entity,
        entityInfo.type,
        event.manager
      );

      if (entityWithRelations) {
        const triggerService = this.getAutomationTriggerService();
        await this.callSpecificTrigger(
          triggerService,
          entityInfo.type,
          AutomationTrigger.ON_UPDATE,
          entityWithRelations,
          event.databaseEntity // Ancienne version de l'entité
        );
        
        this.logger.log(`✅ Successfully triggered ${entityInfo.type} ON_UPDATE automation`);
      }
    } catch (error) {
      this.logger.error(`❌ Error triggering ${entityInfo.type} ON_UPDATE automation:`, error.message);
      // Ne pas faire échouer l'opération principale si les automatisations échouent
    }
  }

  /**
   * Déclenchement après suppression d'une entité
   */
  async afterRemove(event: RemoveEvent<any>): Promise<void> {
    const entityInfo = this.getEntityInfo(event.entity);
    if (!entityInfo) return;

    try {
      this.logger.log(`🎯 Auto-triggering ${entityInfo.type} ON_DELETE automation for entity ${event.entity?.id || 'unknown'}`);
      
      const triggerService = this.getAutomationTriggerService();
      await this.callSpecificTrigger(
        triggerService,
        entityInfo.type,
        AutomationTrigger.ON_DELETE,
        event.entity
      );
      
      this.logger.log(`✅ Successfully triggered ${entityInfo.type} ON_DELETE automation`);
    } catch (error) {
      this.logger.error(`❌ Error triggering ${entityInfo.type} ON_DELETE automation:`, error.message);
      // Ne pas faire échouer l'opération principale si les automatisations échouent
    }
  }

  /**
   * Détermine le type d'entité et valide qu'elle peut déclencher des automatisations
   */
  private getEntityInfo(entity: any): { type: AutomationEntityType; entityName: string } | null {
    if (!entity) return null;

    if (entity instanceof Candidate) {
      return { type: AutomationEntityType.CANDIDATE, entityName: 'Candidate' };
    }
    
    if (entity instanceof Project) {
      return { type: AutomationEntityType.PROJECT, entityName: 'Project' };
    }
    
    if (entity instanceof Analysis) {
      return { type: AutomationEntityType.ANALYSIS, entityName: 'Analysis' };
    }
    
    if (entity instanceof User) {
      return { type: AutomationEntityType.USER, entityName: 'User' };
    }

    return null;
  }

  /**
   * Charge l'entité avec toutes les relations nécessaires pour les automatisations
   */
  private async loadEntityWithRelations(
    entity: any,
    entityType: AutomationEntityType,
    manager: any
  ): Promise<any> {
    const relations = this.getRequiredRelations(entityType);
    
    if (relations.length === 0) {
      return entity;
    }

    try {
      const repository = manager.getRepository(entity.constructor);
      return await repository.findOne({
        where: { id: entity.id },
        relations: relations
      });
    } catch (error) {
      this.logger.warn(`Could not load relations for ${entityType}:`, error.message);
      return entity;
    }
  }

  /**
   * Définit les relations nécessaires selon le type d'entité
   */
  private getRequiredRelations(entityType: AutomationEntityType): string[] {
    switch (entityType) {
      case AutomationEntityType.CANDIDATE:
        return ['project', 'project.company', 'project.createdBy'];
        
      case AutomationEntityType.PROJECT:
        return ['company', 'createdBy'];
        
      case AutomationEntityType.ANALYSIS:
        return ['project', 'project.company', 'project.createdBy', 'candidate'];
        
      case AutomationEntityType.USER:
        return ['company'];
        
      default:
        return [];
    }
  }

  /**
   * Appelle la méthode spécifique du service d'automatisation selon le type d'entité
   */
  private async callSpecificTrigger(
    triggerService: AutomationTriggerService,
    entityType: AutomationEntityType,
    trigger: AutomationTrigger,
    entity: any,
    previousEntity?: any
  ): Promise<void> {
    switch (entityType) {
      case AutomationEntityType.CANDIDATE:
        await triggerService.triggerCandidateAutomations(trigger, entity, previousEntity);
        break;
        
      case AutomationEntityType.PROJECT:
        await triggerService.triggerProjectAutomations(trigger, entity, previousEntity);
        break;
        
      case AutomationEntityType.ANALYSIS:
        await triggerService.triggerAnalysisAutomations(trigger, entity, previousEntity);
        break;
        
      case AutomationEntityType.USER:
        await triggerService.triggerUserAutomations(trigger, entity, previousEntity);
        break;
        
      default:
        this.logger.warn(`No trigger method defined for entity type: ${entityType}`);
    }
  }
}