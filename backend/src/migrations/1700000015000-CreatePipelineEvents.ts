import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePipelineEvents1700000015000 implements MigrationInterface {
  name = 'CreatePipelineEvents1700000015000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer l'enum pour les types d'événements
    await queryRunner.query(`
      CREATE TYPE "pipeline_event_type_enum" AS ENUM (
        'CANDIDATE_MOVED',
        'CANDIDATE_ADDED',
        'CANDIDATE_REMOVED',
        'CANDIDATE_ANALYZED',
        'EMAIL_SENT',
        'NOTE_ADDED',
        'STAGE_CREATED',
        'STAGE_UPDATED',
        'STAGE_DELETED'
      )
    `);

    // Créer la table pipeline_events
    await queryRunner.createTable(new Table({
      name: 'pipeline_events',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'gen_random_uuid()',
        },
        {
          name: 'eventType',
          type: 'enum',
          enum: [
            'CANDIDATE_MOVED',
            'CANDIDATE_ADDED',
            'CANDIDATE_REMOVED',
            'CANDIDATE_ANALYZED',
            'EMAIL_SENT',
            'NOTE_ADDED',
            'STAGE_CREATED',
            'STAGE_UPDATED',
            'STAGE_DELETED'
          ],
          isNullable: false,
        },
        {
          name: 'projectId',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'candidateId',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'userId',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'eventData',
          type: 'jsonb',
          isNullable: true,
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'now()',
        },
      ],
    }));

    // Ajouter les clés étrangères
    await queryRunner.createForeignKey('pipeline_events', new TableForeignKey({
      columnNames: ['projectId'],
      referencedTableName: 'projects',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('pipeline_events', new TableForeignKey({
      columnNames: ['candidateId'],
      referencedTableName: 'candidates',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('pipeline_events', new TableForeignKey({
      columnNames: ['userId'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    // Ajouter des index pour améliorer les performances
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_pipeline_events_project" ON "pipeline_events" ("projectId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_pipeline_events_candidate" ON "pipeline_events" ("candidateId")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_pipeline_events_created_at" ON "pipeline_events" ("createdAt")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_pipeline_events_type_project" ON "pipeline_events" ("eventType", "projectId")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les index
    await queryRunner.query('DROP INDEX IF EXISTS "idx_pipeline_events_type_project"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_pipeline_events_created_at"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_pipeline_events_candidate"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_pipeline_events_project"');

    // Supprimer la table (les FK seront supprimées automatiquement)
    await queryRunner.dropTable('pipeline_events');

    // Supprimer l'enum
    await queryRunner.query(`DROP TYPE IF EXISTS "pipeline_event_type_enum"`);
  }
}