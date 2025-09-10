import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCandidateSource1700000010000 implements MigrationInterface {
  name = 'AddCandidateSource1700000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer l'enum type si il n'existe pas déjà
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'candidate_source_enum') THEN
          CREATE TYPE candidate_source_enum AS ENUM ('import', 'application');
        END IF;
      END
      $$;
    `);

    // Ajouter la colonne source avec une valeur par défaut
    await queryRunner.addColumn('candidates', new TableColumn({
      name: 'source',
      type: 'enum',
      enum: ['import', 'application'],
      enumName: 'candidate_source_enum',
      default: "'import'", // Valeur par défaut pour les candidats existants
      isNullable: false,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la colonne source
    await queryRunner.dropColumn('candidates', 'source');
    
    // Supprimer l'enum type
    await queryRunner.query(`DROP TYPE IF EXISTS candidate_source_enum;`);
  }
}