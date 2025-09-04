import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1700000001000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index critiques pour l'isolation multi-tenant et les performances
    console.log('Creating performance indexes...');
    
    // Créer les index un par un en vérifiant l'existence des tables d'abord
    const tables = await queryRunner.getTables();
    const tableNames = tables.map(t => t.name);
    
    console.log('Available tables:', tableNames);

    // Index pour projects (toujours présent)
    try {
      await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_projects_company_status" ON "projects" ("company_id", "status", "createdAt" DESC)');
      console.log('✅ idx_projects_company_status created');
    } catch (e) { console.log('⚠️ idx_projects_company_status skipped:', e.message); }

    // Index pour candidates (toujours présent)
    try {
      await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_candidates_project_status" ON "candidates" ("projectId", "status", "score" DESC)');
      console.log('✅ idx_candidates_project_status created');
    } catch (e) { console.log('⚠️ idx_candidates_project_status skipped:', e.message); }

    // Index pour users (toujours présent)  
    try {
      await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_users_company_role" ON "users" ("company_id", "role", "is_active")');
      console.log('✅ idx_users_company_role created');
    } catch (e) { console.log('⚠️ idx_users_company_role skipped:', e.message); }

    // Index pour analyses (seulement si la table existe)
    if (tableNames.includes('analyses')) {
      try {
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_analyses_project_candidate" ON "analyses" ("projectId", "candidateId", "createdAt" DESC)');
        console.log('✅ idx_analyses_project_candidate created');
      } catch (e) { console.log('⚠️ idx_analyses_project_candidate skipped:', e.message); }
    } else {
      console.log('⚠️ Table "analyses" not found, skipping related indexes');
    }

    // Index conditionnel pour candidates
    try {
      await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_candidates_ranking" ON "candidates" ("projectId", "ranking", "score" DESC) WHERE "status" = \'analyzed\'');
      console.log('✅ idx_candidates_ranking created');
    } catch (e) { console.log('⚠️ idx_candidates_ranking skipped:', e.message); }

    // Index pour partages publics
    try {
      await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_projects_public_share" ON "projects" ("public_share_token", "is_public_shared", "public_share_expires_at")');
      console.log('✅ idx_projects_public_share created');
    } catch (e) { console.log('⚠️ idx_projects_public_share skipped:', e.message); }

    // Index pour dates de création
    try {
      await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_projects_created_at" ON "projects" ("company_id", "createdAt" DESC)');
      console.log('✅ idx_projects_created_at created');
    } catch (e) { console.log('⚠️ idx_projects_created_at skipped:', e.message); }

    try {
      await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_candidates_created_at" ON "candidates" ("projectId", "createdAt" DESC)');
      console.log('✅ idx_candidates_created_at created');
    } catch (e) { console.log('⚠️ idx_candidates_created_at skipped:', e.message); }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les index dans l'ordre inverse
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_candidates_created_at"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_projects_created_at"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_projects_public_share"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_candidates_ranking"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_analysis_project_candidate"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_users_company_role"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_candidates_project_status"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_projects_company_status"`);
  }
}