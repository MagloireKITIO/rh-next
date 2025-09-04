import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateMailConfiguration1700000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table mail_configurations
    await queryRunner.createTable(
      new Table({
        name: 'mail_configurations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'provider_type',
            type: 'enum',
            enum: ['supabase', 'smtp', 'sendgrid', 'mailgun', 'aws_ses'],
            default: "'supabase'",
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: true,
          },
          // Configuration SMTP
          {
            name: 'smtp_host',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'smtp_port',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'smtp_user',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'smtp_password',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'smtp_secure',
            type: 'boolean',
            default: true,
          },
          // Configuration services tiers
          {
            name: 'api_key',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'api_secret',
            type: 'text',
            isNullable: true,
          },
          // Configuration générale
          {
            name: 'from_email',
            type: 'varchar',
          },
          {
            name: 'from_name',
            type: 'varchar',
            default: "'RH Analytics Pro'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
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
      }),
    );

    // Créer l'index sur company_id
    await queryRunner.createIndex(
      'mail_configurations',
      new TableIndex({
        name: 'IDX_mail_configurations_company_id',
        columnNames: ['company_id'],
      }),
    );

    // Créer l'index sur is_default
    await queryRunner.createIndex(
      'mail_configurations',
      new TableIndex({
        name: 'IDX_mail_configurations_is_default',
        columnNames: ['is_default'],
      }),
    );

    // Créer la contrainte de clé étrangère avec companies
    await queryRunner.createForeignKey(
      'mail_configurations',
      new TableForeignKey({
        name: 'FK_mail_configurations_company_id',
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Insérer la configuration Supabase par défaut
    await queryRunner.query(`
      INSERT INTO mail_configurations (
        provider_type,
        from_email,
        from_name,
        is_active,
        is_default
      ) VALUES (
        'supabase',
        'noreply@rh-analytics.com',
        'RH Analytics Pro',
        true,
        true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la contrainte de clé étrangère
    await queryRunner.dropForeignKey('mail_configurations', 'FK_mail_configurations_company_id');

    // Supprimer les index
    await queryRunner.dropIndex('mail_configurations', 'IDX_mail_configurations_company_id');
    await queryRunner.dropIndex('mail_configurations', 'IDX_mail_configurations_is_default');

    // Supprimer la table
    await queryRunner.dropTable('mail_configurations');
  }
}