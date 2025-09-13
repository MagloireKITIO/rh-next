import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAutomationLogs1700000008000 implements MigrationInterface {
  name = 'CreateAutomationLogs1700000008000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer l'enum pour status
    await queryRunner.query(`
      CREATE TYPE "automation_log_status_enum" AS ENUM (
        'success', 
        'error', 
        'skipped'
      )
    `);

    // Créer la table automation_logs
    await queryRunner.createTable(
      new Table({
        name: 'automation_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'automation_id',
            type: 'uuid',
          },
          {
            name: 'entity_id',
            type: 'uuid',
          },
          {
            name: 'entity_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['success', 'error', 'skipped'],
            enumName: 'automation_log_status_enum',
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'email_sent_to',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'context_data',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['automation_id'],
            referencedTableName: 'mail_automations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    // Créer des index pour améliorer les performances
    try {
      await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_automation_logs_automation_id" ON "automation_logs" ("automation_id", "created_at" DESC)');
      console.log('✅ idx_automation_logs_automation_id created');
    } catch (e) { console.log('⚠️ idx_automation_logs_automation_id skipped:', e.message); }

    try {
      await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_automation_logs_entity" ON "automation_logs" ("entity_id", "entity_type", "created_at" DESC)');
      console.log('✅ idx_automation_logs_entity created');
    } catch (e) { console.log('⚠️ idx_automation_logs_entity skipped:', e.message); }

    try {
      await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_automation_logs_status" ON "automation_logs" ("status", "created_at" DESC)');
      console.log('✅ idx_automation_logs_status created');
    } catch (e) { console.log('⚠️ idx_automation_logs_status skipped:', e.message); }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les index
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_automation_logs_status"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_automation_logs_entity"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_automation_logs_automation_id"`);

    // Supprimer la table
    await queryRunner.dropTable('automation_logs');

    // Supprimer l'enum
    await queryRunner.query(`DROP TYPE "automation_log_status_enum"`);
  }
}