/**
 * Templates d'automatisation prédéfinis pour les RH
 * Ces templates peuvent être utilisés pour créer rapidement des automatisations communes
 */

export const HR_AUTOMATION_TEMPLATES = {
  // Automatisation : Nouveau candidat reçu
  NEW_CANDIDATE_NOTIFICATION: {
    title: 'Notification - Nouveau candidat',
    description: 'Notifier l\'équipe RH quand un nouveau candidat postule',
    entity_type: 'candidate',
    trigger: 'on_create',
    recipients: ['company_hr', 'project_creator'],
    template_variables: {
      notification_type: 'Nouveau candidat',
      action_required: 'Révision du CV'
    },
    mail_template: {
      subject: 'Nouveau candidat pour {{project_name}} - {{candidate_name}}',
      html_content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Nouveau candidat reçu</h2>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Détails du candidat</h3>
            <p><strong>Nom :</strong> {{name}}</p>
            <p><strong>Email :</strong> {{email}}</p>
            <p><strong>Téléphone :</strong> {{phone}}</p>
            <p><strong>Poste :</strong> {{project_name}}</p>
            <p><strong>Date de candidature :</strong> {{current_date}}</p>
          </div>
          
          <p>Un nouveau candidat vient de postuler pour le poste <strong>{{project_name}}</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{system_name}}/projects/{{projectId}}/candidates/{{id}}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir le candidat
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            Automatisation RH - {{system_name}}
          </p>
        </div>
      `
    }
  },

  // Automatisation : Candidat avec score élevé
  HIGH_SCORE_CANDIDATE: {
    title: 'Alerte - Candidat à fort potentiel',
    description: 'Alerter quand un candidat obtient un score > 80',
    entity_type: 'candidate',
    trigger: 'on_update',
    conditions: [
      {
        field_path: 'score',
        operator: 'greater_than',
        value: 80
      }
    ],
    recipients: ['project_creator', 'company_hr'],
    template_variables: {
      alert_type: 'Candidat à fort potentiel',
      priority: 'Haute'
    },
    mail_template: {
      subject: '🌟 Candidat exceptionnel détecté - {{name}} ({{score}}/100)',
      html_content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h2 style="margin: 0;">🌟 Candidat Exceptionnel Détecté !</h2>
          </div>
          
          <div style="background-color: #fffbeb; border: 2px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">{{name}}</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <span style="font-size: 18px; font-weight: bold; color: #92400e;">Score : {{score}}/100</span>
              <span style="background-color: #fbbf24; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">TOP CANDIDAT</span>
            </div>
            <p><strong>Poste :</strong> {{project_name}}</p>
            <p><strong>Email :</strong> {{email}}</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1e40af;">Résumé de l'analyse :</h4>
            <p>{{summary}}</p>
          </div>
          
          <p style="color: #dc2626; font-weight: bold;">⚡ Action recommandée : Programmer un entretien rapidement !</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{system_name}}/projects/{{projectId}}/candidates/{{id}}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
              Voir le profil complet
            </a>
            <a href="{{system_name}}/projects/{{projectId}}/candidates/{{id}}/contact" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Contacter le candidat
            </a>
          </div>
        </div>
      `
    }
  },

  // Automatisation : Candidat analysé
  CANDIDATE_ANALYZED: {
    title: 'Notification - Analyse terminée',
    description: 'Informer quand l\'analyse d\'un candidat est complète',
    entity_type: 'candidate',
    trigger: 'on_update',
    conditions: [
      {
        field_path: 'status',
        operator: 'equals',
        value: 'analyzed'
      }
    ],
    recipients: ['project_creator'],
    template_variables: {
      analysis_complete: true
    },
    mail_template: {
      subject: 'Analyse terminée - {{name}} ({{score}}/100)',
      html_content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">✅ Analyse terminée</h2>
          
          <p>L'analyse du candidat <strong>{{name}}</strong> pour le poste <strong>{{project_name}}</strong> est maintenant terminée.</p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
            <h3 style="color: #065f46; margin-top: 0;">Score obtenu : {{score}}/100</h3>
            <p style="color: #065f46; margin: 0;">{{summary}}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{system_name}}/projects/{{projectId}}/candidates/{{id}}" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Consulter l'analyse détaillée
            </a>
          </div>
        </div>
      `
    }
  },

  // Automatisation : Nouveau projet créé
  NEW_PROJECT_CREATED: {
    title: 'Notification - Nouveau projet de recrutement',
    description: 'Notifier l\'équipe RH lors de la création d\'un projet',
    entity_type: 'project',
    trigger: 'on_create',
    recipients: ['company_hr'],
    template_variables: {
      project_type: 'Nouveau projet de recrutement'
    },
    mail_template: {
      subject: 'Nouveau projet de recrutement - {{name}}',
      html_content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">🚀 Nouveau Projet de Recrutement</h2>
          
          <div style="background-color: #faf5ff; border: 1px solid #c084fc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #6b21a8; margin-top: 0;">{{name}}</h3>
            <p><strong>Créé par :</strong> {{createdBy.name}}</p>
            <p><strong>Entreprise :</strong> {{company.name}}</p>
            <p><strong>Date de création :</strong> {{current_date}}</p>
            {{#if startDate}}<p><strong>Date de début :</strong> {{startDate}}</p>{{/if}}
            {{#if endDate}}<p><strong>Date de fin :</strong> {{endDate}}</p>{{/if}}
          </div>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1e40af;">Description du poste :</h4>
            <p>{{jobDescription}}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{system_name}}/projects/{{id}}" 
               style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir le projet
            </a>
          </div>
        </div>
      `
    }
  },

  // Automatisation : Candidat avec email fourni
  CANDIDATE_WITH_EMAIL: {
    title: 'Notification - Contact candidat disponible',
    description: 'Alerter quand un candidat a fourni son email',
    entity_type: 'candidate',
    trigger: 'on_create',
    conditions: [
      {
        field_path: 'email',
        operator: 'is_not_null'
      }
    ],
    recipients: ['project_creator'],
    template_variables: {
      contact_available: true
    },
    mail_template: {
      subject: 'Contact disponible - {{name}}',
      html_content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0891b2;">📧 Contact candidat disponible</h2>
          
          <p>Le candidat <strong>{{name}}</strong> a fourni ses informations de contact.</p>
          
          <div style="background-color: #ecfeff; border: 1px solid #06b6d4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email :</strong> <a href="mailto:{{email}}" style="color: #0891b2;">{{email}}</a></p>
            {{#if phone}}<p><strong>Téléphone :</strong> {{phone}}</p>{{/if}}
            <p><strong>Poste :</strong> {{project_name}}</p>
          </div>
          
          <p>Vous pouvez maintenant contacter directement ce candidat.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:{{email}}" 
               style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
              Envoyer un email
            </a>
            <a href="{{system_name}}/projects/{{projectId}}/candidates/{{id}}" 
               style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir le profil
            </a>
          </div>
        </div>
      `
    }
  }
};

/**
 * Fonction utilitaire pour obtenir un template par nom
 */
export function getHRTemplate(templateName: keyof typeof HR_AUTOMATION_TEMPLATES) {
  return HR_AUTOMATION_TEMPLATES[templateName];
}

/**
 * Liste des templates disponibles avec descriptions
 */
export const HR_TEMPLATE_LIST = Object.entries(HR_AUTOMATION_TEMPLATES).map(([key, template]) => ({
  key,
  title: template.title,
  description: template.description,
  entity_type: template.entity_type,
  trigger: template.trigger
}));