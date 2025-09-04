import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TransactionService } from './transaction.service';

export interface PerformanceTestResult {
  testName: string;
  queryDescription: string;
  executionTime: number;
  rowsAffected: number;
  planCost: number;
  indexUsed: boolean;
  queryPlan: string;
}

@Injectable()
export class PerformanceTestService {
  private readonly logger = new Logger(PerformanceTestService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private transactionService: TransactionService,
  ) {}

  /**
   * Exécute un ensemble de tests de performance sur les requêtes critiques
   */
  async runPerformanceTests(companyId: string): Promise<PerformanceTestResult[]> {
    const results: PerformanceTestResult[] = [];
    
    this.logger.log('🚀 Starting performance tests...');

    // Test 1: Récupération projets par entreprise
    results.push(await this.testProjectsByCompany(companyId));
    
    // Test 2: Candidats par projet avec statut
    const projects = await this.dataSource.query(
      'SELECT id FROM projects WHERE company_id = $1 LIMIT 1', 
      [companyId]
    );
    
    if (projects.length > 0) {
      results.push(await this.testCandidatesByProjectStatus(projects[0].id));
    }
    
    // Test 3: Recherche utilisateurs par entreprise et rôle
    results.push(await this.testUsersByCompanyRole(companyId));
    
    // Test 4: Analyses par projet (avec tri)
    if (projects.length > 0) {
      results.push(await this.testAnalysesByProject(projects[0].id));
    }
    
    // Test 5: Ranking des candidats
    if (projects.length > 0) {
      results.push(await this.testCandidateRanking(projects[0].id));
    }

    // Summary
    this.logger.log('📊 Performance Test Results:');
    results.forEach(result => {
      const status = result.indexUsed ? '✅' : '⚠️';
      this.logger.log(`${status} ${result.testName}: ${result.executionTime}ms (${result.indexUsed ? 'with index' : 'no index'})`);
    });

    return results;
  }

  /**
   * Test: Récupération des projets par entreprise
   */
  private async testProjectsByCompany(companyId: string): Promise<PerformanceTestResult> {
    const query = `
      SELECT p.*, COUNT(c.id) as candidate_count
      FROM projects p
      LEFT JOIN candidates c ON p.id = c.projectId
      WHERE p.company_id = $1 AND p.status = 'active'
      GROUP BY p.id
      ORDER BY p.createdAt DESC
      LIMIT 20
    `;

    return await this.executePerformanceTest(
      'Projects by Company',
      'Récupération projets actifs d\'une entreprise avec comptage candidats',
      query,
      [companyId]
    );
  }

  /**
   * Test: Candidats par projet avec statut
   */
  private async testCandidatesByProjectStatus(projectId: string): Promise<PerformanceTestResult> {
    const query = `
      SELECT c.*, a.score
      FROM candidates c
      LEFT JOIN analysis a ON c.id = a.candidateId
      WHERE c.projectId = $1 AND c.status = 'analyzed'
      ORDER BY c.score DESC, c.ranking ASC
      LIMIT 50
    `;

    return await this.executePerformanceTest(
      'Candidates by Project Status',
      'Candidats analysés d\'un projet avec score, triés par performance',
      query,
      [projectId]
    );
  }

  /**
   * Test: Utilisateurs par entreprise et rôle
   */
  private async testUsersByCompanyRole(companyId: string): Promise<PerformanceTestResult> {
    const query = `
      SELECT u.*
      FROM users u
      WHERE u.company_id = $1 
        AND u.role IN ('hr', 'admin') 
        AND u.is_active = true
      ORDER BY u.created_at DESC
    `;

    return await this.executePerformanceTest(
      'Users by Company Role',
      'Utilisateurs actifs HR/Admin d\'une entreprise',
      query,
      [companyId]
    );
  }

  /**
   * Test: Analyses par projet
   */
  private async testAnalysesByProject(projectId: string): Promise<PerformanceTestResult> {
    const query = `
      SELECT a.*, c.name as candidate_name
      FROM analysis a
      INNER JOIN candidates c ON a.candidateId = c.id
      WHERE a.projectId = $1
      ORDER BY a.createdAt DESC
      LIMIT 100
    `;

    return await this.executePerformanceTest(
      'Analyses by Project',
      'Analyses d\'un projet avec nom candidat, triées par date',
      query,
      [projectId]
    );
  }

