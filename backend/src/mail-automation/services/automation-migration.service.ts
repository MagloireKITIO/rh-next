import { Injectable, Logger } from '@nestjs/common';

/**
 * Service pour aider à la migration vers le système d'automatisation automatique
 * 
 * Ce service contient des utilitaires et des guides pour:
 * 1. Identifier les anciens appels manuels aux triggers
 * 2. Valider que le nouveau système fonctionne correctement
 * 3. Nettoyer progressivement l'ancien code
 */
@Injectable()
export class AutomationMigrationService {
  private readonly logger = new Logger(AutomationMigrationService.name);

  /**
   * Valide qu'une entité peut déclencher des automatisations via le subscriber
   */
  validateEntityForAutomation(entity: any): {
    isValid: boolean;
    issues: string[];
    entityType?: string;
  } {
    const issues: string[] = [];
    let entityType: string | undefined;

    if (!entity) {
      issues.push('Entity is null or undefined');
      return { isValid: false, issues };
    }

    if (!entity.id) {
      issues.push('Entity does not have an ID');
    }

    // Déterminer le type d'entité
    const entityName = entity.constructor.name;
    switch (entityName) {
      case 'Candidate':
        entityType = 'CANDIDATE';
        if (!entity.projectId) {
          issues.push('Candidate does not have projectId');
        }
        break;
      case 'Project':
        entityType = 'PROJECT';
        if (!entity.company_id) {
          issues.push('Project does not have company_id');
        }
        break;
      case 'Analysis':
        entityType = 'ANALYSIS';
        if (!entity.projectId || !entity.candidateId) {
          issues.push('Analysis does not have required projectId or candidateId');
        }
        break;
      case 'User':
        entityType = 'USER';
        // Validation spécifique aux utilisateurs si nécessaire
        break;
      default:
        issues.push(`Unknown entity type: ${entityName}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      entityType
    };
  }

  /**
   * Guide pour nettoyer les anciens appels manuels
   */
  getMigrationGuide(): {
    filesToUpdate: string[];
    patternsToRemove: string[];
    recommendations: string[];
  } {
    return {
      filesToUpdate: [
        'src/projects/projects.service.ts',
        'src/candidates/candidates.service.ts', 
        'src/analysis/analysis.service.ts',
        'src/auth/auth.service.ts'
      ],
      patternsToRemove: [
        'await this.automationTriggerService.triggerCandidateAutomations(',
        'await this.automationTriggerService.triggerProjectAutomations(',
        'await this.automationTriggerService.triggerAnalysisAutomations(',
        'await this.automationTriggerService.triggerUserAutomations(',
        'AutomationTrigger.ON_CREATE',
        'AutomationTrigger.ON_UPDATE',
        'AutomationTrigger.ON_DELETE',
        'this.logger.log(`📧 Automation triggers executed',
        'Error triggering automations for'
      ],
      recommendations: [
        '1. Testez d\'abord le nouveau système avec quelques entités',
        '2. Surveillez les logs pour confirmer que les automatisations se déclenchent',
        '3. Retirez progressivement les appels manuels un service à la fois',
        '4. Gardez les try-catch pour la robustesse mais retirez les appels aux services',
        '5. Vérifiez que les relations nécessaires sont bien chargées par le subscriber'
      ]
    };
  }

  /**
   * Logs de débogage pour suivre la migration
   */
  logMigrationStatus(operation: string, entityType: string, entityId: string, success: boolean): void {
    const status = success ? '✅' : '❌';
    this.logger.log(`${status} Migration ${operation} - ${entityType} ${entityId} - ${success ? 'Success' : 'Failed'}`);
  }

  /**
   * Vérifie si un trigger manuel est encore nécessaire (pour des cas spéciaux)
   */
  isManualTriggerNeeded(context: {
    operation: string;
    entityType: string;
    isTransaction: boolean;
    hasCustomConditions: boolean;
  }): boolean {
    // Cas où un trigger manuel pourrait encore être nécessaire:
    
    // 1. Opérations en transactions complexes où l'ordre des triggers est critique
    if (context.isTransaction && context.hasCustomConditions) {
      return true;
    }

    // 2. Opérations bulk qui ne passent pas par les subscribers TypeORM
    if (context.operation.includes('bulk') || context.operation.includes('batch')) {
      return true;
    }

    // 3. Triggers avec conditions très spécifiques
    if (context.hasCustomConditions) {
      return true;
    }

    return false;
  }
}