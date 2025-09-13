import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMailAutomations1700000007000 implements MigrationInterface {
  name = 'CreateMailAutomations1700000007000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer l'enum pour trigger_type
    await queryRunner.query(`
      CREATE TYPE "mail_automation_trigger_type_enum" AS ENUM (
        'onCreate', 
        'onUpdate', 
        'onDelete'
      )
    `);

    // Créer l'enum pour visibility
    await queryRunner.query(`
      CREATE TYPE "mail_automation_visibility_enum" AS ENUM (
        'company', 
        'system'
      )
    `);

    // Créer la table mail_automations
    await queryRunner.createTable(
      new Table({
        name: 'mail_automations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'target_entity',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'trigger_type',
            type: 'enum',
            enum: ['onCreate', 'onUpdate', 'onDelete'],
            enumName: 'mail_automation_trigger_type_enum',
          },
          {
            name: 'conditions',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'conditions_querystring',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'mail_template_id',
            type: 'uuid',
          },
          {
            name: 'recipient_rules',
            type: 'text',
          },
          {
            name: 'cc_users',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'visibility',
            type: 'enum',
            enum: ['company', 'system'],
            enumName: 'mail_automation_visibility_enum',
            default: "'company'",
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
          },
        ],
        foreignKeys: [
          {
            columnNames: ['company_id'],
            referencedTableName: 'companies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['mail_template_id'],
            referencedTableName: 'mail_templates',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    // Créer des index pour améliorer les performances
    try {
      await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_mail_automations_target_trigger" ON "mail_automations" ("target_entity", "trigger_type", "is_active")');
      console.log('✅ idx_mail_automations_target_trigger created');
    } catch (e) { console.log('⚠️ idx_mail_automations_target_trigger skipped:', e.message); }

    try {
      await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_mail_automations_company_id" ON "mail_automations" ("company_id", "is_active")');
      console.log('✅ idx_mail_automations_company_id created');
    } catch (e) { console.log('⚠️ idx_mail_automations_company_id skipped:', e.message); }

    try {
      await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_mail_automations_visibility" ON "mail_automations" ("visibility", "is_active")');
      console.log('✅ idx_mail_automations_visibility created');
    } catch (e) { console.log('⚠️ idx_mail_automations_visibility skipped:', e.message); }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les index
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_mail_automations_visibility"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_mail_automations_company_id"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_mail_automations_target_trigger"`);

    // Supprimer la table
    await queryRunner.dropTable('mail_automations');

    // Supprimer les enums
    await queryRunner.query(`DROP TYPE "mail_automation_trigger_type_enum"`);
    await queryRunner.query(`DROP TYPE "mail_automation_visibility_enum"`);
  }
}