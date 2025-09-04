import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddJobOfferFields1700000000000 implements MigrationInterface {
  name = 'AddJobOfferFields1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier et ajouter les colonnes seulement si elles n'existent pas déjà
    const table = await queryRunner.getTable('projects');
    
    const columnsToAdd = [
      { name: 'startDate', type: 'timestamp', isNullable: true },
      { name: 'endDate', type: 'timestamp', isNullable: true },
      { name: 'offerDescription', type: 'text', isNullable: true },
      { name: 'offerDocumentUrl', type: 'varchar', isNullable: true },
      { name: 'offerDocumentFileName', type: 'varchar', isNullable: true },
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
      'startDate',
      'endDate', 
      'offerDescription',
      'offerDocumentUrl',
      'offerDocumentFileName'
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