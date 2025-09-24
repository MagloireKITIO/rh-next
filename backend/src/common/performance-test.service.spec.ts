import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceTestService, PerformanceTestResult } from './performance-test.service';
import { TransactionService } from './transaction.service';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('PerformanceTestService', () => {
  let service: PerformanceTestService;
  let dataSource: DataSource;
  let transactionService: TransactionService;

  const mockDataSource = {
    query: jest.fn(),
    createQueryRunner: jest.fn(),
    transaction: jest.fn(),
  };

  const mockTransactionService = {
    executeTransaction: jest.fn(),
    execute: jest.fn(),
  };

  const mockCompanyId = 'company-uuid-1';
  const mockProjectId = 'project-uuid-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceTestService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    service = module.get<PerformanceTestService>(PerformanceTestService);
    dataSource = module.get<DataSource>(getDataSourceToken());
    transactionService = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runPerformanceTests', () => {
    it('should run all performance tests successfully', async () => {
      const mockProjects = [{ id: mockProjectId }];
      const mockPlanResult = [{ 'QUERY PLAN': [{ 'Plan': { 'Total Cost': 100.5 } }] }];
      const mockQueryResult = [{ id: '1', name: 'Test Project' }];

      // Mock all queries with proper Promise.all structure
      mockDataSource.query.mockImplementation((query, params) => {
        if (query.includes('SELECT id FROM projects')) {
          return Promise.resolve(mockProjects);
        } else if (query.includes('EXPLAIN')) {
          return Promise.resolve(mockPlanResult);
        } else {
          return Promise.resolve(mockQueryResult);
        }
      });

      const results = await service.runPerformanceTests(mockCompanyId);

      expect(results).toHaveLength(5);
      expect(results[0]).toMatchObject({
        testName: 'Projects by Company',
        queryDescription: 'Récupération projets actifs d\'une entreprise avec comptage candidats',
        executionTime: expect.any(Number),
        rowsAffected: 1,
        planCost: 100.5,
        indexUsed: false,
        queryPlan: expect.any(String),
      });
    });

    it('should handle case when no projects exist', async () => {
      const mockPlanResult = [{ 'QUERY PLAN': [{ 'Plan': { 'Total Cost': 50.0 } }] }];
      const mockQueryResult = [{ id: '1', name: 'Test Project' }];

      mockDataSource.query.mockImplementation((query, params) => {
        if (query.includes('SELECT id FROM projects')) {
          return Promise.resolve([]); // No projects found
        } else if (query.includes('EXPLAIN')) {
          return Promise.resolve(mockPlanResult);
        } else {
          return Promise.resolve(mockQueryResult);
        }
      });

      const results = await service.runPerformanceTests(mockCompanyId);

      expect(results).toHaveLength(2); // Only projects and users tests
    });

    it('should detect index usage correctly', async () => {
      const mockProjects = [{ id: mockProjectId }];
      const mockPlanWithIndex = [{
        'QUERY PLAN': [{
          'Plan': {
            'Total Cost': 50.0,
            'Node Type': 'Index Scan',
          }
        }]
      }];
      const mockQueryResult = [{ id: '1', name: 'Test Project' }];

      mockDataSource.query.mockImplementation((query, params) => {
        if (query.includes('SELECT id FROM projects')) {
          return Promise.resolve(mockProjects);
        } else if (query.includes('EXPLAIN')) {
          return Promise.resolve(mockPlanWithIndex);
        } else {
          return Promise.resolve(mockQueryResult);
        }
      });

      const results = await service.runPerformanceTests(mockCompanyId);

      expect(results[0].indexUsed).toBe(true);
    });

    it('should handle query errors gracefully', async () => {
      const mockProjects = [{ id: mockProjectId }];
      const mockFallbackPlan = [{ 'QUERY PLAN': [{ 'Plan': { 'Total Cost': 0 } }] }];
      const mockQueryResult = [{ id: '1', name: 'Test Project' }];

      let explainCallCount = 0;
      mockDataSource.query.mockImplementation((query, params) => {
        if (query.includes('SELECT id FROM projects')) {
          return Promise.resolve(mockProjects);
        } else if (query.includes('EXPLAIN')) {
          explainCallCount++;
          if (explainCallCount === 1) {
            return Promise.reject(new Error('Query failed')); // First EXPLAIN fails
          }
          return Promise.resolve(mockFallbackPlan);
        } else {
          return Promise.resolve(mockQueryResult);
        }
      });

      const results = await service.runPerformanceTests(mockCompanyId);

      expect(results).toHaveLength(5);
      expect(results[0].planCost).toBe(0); // Should use fallback plan
    });
  });

  describe('runLoadTest', () => {
    it('should execute load test with concurrent operations', async () => {
      const mockTransactionResult = {
        success: true,
        data: { projectId: mockProjectId, executionTime: 100 },
        executionTime: 100,
      };

      mockTransactionService.executeTransaction.mockResolvedValue(mockTransactionResult);
      mockTransactionService.execute.mockResolvedValue(undefined); // For cleanup

      const result = await service.runLoadTest(mockCompanyId, 3);

      expect(result).toEqual({
        successCount: 3,
        errorCount: 0,
        averageTime: expect.any(Number),
        errors: [],
      });

      expect(mockTransactionService.executeTransaction).toHaveBeenCalledTimes(3);
      expect(mockTransactionService.execute).toHaveBeenCalledTimes(1); // Cleanup
    });

    it('should handle transaction failures in load test', async () => {
      // Mock different behaviors for each call
      let callCount = 0;
      mockTransactionService.executeTransaction.mockImplementation(async (operation) => {
        callCount++;
        const startTime = Date.now();

        if (callCount === 2) { // Second call fails
          throw new Error('Database connection failed');
        }

        // Simulate successful operation
        const result = await operation({
          query: jest.fn().mockResolvedValue([{ id: mockProjectId }])
        });

        return {
          success: true,
          data: { projectId: mockProjectId, executionTime: Date.now() - startTime },
          executionTime: Date.now() - startTime,
        };
      });

      mockTransactionService.execute.mockResolvedValue(undefined);

      const result = await service.runLoadTest(mockCompanyId, 3);

      expect(result).toEqual({
        successCount: 2,
        errorCount: 1,
        averageTime: expect.any(Number),
        errors: ['Database connection failed'],
      });
    });

    it('should handle cleanup failure gracefully', async () => {
      const mockTransactionResult = {
        success: true,
        data: { projectId: mockProjectId, executionTime: 100 },
        executionTime: 100,
      };

      mockTransactionService.executeTransaction.mockResolvedValue(mockTransactionResult);
      mockTransactionService.execute.mockRejectedValue(new Error('Cleanup failed'));

      // Should not throw even if cleanup fails
      const result = await service.runLoadTest(mockCompanyId, 1);

      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(0);
    });
  });

  describe('private methods through public interface', () => {
    it('should measure execution time correctly', async () => {
      const mockProjects = [{ id: mockProjectId }];
      const mockPlanResult = [{ 'QUERY PLAN': [{ 'Plan': { 'Total Cost': 100.5 } }] }];
      const mockQueryResult = [{ id: '1', name: 'Test Project' }];

      // Add delay to query to test timing
      mockDataSource.query.mockImplementation((query) => {
        if (query.includes('SELECT id FROM projects')) {
          return Promise.resolve(mockProjects);
        }
        return new Promise(resolve => {
          setTimeout(() => {
            if (query.includes('EXPLAIN')) {
              resolve(mockPlanResult);
            } else {
              resolve(mockQueryResult);
            }
          }, 10);
        });
      });

      const results = await service.runPerformanceTests(mockCompanyId);

      expect(results[0].executionTime).toBeGreaterThan(0);
    });

    it('should parse query plans correctly', async () => {
      const mockProjects = [{ id: mockProjectId }];
      const mockComplexPlan = [{
        'QUERY PLAN': [{
          'Plan': {
            'Total Cost': 250.75,
            'Node Type': 'Index Only Scan',
            'Index Name': 'idx_projects_company_id',
          }
        }]
      }];
      const mockQueryResult = [{ id: '1', name: 'Test Project' }];

      let queryCallCount = 0;
      mockDataSource.query.mockImplementation((query, params) => {
        if (query.includes('SELECT id FROM projects')) {
          return Promise.resolve(mockProjects);
        } else if (query.includes('EXPLAIN')) {
          queryCallCount++;
          if (queryCallCount === 1) {
            return Promise.resolve(mockComplexPlan);
          }
          return Promise.resolve([{ 'QUERY PLAN': [{ 'Plan': { 'Total Cost': 0 } }] }]);
        } else {
          return Promise.resolve(mockQueryResult);
        }
      });

      const results = await service.runPerformanceTests(mockCompanyId);

      expect(results[0].planCost).toBe(250.75);
      expect(results[0].indexUsed).toBe(true);
      expect(results[0].queryPlan).toContain('Index Only Scan');
    });
  });
});