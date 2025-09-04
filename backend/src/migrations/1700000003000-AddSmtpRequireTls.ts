import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSmtpRequireTls1700000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter la colonne smtp_require_tls à la table mail_configurations
    await queryRunner.addColumn(
      'mail_configurations',
      new TableColumn({
        name: 'smtp_require_tls',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la colonne smtp_require_tls
    await queryRunner.dropColumn('mail_configurations', 'smtp_require_tls');
  }
}