import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePipelineTables1700000014000 implements MigrationInterface {
  name = 'CreatePipelineTables1700000014000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table recruitment_pipelines
    await queryRunner.createTable(new Table({
      name: 'recruitment_pipelines',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'gen_random_uuid()',
        },
        {
          name: 'name',
          type: 'varchar',
          isNullable: false,
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'isActive',
          type: 'boolean',
          default: true,
        },
        {
          name: 'projectId',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'now()',
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'now()',
        },
      ],
    }));

    // Créer la table pipeline_stages
    await queryRunner.createTable(new Table({
      name: 'pipeline_stages',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'gen_random_uuid()',
        },
        {
          name: 'name',
          type: 'varchar',
          isNullable: false,
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'order',
          type: 'integer',
          isNullable: false,
        },
        {
          name: 'color',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'isDefault',
          type: 'boolean',
          default: false,
        },
        {
          name: 'isActive',
          type: 'boolean',
          default: true,
        },
        {
          name: 'pipelineId',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'now()',
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'now()',
        },
      ],
    }));

    // Créer la table candidate_pipeline_statuses
    await queryRunner.createTable(new Table({
      name: 'candidate_pipeline_statuses',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'gen_random_uuid()',
        },
        {
          name: 'candidateId',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'pipelineId',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'currentStageId',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'previousStageId',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'movedBy',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'notes',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'movedAt',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'now()',
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'now()',
        },
      ],
    }));

    // Ajouter les clés étrangères
    await queryRunner.createForeignKey('recruitment_pipelines', new TableForeignKey({
      columnNames: ['projectId'],
      referencedTableName: 'projects',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('pipeline_stages', new TableForeignKey({
      columnNames: ['pipelineId'],
      referencedTableName: 'recruitment_pipelines',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('candidate_pipeline_statuses', new TableForeignKey({
      columnNames: ['candidateId'],
      referencedTableName: 'candidates',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('candidate_pipeline_statuses', new TableForeignKey({
      columnNames: ['pipelineId'],
      referencedTableName: 'recruitment_pipelines',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('candidate_pipeline_statuses', new TableForeignKey({
      columnNames: ['currentStageId'],
      referencedTableName: 'pipeline_stages',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('candidate_pipeline_statuses', new TableForeignKey({
      columnNames: ['previousStageId'],
      referencedTableName: 'pipeline_stages',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('candidate_pipeline_statuses', new TableForeignKey({
      columnNames: ['movedBy'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'RESTRICT',
    }));

    // Ajouter des index pour améliorer les performances
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_pipeline_project" ON "recruitment_pipelines" ("projectId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_stage_pipeline_order" ON "pipeline_stages" ("pipelineId", "order")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_candidate_current_stage" ON "candidate_pipeline_statuses" ("candidateId", "currentStageId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_pipeline_stage_candidates" ON "candidate_pipeline_statuses" ("pipelineId", "currentStageId")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les index
    await queryRunner.query('DROP INDEX IF EXISTS "idx_pipeline_stage_candidates"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_candidate_current_stage"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_stage_pipeline_order"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_pipeline_project"');

    // Supprimer les tables (les FK seront supprimées automatiquement)
    await queryRunner.dropTable('candidate_pipeline_statuses');
    await queryRunner.dropTable('pipeline_stages');
    await queryRunner.dropTable('recruitment_pipelines');
  }
}