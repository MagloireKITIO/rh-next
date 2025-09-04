import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertHRTemplates1700000008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insérer les templates RH spécifiques
    await this.insertHRTemplates(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les templates RH spécifiques
    await queryRunner.query(`
      DELETE FROM mail_templates 
      WHERE name IN (
        'Notification - Nouveau candidat RH',
        'Alerte - Candidat à fort potentiel RH', 
        'Notification - Analyse terminée RH',
        'Notification - Nouveau projet RH',
        'Notification - Contact candidat disponible RH'
      )
    `);
  }

  private async insertHRTemplates(queryRunner: QueryRunner): Promise<void> {
    const hrTemplates = [
      {
        type: 'custom',
        name: 'Notification - Nouveau candidat RH',
        description: 'Notifier l\'équipe RH quand un nouveau candidat postule',
        subject: 'Nouveau candidat pour {{project_name}} - {{name}}',
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
        `,
        text_content: `
          Nouveau candidat reçu
          
          Nom: {{name}}
          Email: {{email}}
          Téléphone: {{phone}}
          Poste: {{project_name}}
          Date: {{current_date}}
          
          Un nouveau candidat vient de postuler.
          
          ---
          Automatisation RH - {{system_name}}
        `,
        variables: {
          name: 'Nom du candidat',
          email: 'Email du candidat',
          phone: 'Téléphone du candidat',
          project_name: 'Nom du poste',
          projectId: 'ID du projet',
          id: 'ID du candidat',
          current_date: 'Date actuelle',
          system_name: 'Nom du système'
        },
        status: 'active',
        is_default: true
      },
      {
        type: 'custom',
        name: 'Alerte - Candidat à fort potentiel RH',
        description: 'Alerter quand un candidat obtient un score élevé',
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
            </div>
          </div>
        `,
        text_content: `
          🌟 CANDIDAT EXCEPTIONNEL DÉTECTÉ !
          
          {{name}} - Score: {{score}}/100
          Poste: {{project_name}}
          Email: {{email}}
          
          Résumé: {{summary}}
          
          ⚡ ACTION RECOMMANDÉE: Programmer un entretien rapidement !
          
          ---
          Automatisation RH - {{system_name}}
        `,
        variables: {
          name: 'Nom du candidat',
          score: 'Score du candidat',
          project_name: 'Nom du poste',
          email: 'Email du candidat',
          summary: 'Résumé de l\'analyse',
          projectId: 'ID du projet',
          id: 'ID du candidat',
          system_name: 'Nom du système'
        },
        status: 'active',
        is_default: true
      },
      {
        type: 'custom',
        name: 'Notification - Analyse terminée RH',
        description: 'Informer quand l\'analyse d\'un candidat est complète',
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
        `,
        text_content: `
          ✅ ANALYSE TERMINÉE
          
          Candidat: {{name}}
          Poste: {{project_name}}
          Score: {{score}}/100
          
          Résumé: {{summary}}
          
          ---
          Automatisation RH - {{system_name}}
        `,
        variables: {
          name: 'Nom du candidat',
          project_name: 'Nom du poste',
          score: 'Score du candidat',
          summary: 'Résumé de l\'analyse',
          projectId: 'ID du projet',
          id: 'ID du candidat',
          system_name: 'Nom du système'
        },
        status: 'active',
        is_default: true
      },
      {
        type: 'custom',
        name: 'Notification - Nouveau projet RH',
        description: 'Notifier l\'équipe RH lors de la création d\'un projet',
        subject: 'Nouveau projet de recrutement - {{name}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #7c3aed;">🚀 Nouveau Projet de Recrutement</h2>
            
            <div style="background-color: #faf5ff; border: 1px solid #c084fc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #6b21a8; margin-top: 0;">{{name}}</h3>
              <p><strong>Créé par :</strong> {{created_by_user.name}}</p>
              <p><strong>Entreprise :</strong> {{company.name}}</p>
              <p><strong>Date de création :</strong> {{current_date}}</p>
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
        `,
        text_content: `
          🚀 NOUVEAU PROJET DE RECRUTEMENT
          
          {{name}}
          Créé par: {{created_by_user.name}}
          Entreprise: {{company.name}}
          Date: {{current_date}}
          
          Description:
          {{jobDescription}}
          
          ---
          Automatisation RH - {{system_name}}
        `,
        variables: {
          name: 'Nom du projet',
          'created_by_user.name': 'Nom du créateur',
          'company.name': 'Nom de l\'entreprise',
          current_date: 'Date actuelle',
          jobDescription: 'Description du poste',
          id: 'ID du projet',
          system_name: 'Nom du système'
        },
        status: 'active',
        is_default: true
      },
      {
        type: 'custom',
        name: 'Notification - Contact candidat disponible RH',
        description: 'Alerter quand un candidat a fourni son email',
        subject: 'Contact disponible - {{name}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0891b2;">📧 Contact candidat disponible</h2>
            
            <p>Le candidat <strong>{{name}}</strong> a fourni ses informations de contact.</p>
            
            <div style="background-color: #ecfeff; border: 1px solid #06b6d4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Email :</strong> <a href="mailto:{{email}}" style="color: #0891b2;">{{email}}</a></p>
              <p><strong>Téléphone :</strong> {{phone}}</p>
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
        `,
        text_content: `
          📧 CONTACT CANDIDAT DISPONIBLE
          
          Candidat: {{name}}
          Email: {{email}}
          Téléphone: {{phone}}
          Poste: {{project_name}}
          
          Vous pouvez maintenant contacter directement ce candidat.
          
          ---
          Automatisation RH - {{system_name}}
        `,
        variables: {
          name: 'Nom du candidat',
          email: 'Email du candidat',
          phone: 'Téléphone du candidat',
          project_name: 'Nom du poste',
          projectId: 'ID du projet',
          id: 'ID du candidat',
          system_name: 'Nom du système'
        },
        status: 'active',
        is_default: true
      }
    ];

    for (const template of hrTemplates) {
      await queryRunner.query(`
        INSERT INTO mail_templates (type, name, description, subject, html_content, text_content, variables, status, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        template.type,
        template.name,
        template.description,
        template.subject,
        template.html_content,
        template.text_content,
        JSON.stringify(template.variables),
        template.status,
        template.is_default
      ]);
    }
  }
}