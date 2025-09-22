import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoginAuditTable1700000022000 implements MigrationInterface {
  name = 'CreateLoginAuditTable1700000022000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Creating login_audit table and related indexes...');

    // Créer les enums d'abord
    await queryRunner.query(`
      CREATE TYPE "public"."login_audit_status_enum" AS ENUM('success', 'failed', 'suspicious')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."login_audit_device_type_enum" AS ENUM('desktop', 'mobile', 'tablet', 'unknown')
    `);

    // Créer la table login_audit avec les enums
    await queryRunner.query(`
      CREATE TABLE "login_audit" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "company_id" uuid NOT NULL,
        "email_attempt" character varying NOT NULL,
        "status" "public"."login_audit_status_enum" NOT NULL DEFAULT 'failed',
        "failure_reason" character varying,
        "ip_address" character varying NOT NULL,
        "user_agent" text,
        "device_type" "public"."login_audit_device_type_enum" NOT NULL DEFAULT 'unknown',
        "browser" character varying,
        "operating_system" character varying,
        "location_country" character varying,
        "location_city" character varying,
        "location_region" character varying,
        "location_latitude" double precision,
        "location_longitude" double precision,
        "session_duration_seconds" integer,
        "session_token" character varying,
        "is_suspicious" boolean NOT NULL DEFAULT false,
        "suspicious_reasons" text,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_login_audit" PRIMARY KEY ("id")
      )
    `);

    // Ajouter les contraintes de clés étrangères
    await queryRunner.query(`
      ALTER TABLE "login_audit"
      ADD CONSTRAINT "FK_login_audit_user"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "login_audit"
      ADD CONSTRAINT "FK_login_audit_company"
      FOREIGN KEY ("company_id")
      REFERENCES "companies"("id")
      ON DELETE CASCADE
    `);

    // Créer les index pour les performances
    await queryRunner.query(`
      CREATE INDEX "IDX_login_audit_company_created_at"
      ON "login_audit" ("company_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_login_audit_user_created_at"
      ON "login_audit" ("user_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_login_audit_status_created_at"
      ON "login_audit" ("status", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_login_audit_ip_created_at"
      ON "login_audit" ("ip_address", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_login_audit_suspicious"
      ON "login_audit" ("is_suspicious", "created_at" DESC)
      WHERE "is_suspicious" = true
    `);

    console.log('✅ login_audit table and indexes created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Dropping login_audit table and related structures...');

    // Supprimer les index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_login_audit_suspicious"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_login_audit_ip_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_login_audit_status_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_login_audit_user_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_login_audit_company_created_at"`);

    // Supprimer les contraintes de clés étrangères
    await queryRunner.query(`ALTER TABLE "login_audit" DROP CONSTRAINT IF EXISTS "FK_login_audit_company"`);
    await queryRunner.query(`ALTER TABLE "login_audit" DROP CONSTRAINT IF EXISTS "FK_login_audit_user"`);

    // Supprimer la table
    await queryRunner.query(`DROP TABLE IF EXISTS "login_audit"`);

    // Supprimer les enums
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."login_audit_device_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."login_audit_status_enum"`);

    console.log('✅ login_audit table and related structures dropped successfully');
  }
}