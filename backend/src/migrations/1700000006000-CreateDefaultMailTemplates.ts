import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDefaultMailTemplates1700000006000 implements MigrationInterface {
  name = 'CreateDefaultMailTemplates1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Creating default mail templates...');
    
    const templates = [
      {
        type: 'confirm_signup',
        subject: 'Confirmez votre inscription - {{app_name}}',
        html_body: `<h2>Bienvenue {{user_name}} !</h2>
<p>Merci de vous être inscrit sur {{app_name}}.</p>
<p>Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
<a href="{{confirmation_url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Confirmer mon compte</a>
<p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
<p style="color: #007bff;">{{confirmation_url}}</p>
<p><small>Ce lien expire dans 24 heures.</small></p>
<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
<p>Cordialement,<br>L'équipe {{company_name}}</p>`,
        description: 'Template par défaut pour la confirmation d\'inscription d\'un nouvel utilisateur'
      },
      {
        type: 'invite_user',
        subject: 'Invitation à rejoindre {{company_name}} sur {{app_name}}',
        html_body: `<h2>Vous êtes invité(e) à rejoindre {{company_name}} !</h2>
<p>Bonjour {{user_name}},</p>
<p>{{inviter_name}} vous invite à rejoindre l'équipe {{company_name}} sur {{app_name}}.</p>
<p>Votre rôle sera : <strong>{{role}}</strong></p>
<p>Pour accepter cette invitation et créer votre compte, cliquez sur le lien ci-dessous :</p>
<a href="{{invitation_url}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Accepter l'invitation</a>
<p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
<p style="color: #28a745;">{{invitation_url}}</p>
<p><small>Cette invitation expire dans 7 jours.</small></p>
<p>À bientôt sur {{app_name}} !</p>
<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
<p>L'équipe {{company_name}}</p>`,
        description: 'Template par défaut pour inviter un nouvel utilisateur à rejoindre l\'équipe'
      },
      {
        type: 'reset_password',
        subject: 'Réinitialisation de votre mot de passe - {{app_name}}',
        html_body: `<h2>Réinitialisation de mot de passe</h2>
<p>Bonjour {{user_name}},</p>
<p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte <strong>{{user_email}}</strong>.</p>
<p>Pour créer un nouveau mot de passe, cliquez sur le lien ci-dessous :</p>
<a href="{{reset_url}}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Réinitialiser mon mot de passe</a>
<p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
<p style="color: #dc3545;">{{reset_url}}</p>
<p><small>Ce lien expire dans {{expiry_time}}.</small></p>
<p><em>Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</em></p>
<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
<p>Cordialement,<br>L'équipe {{company_name}}</p>`,
        description: 'Template par défaut pour la réinitialisation de mot de passe'
      },
      {
        type: 'candidate_analysis_complete',
        subject: 'Analyse des candidats terminée - {{project_name}}',
        html_body: `<h2>Analyse terminée !</h2>
<p>Bonjour {{user_name}},</p>
<p>L'analyse des candidats pour le projet <strong>{{project_name}}</strong> est maintenant terminée.</p>
<p><strong>Résumé :</strong></p>
<ul>
  <li>Nombre de candidats analysés : {{candidate_count}}</li>
  <li>{{analysis_summary}}</li>
</ul>
<p>Vous pouvez maintenant consulter les résultats :</p>
<a href="{{project_url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Voir les résultats</a>
<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
<p>L'équipe {{company_name}}</p>`,
        description: 'Notification envoyée quand l\'analyse des candidats est terminée'
      },
      {
        type: 'team_request_notification',
        subject: 'Nouvelle demande d\'équipe - {{company_name}}',
        html_body: `<h2>Nouvelle demande d'équipe</h2>
<p>Une nouvelle demande d'équipe a été reçue :</p>
<p><strong>Demandeur :</strong> {{requester_name}} ({{requester_email}})</p>
<p><strong>Projet :</strong> {{project_name}}</p>
<p><strong>Message :</strong></p>
<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
  {{message}}
</div>
<p>Pour traiter cette demande :</p>
<a href="{{request_url}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Traiter la demande</a>
<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
<p>Système de notifications {{app_name}}</p>`,
        description: 'Notification envoyée pour les nouvelles demandes d\'équipe'
      }
    ];

    for (const template of templates) {
      try {
        // Vérifier si le template existe déjà
        const existingTemplate = await queryRunner.query(
          `SELECT id FROM mail_templates WHERE template_type = $1 AND is_default = true`,
          [template.type]
        );
        
        if (existingTemplate.length === 0) {
          await queryRunner.query(
            `INSERT INTO mail_templates (template_type, subject, html_body, description, is_default, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [template.type, template.subject, template.html_body, template.description, true, true]
          );
          console.log(`✅ Template ${template.type} created`);
        } else {
          console.log(`⚠️ Template ${template.type} already exists, skipping`);
        }
      } catch (e) { 
        console.log(`⚠️ Template ${template.type} skipped:`, e.message); 
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM mail_templates WHERE is_default = true`);
  }
}