  /**
   * Test: Ranking des candidats optimisé
   */
  private async testCandidateRanking(projectId: string): Promise<PerformanceTestResult> {
    const query = `
      SELECT c.id, c.name, c.score, c.ranking, c.status
      FROM candidates c
      WHERE c.projectId = $1 AND c.status = 'analyzed'
      ORDER BY c.ranking ASC, c.score DESC
      LIMIT 20
    `;

    return await this.executePerformanceTest(
      'Candidate Ranking',
      'Top 20 candidats d\'un projet par ranking/score',
      query,
      [projectId]
    );
  }

  /**
   * Exécute un test de performance avec analyse du plan d'exécution
   */
  private async executePerformanceTest(
    testName: string,
    queryDescription: string,
    query: string,
    params: any[]
  ): Promise<PerformanceTestResult> {
    
    // 1. Obtenir le plan d'exécution
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
    
    const startTime = Date.now();
    const [planResult, queryResult] = await Promise.all([
      this.dataSource.query(explainQuery, params).catch(() => [{ 'QUERY PLAN': [{ 'Plan': { 'Total Cost': 0 } }] }]),
      this.dataSource.query(query, params)
    ]);
    const executionTime = Date.now() - startTime;

    // 2. Analyser le plan
    const plan = planResult[0]['QUERY PLAN'][0];
    const planCost = plan.Plan?.['Total Cost'] || 0;
    const planText = JSON.stringify(plan, null, 2);
    
    // 3. Détecter l'utilisation d'index
    const indexUsed = planText.includes('Index Scan') || planText.includes('Index Only Scan');
    
    return {
      testName,
      queryDescription,
      executionTime,
      rowsAffected: queryResult.length,
      planCost,
      indexUsed,
      queryPlan: planText
    };
  }

  /**
   * Test de charge pour valider la robustesse des transactions
   */
  async runLoadTest(companyId: string, concurrentOperations: number = 10): Promise<{
    successCount: number;
    errorCount: number;
    averageTime: number;
    errors: string[];
  }> {
    this.logger.log(`🔥 Starting load test with ${concurrentOperations} concurrent operations`);
    
    const operations = Array(concurrentOperations).fill(null).map(async (_, index) => {
      const startTime = Date.now();
      
      try {
        // Simulation d'opération complexe avec transaction
        const result = await this.transactionService.executeTransaction(async (manager) => {
          // Simuler création projet + candidats
          const project = await manager.query(
            'INSERT INTO projects (name, jobDescription, company_id, created_by, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [`Test Project ${index}`, 'Load test description', companyId, companyId, 'active']
          );
          
          // Simuler ajout de candidats
          await manager.query(
            'INSERT INTO candidates (name, extractedText, fileName, fileUrl, projectId, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [`Candidate ${index}`, 'Test CV content', `cv_${index}.pdf`, 'http://example.com', project[0].id, 'pending']
          );
          
          return { projectId: project[0].id, executionTime: Date.now() - startTime };
        });
        
        return { success: true, time: result.executionTime, error: null };
        
      } catch (error) {
        return { success: false, time: Date.now() - startTime, error: error.message };
      }
    });
    
    const results = await Promise.all(operations);
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const averageTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
    const errors = results.filter(r => !r.success).map(r => r.error);
    
    this.logger.log(`📊 Load test completed: ${successCount} success, ${errorCount} errors, ${averageTime.toFixed(2)}ms average`);
    
    // Nettoyer les données de test
    await this.cleanupTestData(companyId);
    
    return { successCount, errorCount, averageTime, errors };
  }

  /**
   * Nettoie les données de test créées
   */
  private async cleanupTestData(companyId: string): Promise<void> {
    try {
      await this.transactionService.execute(async (manager) => {
        // Supprimer les projets de test et leurs candidats (cascade)
        await manager.query(
          'DELETE FROM projects WHERE company_id = $1 AND name LIKE $2',
          [companyId, 'Test Project %']
        );
      });
      
      this.logger.log('🧹 Test data cleaned up');
    } catch (error) {
      this.logger.error('Error cleaning up test data:', error);
    }
  }
}