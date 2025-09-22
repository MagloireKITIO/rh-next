import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOfferImageFields1700000021000 implements MigrationInterface {
  name = 'AddOfferImageFields1700000021000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier et ajouter les colonnes d'image d'offre seulement si elles n'existent pas déjà
    const table = await queryRunner.getTable('projects');

    const columnsToAdd = [
      { name: 'offerImageUrl', type: 'varchar', isNullable: true },
      { name: 'offerImageFileName', type: 'varchar', isNullable: true },
    ];

    for (const columnDef of columnsToAdd) {
      const existingColumn = table?.findColumnByName(columnDef.name);

      if (!existingColumn) {
        console.log(`Adding column ${columnDef.name} to projects table`);
        await queryRunner.addColumn('projects', new TableColumn(columnDef));
      } else {
        console.log(`Column ${columnDef.name} already exists in projects table, skipping`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les colonnes en cas de rollback (seulement si elles existent)
    const table = await queryRunner.getTable('projects');
    const columnsToRemove = [
      'offerImageUrl',
      'offerImageFileName'
    ];

    for (const columnName of columnsToRemove) {
      const existingColumn = table?.findColumnByName(columnName);

      if (existingColumn) {
        console.log(`Removing column ${columnName} from projects table`);
        await queryRunner.dropColumn('projects', columnName);
      } else {
        console.log(`Column ${columnName} does not exist in projects table, skipping`);
      }
    }
  }
}