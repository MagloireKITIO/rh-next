import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrivacyPolicyConfiguration1700000013000 implements MigrationInterface {
  name = 'CreatePrivacyPolicyConfiguration1700000013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const configurations = [
      {
        key: 'privacy_policy_enabled',
        value: 'false',
        description: 'Active ou désactive la politique de confidentialité obligatoire'
      },
      {
        key: 'privacy_policy_file_url',
        value: '',
        description: 'URL du fichier PDF de la politique de confidentialité'
      },
      {
        key: 'privacy_policy_file_name',
        value: '',
        description: 'Nom du fichier original de la politique de confidentialité'
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const configKeys = [
      'privacy_policy_enabled',
      'privacy_policy_file_url',
      'privacy_policy_file_name'
    ];

    for (const key of configKeys) {
      await queryRunner.query(
        `DELETE FROM configurations WHERE key = $1`,
        [key]
      );
      console.log(`Configuration ${key} removed`);
    }
  }
}