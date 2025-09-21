import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateInterviewTables1700000016000 implements MigrationInterface {
  name = 'CreateInterviewTables1700000016000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table interviews
    await queryRunner.createTable(new Table({
      name: 'interviews',
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
          isNullable: false,
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'scheduled_at',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'started_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'ended_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'duration_minutes',
          type: 'integer',
          default: 60,
        },
        {
          name: 'status',
          type: 'varchar',
          default: "'scheduled'",
        },
        {
          name: 'type',
          type: 'varchar',
          default: "'video_call'",
        },
        {
          name: 'meeting_link',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'meeting_id',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'location',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'notes',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'agenda',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'evaluation_criteria',
          type: 'jsonb',
          isNullable: true,
        },
        {
          name: 'calendar_invites_sent',
          type: 'boolean',
          default: false,
        },
        {
          name: 'reminder_sent',
          type: 'boolean',
          default: false,
        },
        {
          name: 'candidate_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'project_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'created_by',
          type: 'uuid',
          isNullable: false,
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

    // Table interview_participants
    await queryRunner.createTable(new Table({
      name: 'interview_participants',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'gen_random_uuid()',
        },
        {
          name: 'role',
          type: 'varchar',
          default: "'interviewer'",
        },
        {
          name: 'status',
          type: 'varchar',
          default: "'invited'",
        },
        {
          name: 'is_required',
          type: 'boolean',
          default: false,
        },
        {
          name: 'notes',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'calendar_invite_sent',
          type: 'boolean',
          default: false,
        },
        {
          name: 'interview_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'user_id',
          type: 'uuid',
          isNullable: false,
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

    // Table interview_evaluations
    await queryRunner.createTable(new Table({
      name: 'interview_evaluations',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          generationStrategy: 'uuid',
          default: 'gen_random_uuid()',
        },
        {
          name: 'criteria_scores',
          type: 'jsonb',
          isNullable: true,
        },
        {
          name: 'overall_score',
          type: 'integer',
          isNullable: true,
        },
        {
          name: 'strengths',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'weaknesses',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'comments',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'notes',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'recommendation',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'confidence_level',
          type: 'integer',
          isNullable: true,
        },
        {
          name: 'additional_data',
          type: 'jsonb',
          isNullable: true,
        },
        {
          name: 'is_completed',
          type: 'boolean',
          default: false,
        },
        {
          name: 'interview_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'evaluator_id',
          type: 'uuid',
          isNullable: false,
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

    // Ajouter les clés étrangères
    await queryRunner.createForeignKey('interviews', new TableForeignKey({
      columnNames: ['candidate_id'],
      referencedTableName: 'candidates',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('interviews', new TableForeignKey({
      columnNames: ['project_id'],
      referencedTableName: 'projects',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('interviews', new TableForeignKey({
      columnNames: ['created_by'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'RESTRICT',
    }));

    await queryRunner.createForeignKey('interview_participants', new TableForeignKey({
      columnNames: ['interview_id'],
      referencedTableName: 'interviews',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('interview_participants', new TableForeignKey({
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('interview_evaluations', new TableForeignKey({
      columnNames: ['interview_id'],
      referencedTableName: 'interviews',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('interview_evaluations', new TableForeignKey({
      columnNames: ['evaluator_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    // Ajouter des index pour améliorer les performances
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_interview_scheduled_at" ON "interviews" ("scheduled_at")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_interview_status" ON "interviews" ("status")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_interview_candidate_id" ON "interviews" ("candidate_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_interview_project_id" ON "interviews" ("project_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_interview_participant_interview_id" ON "interview_participants" ("interview_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_interview_participant_user_id" ON "interview_participants" ("user_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_interview_evaluation_interview_id" ON "interview_evaluations" ("interview_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_interview_evaluation_evaluator_id" ON "interview_evaluations" ("evaluator_id")');

    console.log('✅ Tables d\'interview créées avec succès');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les index
    await queryRunner.query('DROP INDEX IF EXISTS "idx_interview_evaluation_evaluator_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_interview_evaluation_interview_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_interview_participant_user_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_interview_participant_interview_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_interview_project_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_interview_candidate_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_interview_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_interview_scheduled_at"');

    // Supprimer les tables (les FK seront supprimées automatiquement)
    await queryRunner.dropTable('interview_evaluations');
    await queryRunner.dropTable('interview_participants');
    await queryRunner.dropTable('interviews');

    console.log('✅ Tables d\'interview supprimées');
  }
}