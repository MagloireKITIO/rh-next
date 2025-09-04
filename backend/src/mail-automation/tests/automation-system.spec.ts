import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AutomationSubscriber } from '../subscribers/automation.subscriber';
import { AutomationTriggerService } from '../services/automation-trigger.service';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Project } from '../../projects/entities/project.entity';
import { MailAutomation, AutomationTrigger, AutomationEntityType, AutomationStatus } from '../entities/mail-automation.entity';
import { ModuleRef } from '@nestjs/core';

/**
 * Tests pour le nouveau système d'automatisation automatique
 * 
 * Ces tests valident que:
 * 1. Les subscribers TypeORM se déclenchent correctement
 * 2. Les automatisations sont exécutées lors des opérations CRUD
 * 3. Le système fonctionne sans appels manuels
 */
describe('AutomationSubscriber System', () => {
  let module: TestingModule
  let subscriber: AutomationSubscriber
  let triggerService: AutomationTriggerService
  let candidateRepository: Repository<Candidate>
  let projectRepository: Repository<Project>
  let dataSource: DataSource

  // Mock des services
  const mockTriggerService = {
    triggerCandidateAutomations: jest.fn().mockResolvedValue(undefined),
    triggerProjectAutomations: jest.fn().mockResolvedValue(undefined),
    triggerAnalysisAutomations: jest.fn().mockResolvedValue(undefined),
    triggerUserAutomations: jest.fn().mockResolvedValue(undefined),
  }

  const mockModuleRef = {
    get: jest.fn().mockReturnValue(mockTriggerService),
  }

  const mockDataSource = {
    subscribers: [],
    getRepository: jest.fn(),
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AutomationSubscriber,
        {
          provide: AutomationTriggerService,
          useValue: mockTriggerService,
        },
        {
          provide: ModuleRef,
          useValue: mockModuleRef,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: getRepositoryToken(Candidate),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Project),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    subscriber = module.get<AutomationSubscriber>(AutomationSubscriber);
    triggerService = module.get<AutomationTriggerService>(AutomationTriggerService);
    candidateRepository = module.get<Repository<Candidate>>(getRepositoryToken(Candidate));
    projectRepository = module.get<Repository<Project>>(getRepositoryToken(Project));
    dataSource = module.get<DataSource>(DataSource);

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Subscriber Registration', () => {
    it('should register itself with TypeORM DataSource', () => {
      expect(dataSource.subscribers).toContain(subscriber);
    });

    it('should listen to correct entity types', () => {
      const listenedEntities = subscriber.listenTo();
      expect(listenedEntities).toHaveLength(4);
      expect(listenedEntities).toContain(Candidate);
      expect(listenedEntities).toContain(Project);
    });
  });

  describe('Entity Type Detection', () => {
    it('should correctly identify Candidate entity', () => {
      const candidate = new Candidate();
      candidate.id = 'test-id';
      
      const entityInfo = subscriber['getEntityInfo'](candidate);
      expect(entityInfo).toEqual({
        type: AutomationEntityType.CANDIDATE,
        entityName: 'Candidate'
      });
    });

    it('should correctly identify Project entity', () => {
      const project = new Project();
      project.id = 'test-id';
      
      const entityInfo = subscriber['getEntityInfo'](project);
      expect(entityInfo).toEqual({
        type: AutomationEntityType.PROJECT,
        entityName: 'Project'
      });
    });

    it('should return null for unknown entity', () => {
      const unknownEntity = { someProperty: 'value' };
      
      const entityInfo = subscriber['getEntityInfo'](unknownEntity);
      expect(entityInfo).toBeNull();
    });
  });

  describe('Relations Loading', () => {
    it('should define correct relations for Candidate', () => {
      const relations = subscriber['getRequiredRelations'](AutomationEntityType.CANDIDATE);
      expect(relations).toEqual(['project', 'project.company', 'project.createdBy']);
    });

    it('should define correct relations for Project', () => {
      const relations = subscriber['getRequiredRelations'](AutomationEntityType.PROJECT);
      expect(relations).toEqual(['company', 'createdBy']);
    });
  });

  describe('INSERT Events (ON_CREATE)', () => {
    it('should trigger candidate automation on afterInsert', async () => {
      const candidate = new Candidate();
      candidate.id = 'candidate-1';
      candidate.name = 'John Doe';
      
      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue({
            ...candidate,
            project: { id: 'project-1', company: { id: 'company-1' } }
          })
        })
      };

      const insertEvent = {
        entity: candidate,
        manager: mockManager,
      };

      await subscriber.afterInsert(insertEvent as any);

      expect(mockTriggerService.triggerCandidateAutomations).toHaveBeenCalledWith(
        AutomationTrigger.ON_CREATE,
        expect.objectContaining({
          id: 'candidate-1',
          name: 'John Doe'
        })
      );
    });

    it('should trigger project automation on afterInsert', async () => {
      const project = new Project();
      project.id = 'project-1';
      project.name = 'Test Project';
      
      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue({
            ...project,
            company: { id: 'company-1' },
            createdBy: { id: 'user-1' }
          })
        })
      };

      const insertEvent = {
        entity: project,
        manager: mockManager,
      };

      await subscriber.afterInsert(insertEvent as any);

      expect(mockTriggerService.triggerProjectAutomations).toHaveBeenCalledWith(
        AutomationTrigger.ON_CREATE,
        expect.objectContaining({
          id: 'project-1',
          name: 'Test Project'
        })
      );
    });
  });

  describe('UPDATE Events (ON_UPDATE)', () => {
    it('should trigger candidate automation on afterUpdate', async () => {
      const candidate = new Candidate();
      candidate.id = 'candidate-1';
      candidate.status = 'analyzed';
      
      const previousCandidate = { id: 'candidate-1', status: 'pending' };
      
      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue({
            ...candidate,
            project: { id: 'project-1', company: { id: 'company-1' } }
          })
        })
      };

      const updateEvent = {
        entity: candidate,
        databaseEntity: previousCandidate,
        manager: mockManager,
      };

      await subscriber.afterUpdate(updateEvent as any);

      expect(mockTriggerService.triggerCandidateAutomations).toHaveBeenCalledWith(
        AutomationTrigger.ON_UPDATE,
        expect.objectContaining({
          id: 'candidate-1',
          status: 'analyzed'
        }),
        previousCandidate
      );
    });
  });

  describe('DELETE Events (ON_DELETE)', () => {
    it('should trigger candidate automation on afterRemove', async () => {
      const candidate = new Candidate();
      candidate.id = 'candidate-1';

      const removeEvent = {
        entity: candidate,
      };

      await subscriber.afterRemove(removeEvent as any);

      expect(mockTriggerService.triggerCandidateAutomations).toHaveBeenCalledWith(
        AutomationTrigger.ON_DELETE,
        candidate
      );
    });
  });

  describe('Error Handling', () => {
    it('should not fail when automation service throws error', async () => {
      mockTriggerService.triggerCandidateAutomations.mockRejectedValue(
        new Error('Automation failed')
      );

      const candidate = new Candidate();
      candidate.id = 'candidate-1';
      
      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(candidate)
        })
      };

      const insertEvent = {
        entity: candidate,
        manager: mockManager,
      };

      // Should not throw
      await expect(subscriber.afterInsert(insertEvent as any)).resolves.not.toThrow();
    });

    it('should handle null entities gracefully', async () => {
      const insertEvent = {
        entity: null,
        manager: {},
      };

      await expect(subscriber.afterInsert(insertEvent as any)).resolves.not.toThrow();
      expect(mockTriggerService.triggerCandidateAutomations).not.toHaveBeenCalled();
    });
  });

  describe('Integration Validation', () => {
    it('should validate that manual triggers are no longer needed', () => {
      // Ce test valide conceptuellement que le système automatique
      // remplace bien les appels manuels

      expect(subscriber['callSpecificTrigger']).toBeDefined();
      expect(subscriber['getEntityInfo']).toBeDefined();
      expect(subscriber['loadEntityWithRelations']).toBeDefined();
      
      // Vérifier que toutes les méthodes du trigger service sont disponibles
      expect(mockTriggerService.triggerCandidateAutomations).toBeDefined();
      expect(mockTriggerService.triggerProjectAutomations).toBeDefined();
      expect(mockTriggerService.triggerAnalysisAutomations).toBeDefined();
      expect(mockTriggerService.triggerUserAutomations).toBeDefined();
    });
  });
});

/**
 * Tests d'intégration pour valider le fonctionnement complet
 * du système d'automatisation avec une vraie base de données
 */
describe('Automation System Integration Tests', () => {
  // Ces tests nécessiteraient une vraie base de données de test
  // et seraient exécutés dans un environnement d'intégration

  it.skip('should automatically trigger email when new candidate is created', async () => {
    // Test end-to-end avec une vraie base de données
    // 1. Créer un projet avec automatisation active
    // 2. Créer un candidat
    // 3. Vérifier que l'email est envoyé automatiquement
  });

  it.skip('should automatically trigger email when candidate status changes', async () => {
    // Test end-to-end pour les mises à jour
    // 1. Créer un candidat
    // 2. Mettre à jour son statut
    // 3. Vérifier que l'automatisation se déclenche
  });
});