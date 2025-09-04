import { Injectable } from '@nestjs/common';
import { MailAutomationService } from './mail-automation.service';
import { ConditionEvaluatorService } from './condition-evaluator.service';
import { MailService } from '../../mail-configuration/mail.service';
import { AutomationTrigger, AutomationEntityType } from '../entities/mail-automation.entity';

@Injectable()
export class AutomationTriggerService {
  constructor(
    private mailAutomationService: MailAutomationService,
    private conditionEvaluatorService: ConditionEvaluatorService,
    private mailService: MailService,
  ) {}

  /**
   * Déclencher les automatisations pour une entité
   */
  async triggerAutomations(
    entityType: AutomationEntityType,
    trigger: AutomationTrigger,
    entity: any,
    previousEntity?: any
  ): Promise<void> {
    try {
      // Récupérer le company_id de l'entité
      const companyId = this.extractCompanyId(entity);
      if (!companyId) {
        console.warn('Impossible de déterminer le company_id pour l\'automatisation');
        return;
      }

      // Récupérer les automatisations actives
      const automations = await this.mailAutomationService.findActiveByTrigger(
        entityType,
        trigger,
        companyId
      );

      if (automations.length === 0) {
        return; // Aucune automatisation à déclencher
      }

      // Traiter chaque automatisation
      for (const automation of automations) {
        try {
          // Vérifier les conditions si elles existent
          const shouldTrigger = this.conditionEvaluatorService.evaluateConditions(
            automation.conditions || [],
            entity
          );

          if (shouldTrigger) {
            await this.executeAutomation(automation, entity, previousEntity);
          }
        } catch (error) {
          console.error(`Erreur lors de l'exécution de l'automatisation ${automation.id}:`, error);
          
          // Mettre à jour les statistiques (échec)
          await this.mailAutomationService.updateStats(automation.id, false);
        }
      }
    } catch (error) {
      console.error('Erreur lors du déclenchement des automatisations:', error);
    }
  }

  /**
   * Exécuter une automatisation spécifique
   */
  private async executeAutomation(automation: any, entity: any, previousEntity?: any): Promise<void> {
    try {
      // Préparer les données du template
      const templateData = this.prepareTemplateData(entity, previousEntity, automation.template_variables);

      // Déterminer les destinataires
      const recipients = this.resolveRecipients(automation.recipients, entity);

      if (recipients.length === 0) {
        console.warn(`Aucun destinataire trouvé pour l'automatisation ${automation.id}`);
        return;
      }

      // Envoyer l'email
      const emailResult = await this.mailService.sendEmail({
        to: recipients,
        subject: automation.mail_template.subject,
        htmlContent: automation.mail_template.html_content,
        textContent: automation.mail_template.text_content,
        companyId: automation.company_id,
        templateData
      });

      // Mettre à jour les statistiques
      await this.mailAutomationService.updateStats(
        automation.id,
        emailResult.success
      );

      if (emailResult.success) {
        console.log(`Email d'automatisation envoyé avec succès: ${automation.title}`);
      } else {
        console.error(`Échec de l'envoi d'email d'automatisation: ${emailResult.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'automatisation:', error);
      throw error;
    }
  }

  /**
   * Préparer les données pour le template d'email
   */
  private prepareTemplateData(entity: any, previousEntity?: any, customVariables?: Record<string, any>): Record<string, any> {
    const data = {
      // Données de l'entité actuelle
      ...entity,
      // Données de l'entité précédente (pour les mises à jour)
      ...(previousEntity ? { previous: previousEntity } : {}),
      // Variables personnalisées
      ...(customVariables || {}),
      // Variables système
      current_date: new Date().toLocaleDateString('fr-FR'),
      current_time: new Date().toLocaleTimeString('fr-FR'),
      system_name: 'RH Analytics Pro',
    };

    // Ajouter des champs calculés selon le type d'entité
    if (entity.projectId) {
      data.project_name = entity.project?.name || 'N/A';
    }

    if (entity.company_id) {
      data.company_name = entity.company?.name || 'N/A';
    }

    return data;
  }

  /**
   * Résoudre les destinataires de l'email
   */
  private resolveRecipients(recipients: string[], entity: any): string[] {
    const resolvedEmails: string[] = [];

    for (const recipient of recipients) {
      if (recipient.includes('@')) {
        // Email direct
        resolvedEmails.push(recipient);
      } else if (recipient === 'candidate_email' && entity.email) {
        // Email du candidat
        resolvedEmails.push(entity.email);
      } else if (recipient === 'project_creator' && entity.project?.createdBy?.email) {
        // Email du créateur du projet
        resolvedEmails.push(entity.project.createdBy.email);
      } else if (recipient === 'company_hr') {
        // Tous les HR de l'entreprise (à implémenter selon vos besoins)
        // Pour l'instant, on ignore
      }
    }

    return [...new Set(resolvedEmails)]; // Supprimer les doublons
  }

  /**
   * Extraire le company_id d'une entité
   */
  private extractCompanyId(entity: any): string | null {
    // Essayer différentes méthodes pour récupérer le company_id
    if (entity.company_id) {
      return entity.company_id;
    }
    
    if (entity.company?.id) {
      return entity.company.id;
    }

    if (entity.project?.company_id) {
      return entity.project.company_id;
    }

    if (entity.project?.company?.id) {
      return entity.project.company.id;
    }

    return null;
  }

  /**
   * Méthodes de déclenchement spécifiques par entité
   */
  
  async triggerCandidateAutomations(
    trigger: AutomationTrigger,
    candidate: any,
    previousCandidate?: any
  ): Promise<void> {
    await this.triggerAutomations(
      AutomationEntityType.CANDIDATE,
      trigger,
      candidate,
      previousCandidate
    );
  }

  async triggerProjectAutomations(
    trigger: AutomationTrigger,
    project: any,
    previousProject?: any
  ): Promise<void> {
    await this.triggerAutomations(
      AutomationEntityType.PROJECT,
      trigger,
      project,
      previousProject
    );
  }

  async triggerUserAutomations(
    trigger: AutomationTrigger,
    user: any,
    previousUser?: any
  ): Promise<void> {
    await this.triggerAutomations(
      AutomationEntityType.USER,
      trigger,
      user,
      previousUser
    );
  }

  async triggerAnalysisAutomations(
    trigger: AutomationTrigger,
    analysis: any,
    previousAnalysis?: any
  ): Promise<void> {
    await this.triggerAutomations(
      AutomationEntityType.ANALYSIS,
      trigger,
      analysis,
      previousAnalysis
    );
  }
}