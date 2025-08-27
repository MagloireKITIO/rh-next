import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddJobOfferFields1700000000000 implements MigrationInterface {
  name = 'AddJobOfferFields1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter les nouveaux champs pour les offres d'emploi
    await queryRunner.addColumns('projects', [
      new TableColumn({
        name: 'startDate',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'endDate',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'offerDescription',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'offerDocumentUrl',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'offerDocumentFileName',
        type: 'varchar',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les colonnes en cas de rollback
    await queryRunner.dropColumns('projects', [
      'startDate',
      'endDate', 
      'offerDescription',
      'offerDocumentUrl',
      'offerDocumentFileName'
    ]);
  }
}