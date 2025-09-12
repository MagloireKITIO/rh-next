import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMailTables1700000004000 implements MigrationInterface {
  name = 'CreateMailTables1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Creating mail configuration tables...');
    
    // Créer la table mail_configurations si elle n'existe pas
    try {
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "mail_configurations" (
          "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          "provider_type" varchar DEFAULT 'smtp',
          "smtp_host" varchar,
          "smtp_port" int,
          "smtp_user" varchar,
          "smtp_password" varchar,
          "smtp_secure" boolean DEFAULT true,
          "smtp_require_tls" boolean DEFAULT false,
          "from_email" varchar NOT NULL,
          "from_name" varchar NOT NULL,
          "is_active" boolean DEFAULT true,
          "is_default" boolean DEFAULT false,
          "company_id" uuid,
          "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
          "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL
        )
      `);
      console.log('✅ mail_configurations table created or already exists');
    } catch (e) { 
      console.log('⚠️ mail_configurations table creation skipped:', e.message); 
    }

    // Créer la table de liaison mail_configuration_companies
    try {
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "mail_configuration_companies" (
          "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          "configuration_id" uuid NOT NULL,
          "company_id" uuid NOT NULL,
          "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("configuration_id") REFERENCES "mail_configurations"("id") ON DELETE CASCADE,
          FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
        )
      `);
      console.log('✅ mail_configuration_companies table created or already exists');
    } catch (e) { 
      console.log('⚠️ mail_configuration_companies table creation skipped:', e.message); 
    }

    // Créer un index unique sur configuration_id + company_id
    try {
      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "idx_mail_config_company_unique" 
        ON "mail_configuration_companies" ("configuration_id", "company_id")
      `);
      console.log('✅ idx_mail_config_company_unique index created');
    } catch (e) { 
      console.log('⚠️ idx_mail_config_company_unique index skipped:', e.message); 
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_mail_config_company_unique"');
    await queryRunner.query('DROP TABLE IF EXISTS "mail_configuration_companies"');
    await queryRunner.query('DROP TABLE IF EXISTS "mail_configurations"');
  }
}