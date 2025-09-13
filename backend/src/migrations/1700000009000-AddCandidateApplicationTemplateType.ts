import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCandidateApplicationTemplateType1700000009000 implements MigrationInterface {
  name = 'AddCandidateApplicationTemplateType1700000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Adding CANDIDATE_APPLICATION template type...');
    
    // Le champ template_type est déjà défini comme varchar, 
    // donc la nouvelle valeur 'candidate_application' peut être utilisée directement
    // Aucune modification de schéma nécessaire
    
    console.log('✅ CANDIDATE_APPLICATION template type is now available');
    console.log('📝 You can now create templates with template_type = "candidate_application"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Rolling back CANDIDATE_APPLICATION template type...');
    
    // Supprimer les templates existants de ce type (si applicable)
    try {
      await queryRunner.query(`
        DELETE FROM "mail_templates" 
        WHERE "template_type" = 'candidate_application'
      `);
      console.log('✅ Removed existing CANDIDATE_APPLICATION templates');
    } catch (e) {
      console.log('⚠️ No CANDIDATE_APPLICATION templates to remove:', e.message);
    }
  }
}