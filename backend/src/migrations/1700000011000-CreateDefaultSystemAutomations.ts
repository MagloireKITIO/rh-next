import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDefaultSystemAutomations1700000011000 implements MigrationInterface {
  name = 'CreateDefaultSystemAutomations1700000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Creating default system automations...');

    // Récupérer les templates par défaut
    const confirmSignupTemplate = await queryRunner.query(
      `SELECT id FROM mail_templates WHERE template_type = 'confirm_signup' AND is_default = true LIMIT 1`
    );
    const inviteUserTemplate = await queryRunner.query(
      `SELECT id FROM mail_templates WHERE template_type = 'invite_user' AND is_default = true LIMIT 1`
    );
    const resetPasswordTemplate = await queryRunner.query(
      `SELECT id FROM mail_templates WHERE template_type = 'reset_password' AND is_default = true LIMIT 1`
    );

    if (!confirmSignupTemplate.length || !inviteUserTemplate.length || !resetPasswordTemplate.length) {
      throw new Error('Templates par défaut non trouvés. Exécutez d\'abord la migration CreateDefaultMailTemplates');
    }

    // Créer un utilisateur système par défaut pour les automations
    let systemUserId;
    const existingSystemUser = await queryRunner.query(
      `SELECT id FROM users WHERE email = 'system@automation.local' LIMIT 1`
    );

    if (existingSystemUser.length === 0) {
      const systemUserResult = await queryRunner.query(
        `INSERT INTO users (email, name, role) VALUES ('system@automation.local', 'System Automation', 'super_admin') RETURNING id`
      );
      systemUserId = systemUserResult[0].id;
      console.log('✅ System user created for automations');
    } else {
      systemUserId = existingSystemUser[0].id;
      console.log('ℹ️ System user already exists');
    }

    // Définir les automations système par défaut
    const systemAutomations = [
      {
        title: '[SYSTÈME] Confirmation d\'inscription utilisateur',
        description: 'Automation système pour envoyer un email de confirmation lors de l\'inscription d\'un nouvel utilisateur',
        target_entity: 'users',
        trigger_type: 'onCreate',
        mail_template_id: confirmSignupTemplate[0].id,
        recipient_rules: JSON.stringify({ field: 'email' }),
        conditions: null,
        is_active: true,
        visibility: 'system'
      },
      {
        title: '[SYSTÈME] Invitation utilisateur',
        description: 'Automation système pour envoyer un email d\'invitation à un nouvel utilisateur',
        target_entity: 'users',
        trigger_type: 'onCreate',
        mail_template_id: inviteUserTemplate[0].id,
        recipient_rules: JSON.stringify({ field: 'email' }),
        conditions: JSON.stringify({
          field: 'invitation_token',
          operator: 'not_null',
          description: 'Seulement si l\'utilisateur a été invité (possède un token d\'invitation)'
        }),
        is_active: true,
        visibility: 'system'
      },
      {
        title: '[SYSTÈME] Réinitialisation mot de passe',
        description: 'Automation système pour envoyer un email de réinitialisation de mot de passe',
        target_entity: 'users',
        trigger_type: 'onUpdate',
        mail_template_id: resetPasswordTemplate[0].id,
        recipient_rules: JSON.stringify({ field: 'email' }),
        conditions: JSON.stringify({
          field: 'reset_token',
          operator: 'not_null',
          description: 'Seulement si un token de réinitialisation a été généré'
        }),
        is_active: true,
        visibility: 'system'
      }
    ];

    // Créer les automations système
    for (const automation of systemAutomations) {
      try {
        // Vérifier si l'automation existe déjà
        const existingAutomation = await queryRunner.query(
          `SELECT id FROM mail_automations
           WHERE target_entity = $1 AND trigger_type = $2 AND visibility = 'system' AND title = $3`,
          [automation.target_entity, automation.trigger_type, automation.title]
        );

        if (existingAutomation.length === 0) {
          await queryRunner.query(
            `INSERT INTO mail_automations (
              title, description, user_id, target_entity, trigger_type,
              conditions, mail_template_id, recipient_rules, is_active, visibility
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              automation.title,
              automation.description,
              systemUserId,
              automation.target_entity,
              automation.trigger_type,
              automation.conditions,
              automation.mail_template_id,
              automation.recipient_rules,
              automation.is_active,
              automation.visibility
            ]
          );
          console.log(`✅ System automation created: ${automation.title}`);
        } else {
          console.log(`⚠️ System automation already exists: ${automation.title}`);
        }
      } catch (e) {
        console.log(`❌ Error creating system automation ${automation.title}:`, e.message);
      }
    }

    console.log('✅ Default system automations setup completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Removing system automations...');

    // Supprimer les automations système
    await queryRunner.query(`DELETE FROM mail_automations WHERE visibility = 'system'`);

    // Supprimer l'utilisateur système (optionnel, à décommenter si nécessaire)
    // await queryRunner.query(`DELETE FROM users WHERE email = 'system@automation.local'`);

    console.log('✅ System automations removed');
  }
}