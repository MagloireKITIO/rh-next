import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateUserIntegrations1700000017000 implements MigrationInterface {
  name = 'CreateUserIntegrations1700000017000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table user_integrations pour stocker les tokens OAuth des utilisateurs
    await queryRunner.createTable(new Table({
      name: 'user_integrations',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'gen_random_uuid()',
        },
        {
          name: 'user_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'provider',
          type: 'varchar',
          isNullable: false,
        },
        {
          name: 'access_token',
          type: 'text',
          isNullable: false,
        },
        {
          name: 'refresh_token',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'expires_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'calendar_id',
          type: 'varchar',
          default: "'primary'",
        },
        {
          name: 'scope',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'provider_user_id',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'provider_email',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'is_active',
          type: 'boolean',
          default: true,
        },
        {
          name: 'last_sync_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'sync_errors',
          type: 'jsonb',
          isNullable: true,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'now()',
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'now()',
        },
      ],
    }));

    // Ajouter la clé étrangère vers users
    await queryRunner.createForeignKey('user_integrations', new TableForeignKey({
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    // Ajouter des index pour améliorer les performances
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_user_integrations_user_id" ON "user_integrations" ("user_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_user_integrations_provider" ON "user_integrations" ("provider")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_user_integrations_user_provider" ON "user_integrations" ("user_id", "provider")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_user_integrations_is_active" ON "user_integrations" ("is_active")');

    // Contrainte unique pour éviter les doublons user_id + provider
    await queryRunner.query('ALTER TABLE "user_integrations" ADD CONSTRAINT "uq_user_provider" UNIQUE ("user_id", "provider")');

    console.log('✅ Table user_integrations créée avec succès');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les index
    await queryRunner.query('DROP INDEX IF EXISTS "idx_user_integrations_is_active"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_user_integrations_user_provider"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_user_integrations_provider"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_user_integrations_user_id"');

    // Supprimer la table (les FK seront supprimées automatiquement)
    await queryRunner.dropTable('user_integrations');

    console.log('✅ Table user_integrations supprimée');
  }
}