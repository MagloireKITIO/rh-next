import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailHistory1700000012000 implements MigrationInterface {
  name = 'CreateEmailHistory1700000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Creating email_history table...');

    // Créer la table email_history
    try {
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "email_history" (
          "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          "to" varchar NOT NULL,
          "subject" varchar NOT NULL,
          "message" text NOT NULL,
          "html_content" text,
          "status" varchar DEFAULT 'pending',
          "attachments" jsonb,
          "failure_reason" varchar,
          "sent_at" timestamp,
          "delivered_at" timestamp,
          "read_at" timestamp,
          "candidate_id" uuid NOT NULL,
          "company_id" uuid NOT NULL,
          "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
          "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE,
          FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
        )
      `);
      console.log('✅ email_history table created or already exists');
    } catch (e) {
      console.log('⚠️ email_history table creation skipped:', e.message);
    }

    // Créer des index pour optimiser les performances
    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_email_history_candidate"
        ON "email_history" ("candidate_id")
      `);
      console.log('✅ idx_email_history_candidate index created');
    } catch (e) {
      console.log('⚠️ idx_email_history_candidate index skipped:', e.message);
    }

    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_email_history_company"
        ON "email_history" ("company_id")
      `);
      console.log('✅ idx_email_history_company index created');
    } catch (e) {
      console.log('⚠️ idx_email_history_company index skipped:', e.message);
    }

    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_email_history_status"
        ON "email_history" ("status")
      `);
      console.log('✅ idx_email_history_status index created');
    } catch (e) {
      console.log('⚠️ idx_email_history_status index skipped:', e.message);
    }

    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_email_history_created_at"
        ON "email_history" ("created_at" DESC)
      `);
      console.log('✅ idx_email_history_created_at index created');
    } catch (e) {
      console.log('⚠️ idx_email_history_created_at index skipped:', e.message);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_email_history_created_at"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_email_history_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_email_history_company"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_email_history_candidate"');
    await queryRunner.query('DROP TABLE IF EXISTS "email_history"');
  }
}