import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateMailConfigurationCompanies1700000005000 implements MigrationInterface {
  name = 'CreateMailConfigurationCompanies1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table mail_configuration_companies
    await queryRunner.createTable(
      new Table({
        name: 'mail_configuration_companies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'mail_configuration_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Créer un index unique pour éviter les doublons
    await queryRunner.createIndex(
      'mail_configuration_companies',
      new TableIndex({
        name: 'IDX_mail_configuration_company_unique',
        columnNames: ['mail_configuration_id', 'company_id'],
        isUnique: true
      })
    );

    // Créer les clés étrangères
    await queryRunner.createForeignKey(
      'mail_configuration_companies',
      new TableForeignKey({
        name: 'FK_mail_config_company_config',
        columnNames: ['mail_configuration_id'],
        referencedTableName: 'mail_configurations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'mail_configuration_companies',
      new TableForeignKey({
        name: 'FK_mail_config_company_company',
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les clés étrangères
    await queryRunner.dropForeignKey('mail_configuration_companies', 'FK_mail_config_company_company');
    await queryRunner.dropForeignKey('mail_configuration_companies', 'FK_mail_config_company_config');
    
    // Supprimer l'index
    await queryRunner.dropIndex('mail_configuration_companies', 'IDX_mail_configuration_company_unique');
    
    // Supprimer la table
    await queryRunner.dropTable('mail_configuration_companies');
  }
}