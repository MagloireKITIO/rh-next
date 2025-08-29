import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateMailTemplate1700000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'mail_templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['invitation', 'verification', 'password_reset', 'welcome', 'notification', 'custom'],
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'html_content',
            type: 'text',
          },
          {
            name: 'text_content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'variables',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'draft', 'archived'],
            default: "'draft'",
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['company_id'],
            referencedTableName: 'companies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Index pour optimiser les recherches
    await queryRunner.createIndex(
      'mail_templates',
      new TableIndex({
        name: 'IDX_mail_templates_type_company',
        columnNames: ['type', 'company_id']
      })
    );

    await queryRunner.createIndex(
      'mail_templates',
      new TableIndex({
        name: 'IDX_mail_templates_status',
        columnNames: ['status']
      })
    );

    await queryRunner.createIndex(
      'mail_templates',
      new TableIndex({
        name: 'IDX_mail_templates_is_default',
        columnNames: ['is_default']
      })
    );

    // Insérer les templates par défaut
    await this.insertDefaultTemplates(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('mail_templates');
  }

  private async insertDefaultTemplates(queryRunner: QueryRunner): Promise<void> {
    const defaultTemplates = [
      {
        type: 'invitation',
        name: 'Invitation par défaut',
        description: 'Template par défaut pour les invitations utilisateur',
        subject: 'Invitation à rejoindre {{companyName}} sur RH Analytics Pro',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Invitation à rejoindre {{companyName}}</h2>
            
            <p>Bonjour {{name}},</p>
            
            <p>Vous avez été invité(e) à rejoindre <strong>{{companyName}}</strong> sur RH Analytics Pro en tant que <strong>{{role}}</strong>.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{redirectUrl}}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Accepter l'invitation
              </a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #666;">{{redirectUrl}}</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Cet email a été envoyé par RH Analytics Pro. Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
            </p>
          </div>
        `,
        text_content: `
          Invitation à rejoindre {{companyName}}
          
          Bonjour {{name}},
          
          Vous avez été invité(e) à rejoindre {{companyName}} sur RH Analytics Pro en tant que {{role}}.
          
          Cliquez sur ce lien pour accepter l'invitation :
          {{redirectUrl}}
          
          Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
          
          ---
          RH Analytics Pro
        `,
        variables: {
          name: 'Nom de l\'utilisateur',
          companyName: 'Nom de l\'entreprise',
          role: 'Rôle de l\'utilisateur',
          redirectUrl: 'URL de redirection'
        },
        status: 'active',
        is_default: true
      },
      {
        type: 'verification',
        name: 'Vérification email par défaut',
        description: 'Template par défaut pour la vérification d\'email',
        subject: 'Vérifiez votre adresse email - RH Analytics Pro',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Vérifiez votre adresse email</h2>
            
            <p>Merci de vous être inscrit(e) sur RH Analytics Pro !</p>
            
            <p>Pour finaliser votre inscription, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{verificationUrl}}" 
                 style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Vérifier mon email
              </a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #666;">{{verificationUrl}}</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Cet email a été envoyé par RH Analytics Pro. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
            </p>
          </div>
        `,
        text_content: `
          Vérifiez votre adresse email
          
          Merci de vous être inscrit(e) sur RH Analytics Pro !
          
          Pour finaliser votre inscription, cliquez sur ce lien :
          {{verificationUrl}}
          
          Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
          
          ---
          RH Analytics Pro
        `,
        variables: {
          verificationUrl: 'URL de vérification'
        },
        status: 'active',
        is_default: true
      },
      {
        type: 'password_reset',
        name: 'Réinitialisation mot de passe par défaut',
        description: 'Template par défaut pour la réinitialisation de mot de passe',
        subject: 'Réinitialisation de votre mot de passe - RH Analytics Pro',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
            
            <p>Vous avez demandé la réinitialisation de votre mot de passe sur RH Analytics Pro.</p>
            
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{resetUrl}}" 
                 style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #666;">{{resetUrl}}</p>
            
            <p><strong>Important :</strong> Ce lien expire dans 24 heures.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email. Votre mot de passe ne sera pas modifié.
            </p>
          </div>
        `,
        text_content: `
          Réinitialisation de mot de passe
          
          Vous avez demandé la réinitialisation de votre mot de passe sur RH Analytics Pro.
          
          Cliquez sur ce lien pour créer un nouveau mot de passe :
          {{resetUrl}}
          
          Important : Ce lien expire dans 24 heures.
          
          Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
          
          ---
          RH Analytics Pro
        `,
        variables: {
          resetUrl: 'URL de réinitialisation'
        },
        status: 'active',
        is_default: true
      }
    ];

    for (const template of defaultTemplates) {
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