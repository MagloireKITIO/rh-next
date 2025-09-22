import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlatformSettings1700000020000 implements MigrationInterface {
  name = 'CreatePlatformSettings1700000020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table platform_settings
    await queryRunner.query(`
      CREATE TABLE "platform_settings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "key" character varying NOT NULL,
        "value" jsonb NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_platform_settings_key" UNIQUE ("key"),
        CONSTRAINT "PK_platform_settings_id" PRIMARY KEY ("id")
      )
    `);
    console.log('Table platform_settings created');

    // Créer les configurations par défaut
    const defaultSettings = [
      {
        key: 'theme_configuration',
        value: {
          primaryColor: 'oklch(0.577 0.2 280)',
          secondaryColor: 'oklch(0.97 0 0)',
          accentColor: 'oklch(0.97 0 0)',
          destructiveColor: 'oklch(0.577 0.245 27.325)',
          borderRadius: '0.625rem',
          fontFamily: 'Inter, system-ui, sans-serif'
        },
        description: 'Configuration des couleurs et thème de la plateforme'
      },
      {
        key: 'branding_configuration',
        value: {
          logoUrl: '',
          title: 'RH Analytics Pro',
          favicon: '',
          companyName: 'RH Analytics Pro'
        },
        description: 'Configuration du branding (logo, titre, etc.)'
      },
      {
        key: 'layout_configuration',
        value: {
          showHeader: true,
          showFooter: true,
          sidebarStyle: 'expanded'
        },
        description: 'Configuration de la mise en page globale'
      },
      {
        key: 'page_configuration',
        value: {
          jobs: {
            header: { enabled: false, content: '' },
            footer: { enabled: false, content: '' }
          },
          dashboard: {
            header: { enabled: false, content: '' },
            footer: { enabled: false, content: '' }
          },
          candidates: {
            header: { enabled: false, content: '' },
            footer: { enabled: false, content: '' }
          }
        },
        description: 'Configuration spécifique par page'
      }
    ];

    for (const setting of defaultSettings) {
      const existingSetting = await queryRunner.query(
        `SELECT id FROM platform_settings WHERE key = $1`,
        [setting.key]
      );

      if (existingSetting.length === 0) {
        await queryRunner.query(
          `INSERT INTO platform_settings (id, key, value, description, "isActive", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())`,
          [setting.key, JSON.stringify(setting.value), setting.description]
        );
        console.log(`Platform setting ${setting.key} created`);
      } else {
        console.log(`Platform setting ${setting.key} already exists, skipping`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les configurations
    const settingKeys = [
      'theme_configuration',
      'branding_configuration',
      'layout_configuration',
      'page_configuration'
    ];

    for (const key of settingKeys) {
      await queryRunner.query(
        `DELETE FROM platform_settings WHERE key = $1`,
        [key]
      );
      console.log(`Platform setting ${key} removed`);
    }

    // Supprimer la table
    await queryRunner.query(`DROP TABLE "platform_settings"`);
    console.log('Table platform_settings dropped');
  }
}