import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMailTemplates1700000005000 implements MigrationInterface {
  name = 'CreateMailTemplates1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Creating mail_templates table...');
    
    // Créer la table mail_templates
    try {
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "mail_templates" (
          "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          "template_type" varchar NOT NULL,
          "subject" varchar NOT NULL,
          "html_body" text NOT NULL,
          "text_body" text,
          "is_active" boolean DEFAULT true,
          "is_default" boolean DEFAULT false,
          "company_id" uuid,
          "available_variables" text,
          "description" text,
          "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
          "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL
        )
      `);
      console.log('✅ mail_templates table created or already exists');
    } catch (e) { 
      console.log('⚠️ mail_templates table creation skipped:', e.message); 
    }

    // Créer des index pour améliorer les performances
    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_mail_templates_type" 
        ON "mail_templates" ("template_type")
      `);
      console.log('✅ idx_mail_templates_type index created');
    } catch (e) { 
      console.log('⚠️ idx_mail_templates_type index skipped:', e.message); 
    }

    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_mail_templates_company" 
        ON "mail_templates" ("company_id")
      `);
      console.log('✅ idx_mail_templates_company index created');
    } catch (e) { 
      console.log('⚠️ idx_mail_templates_company index skipped:', e.message); 
    }

    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "idx_mail_templates_default" 
        ON "mail_templates" ("template_type", "is_default", "is_active")
      `);
      console.log('✅ idx_mail_templates_default index created');
    } catch (e) { 
      console.log('⚠️ idx_mail_templates_default index skipped:', e.message); 
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_mail_templates_default"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_mail_templates_company"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_mail_templates_type"');
    await queryRunner.query('DROP TABLE IF EXISTS "mail_templates"');
  }
}