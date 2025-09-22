import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGoogleOAuthConfiguration1700000018000 implements MigrationInterface {
  name = 'CreateGoogleOAuthConfiguration1700000018000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const configurations = [
      {
        key: 'google_oauth_client_id',
        value: '',
        description: 'Client ID Google OAuth pour l\'authentification Google Calendar'
      },
      {
        key: 'google_oauth_client_secret',
        value: '',
        description: 'Client Secret Google OAuth pour l\'authentification Google Calendar'
      },
      {
        key: 'google_oauth_redirect_uri',
        value: 'http://localhost:3001/api/integrations/google-calendar/callback',
        description: 'URI de redirection pour l\'OAuth Google Calendar'
      }
    ];

    for (const config of configurations) {
      const existingConfig = await queryRunner.query(
        `SELECT id FROM configurations WHERE key = $1`,
        [config.key]
      );

      if (existingConfig.length === 0) {
        await queryRunner.query(
          `INSERT INTO configurations (id, key, value, description, "isActive", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())`,
          [config.key, config.value, config.description]
        );
        console.log(`Configuration ${config.key} created`);
      } else {
        console.log(`Configuration ${config.key} already exists, skipping`);
      }
    }

    console.log('✅ Configurations Google OAuth créées');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const configKeys = [
      'google_oauth_client_id',
      'google_oauth_client_secret',
      'google_oauth_redirect_uri'
    ];

    for (const key of configKeys) {
      await queryRunner.query(
        `DELETE FROM configurations WHERE key = $1`,
        [key]
      );
      console.log(`Configuration ${key} removed`);
    }

    console.log('✅ Configurations Google OAuth supprimées');
  }
}