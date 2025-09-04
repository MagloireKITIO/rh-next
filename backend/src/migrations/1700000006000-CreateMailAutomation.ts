import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateMailAutomation1700000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
            default: 'gen_random_uuid()',
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
            name: 'trigger',
            type: 'enum',
            enum: ['on_create', 'on_update', 'on_delete'],
          },
          {
            name: 'entity_type',
            type: 'enum',
            enum: ['candidate', 'project', 'user', 'analysis'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'draft'],
            default: "'draft'",
          },
          {
            name: 'company_id',
            type: 'uuid',
          },
          {
            name: 'mail_template_id',
            type: 'uuid',
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'recipients',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'template_variables',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'sent_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'success_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'failed_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'last_triggered_at',
            type: 'timestamp',
            isNullable: true,
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
          {
            columnNames: ['mail_template_id'],
            referencedTableName: 'mail_templates',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['created_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Index pour optimiser les recherches d'automatisations actives
    await queryRunner.createIndex(
      'mail_automations',
      new TableIndex({
        name: 'IDX_mail_automations_trigger_entity',
        columnNames: ['trigger', 'entity_type', 'company_id', 'status']
      })
    );

    await queryRunner.createIndex(
      'mail_automations',
      new TableIndex({
        name: 'IDX_mail_automations_company',
        columnNames: ['company_id']
      })
    );

    await queryRunner.createIndex(
      'mail_automations',
      new TableIndex({
        name: 'IDX_mail_automations_status',
        columnNames: ['status']
      })
    );

    await queryRunner.createIndex(
      'mail_automations',
      new TableIndex({
        name: 'IDX_mail_automations_created_by',
        columnNames: ['created_by']
      })
    );

    // Créer la table automation_conditions après mail_automations
    await queryRunner.createTable(
      new Table({
        name: 'automation_conditions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'mail_automation_id',
            type: 'uuid',
          },
          {
            name: 'field_path',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'operator',
            type: 'enum',
            enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'is_null', 'is_not_null', 'in', 'not_in'],
          },
          {
            name: 'value',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'logic',
            type: 'enum',
            enum: ['and', 'or'],
            isNullable: true,
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
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
            columnNames: ['mail_automation_id'],
            referencedTableName: 'mail_automations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Index pour optimiser les requêtes de conditions par automatisation
    await queryRunner.createIndex(
      'automation_conditions',
      new TableIndex({
        name: 'IDX_automation_conditions_automation_order',
        columnNames: ['mail_automation_id', 'order']
      })
    );

    await queryRunner.createIndex(
      'automation_conditions',
      new TableIndex({
        name: 'IDX_automation_conditions_field_operator',
        columnNames: ['field_path', 'operator']
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('automation_conditions');
    await queryRunner.dropTable('mail_automations');
  }
}