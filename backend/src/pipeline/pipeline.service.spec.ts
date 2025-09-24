import { Test, TestingModule } from '@nestjs/testing';
import { PipelineService } from './pipeline.service';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RecruitmentPipeline } from './entities/recruitment-pipeline.entity';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { CandidatePipelineStatus } from './entities/candidate-pipeline-status.entity';
import { PipelineEvent } from './entities/pipeline-event.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Project } from '../projects/entities/project.entity';
import { NotFoundException, BadRequestException, Logger } from '@nestjs/common';

describe('PipelineService', () => {
  let service: PipelineService;
  let pipelineRepository: Repository<RecruitmentPipeline>;
  let stageRepository: Repository<PipelineStage>;
  let candidateStatusRepository: Repository<CandidatePipelineStatus>;
  let pipelineEventRepository: Repository<PipelineEvent>;
  let candidateRepository: Repository<Candidate>;
  let projectRepository: Repository<Project>;
  let dataSource: DataSource;

  const mockPipeline = {
    id: 'pipeline-uuid-1',
    name: 'Pipeline de Recrutement',
    description: 'Pipeline par défaut pour le suivi des candidats',
    projectId: 'project-uuid-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProject = {
    id: 'project-uuid-1',
    name: 'Test Project',
    company_id: 'company-uuid-1',
    created_by: 'user-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStage = {
    id: 'stage-uuid-1',
    name: 'Candidature',
    description: 'Candidats ayant postulé',
    color: '#3b82f6',
    order: 1,
    isDefault: true,
    isActive: true,
    pipelineId: 'pipeline-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCandidate = {
    id: 'candidate-uuid-1',
    name: 'John Doe',
    email: 'john@example.com',
    projectId: 'project-uuid-1',
    status: 'active',
    score: 85,
    ranking: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPipelineRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockStageRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCandidateStatusRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPipelineEventRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockCandidateRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockProjectRepository = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockTransactionManager = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineService,
        {
          provide: getRepositoryToken(RecruitmentPipeline),
          useValue: mockPipelineRepository,
        },
        {
          provide: getRepositoryToken(PipelineStage),
          useValue: mockStageRepository,
        },
        {
          provide: getRepositoryToken(CandidatePipelineStatus),
          useValue: mockCandidateStatusRepository,
        },
        {
          provide: getRepositoryToken(PipelineEvent),
          useValue: mockPipelineEventRepository,
        },
        {
          provide: getRepositoryToken(Candidate),
          useValue: mockCandidateRepository,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<PipelineService>(PipelineService);
    pipelineRepository = module.get<Repository<RecruitmentPipeline>>(getRepositoryToken(RecruitmentPipeline));
    stageRepository = module.get<Repository<PipelineStage>>(getRepositoryToken(PipelineStage));
    candidateStatusRepository = module.get<Repository<CandidatePipelineStatus>>(getRepositoryToken(CandidatePipelineStatus));
    pipelineEventRepository = module.get<Repository<PipelineEvent>>(getRepositoryToken(PipelineEvent));
    candidateRepository = module.get<Repository<Candidate>>(getRepositoryToken(Candidate));
    projectRepository = module.get<Repository<Project>>(getRepositoryToken(Project));
    dataSource = module.get<DataSource>(DataSource);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDefaultPipeline', () => {
    it('should create default pipeline with stages successfully', async () => {
      const projectId = 'project-uuid-1';
      const candidates = [mockCandidate];
      const stages = [
        { ...mockStage, id: 'stage-1', name: 'Candidature', order: 1 },
        { ...mockStage, id: 'stage-2', name: 'Pré-sélection', order: 2 },
        { ...mockStage, id: 'stage-3', name: 'Entretien RH', order: 3 },
        { ...mockStage, id: 'stage-4', name: 'Entretien Technique', order: 4 },
        { ...mockStage, id: 'stage-5', name: 'Décision Finale', order: 5 },
      ];

      mockTransactionManager.create
        .mockReturnValueOnce(mockPipeline) // Pipeline creation
        .mockReturnValueOnce(stages[0]) // Stage 1
        .mockReturnValueOnce(stages[1]) // Stage 2
        .mockReturnValueOnce(stages[2]) // Stage 3
        .mockReturnValueOnce(stages[3]) // Stage 4
        .mockReturnValueOnce(stages[4]) // Stage 5
        .mockReturnValueOnce({ candidateId: 'candidate-uuid-1', currentStageId: 'stage-1' }); // Candidate status

      mockTransactionManager.save
        .mockResolvedValueOnce(mockPipeline) // Pipeline save
        .mockResolvedValueOnce(stages[0]) // Stage 1 save
        .mockResolvedValueOnce(stages[1]) // Stage 2 save
        .mockResolvedValueOnce(stages[2]) // Stage 3 save
        .mockResolvedValueOnce(stages[3]) // Stage 4 save
        .mockResolvedValueOnce(stages[4]) // Stage 5 save
        .mockResolvedValueOnce({ id: 'status-1' }); // Candidate status save

      mockTransactionManager.find.mockResolvedValue(candidates);

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionManager);
      });

      const result = await service.createDefaultPipeline(projectId);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockTransactionManager.create).toHaveBeenCalledTimes(7); // 1 pipeline + 5 stages + 1 candidate status
      expect(mockTransactionManager.save).toHaveBeenCalledTimes(7); // Same as create
      expect(mockTransactionManager.find).toHaveBeenCalledWith(Candidate, { where: { projectId } });
      expect(result).toEqual(expect.objectContaining({
        ...mockPipeline,
        stages: stages,
      }));
    });

    it('should handle pipeline creation with no existing candidates', async () => {
      const projectId = 'project-uuid-1';

      mockTransactionManager.create
        .mockReturnValueOnce(mockPipeline)
        .mockReturnValue(mockStage);

      mockTransactionManager.save
        .mockResolvedValueOnce(mockPipeline)
        .mockResolvedValue(mockStage);

      mockTransactionManager.find.mockResolvedValue([]); // No candidates

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionManager);
      });

      const result = await service.createDefaultPipeline(projectId);

      expect(mockTransactionManager.find).toHaveBeenCalledWith(Candidate, { where: { projectId } });
      expect(result).toEqual(expect.objectContaining(mockPipeline));
    });

    it('should handle transaction errors', async () => {
      const projectId = 'project-uuid-1';
      const error = new Error('Transaction failed');

      mockDataSource.transaction.mockRejectedValue(error);

      await expect(service.createDefaultPipeline(projectId)).rejects.toThrow('Transaction failed');
    });
  });

  describe('findByProject', () => {
    const projectId = 'project-uuid-1';
    const companyId = 'company-uuid-1';

    it('should return pipelines for a valid project', async () => {
      const pipelines = [mockPipeline];

      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockPipelineRepository.find.mockResolvedValue(pipelines);

      const result = await service.findByProject(projectId, companyId);

      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId, company_id: companyId },
      });
      expect(mockPipelineRepository.find).toHaveBeenCalledWith({
        where: { projectId },
        relations: ['stages'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(pipelines);
    });

    it('should throw NotFoundException when project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.findByProject(projectId, companyId)).rejects.toThrow(
        new NotFoundException(`Project with ID ${projectId} not found in your company`)
      );
    });

    it('should throw NotFoundException when project belongs to different company', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.findByProject(projectId, 'other-company')).rejects.toThrow(
        new NotFoundException(`Project with ID ${projectId} not found in your company`)
      );
    });
  });

  describe('findOne', () => {
    const pipelineId = 'pipeline-uuid-1';
    const companyId = 'company-uuid-1';

    it('should return pipeline when found and authorized', async () => {
      const pipelineWithProject = {
        ...mockPipeline,
        project: mockProject,
        stages: [mockStage],
      };

      mockPipelineRepository.findOne.mockResolvedValue(pipelineWithProject);

      const result = await service.findOne(pipelineId, companyId);

      expect(mockPipelineRepository.findOne).toHaveBeenCalledWith({
        where: { id: pipelineId },
        relations: ['project', 'stages'],
      });
      expect(result).toEqual(pipelineWithProject);
    });

    it('should throw NotFoundException when pipeline not found', async () => {
      mockPipelineRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(pipelineId, companyId)).rejects.toThrow(
        new NotFoundException(`Pipeline with ID ${pipelineId} not found`)
      );
    });

    it('should throw NotFoundException when pipeline belongs to different company', async () => {
      const pipelineWithProject = {
        ...mockPipeline,
        project: { ...mockProject, company_id: 'other-company' },
      };

      mockPipelineRepository.findOne.mockResolvedValue(pipelineWithProject);

      await expect(service.findOne(pipelineId, companyId)).rejects.toThrow(
        new NotFoundException(`Pipeline with ID ${pipelineId} not found in your company`)
      );
    });
  });

  describe('getPipelineWithCandidates', () => {
    const pipelineId = 'pipeline-uuid-1';
    const companyId = 'company-uuid-1';

    it('should return pipeline with stages and candidates', async () => {
      const pipelineWithProject = {
        ...mockPipeline,
        project: mockProject,
        stages: [],
      };

      const stages = [mockStage];
      const candidateStatuses = [{
        id: 'status-1',
        candidateId: 'candidate-uuid-1',
        currentStageId: 'stage-uuid-1',
        candidate: mockCandidate,
      }];

      mockPipelineRepository.findOne.mockResolvedValue(pipelineWithProject);
      mockStageRepository.find.mockResolvedValue(stages);
      mockCandidateStatusRepository.find.mockResolvedValue(candidateStatuses);

      const result = await service.getPipelineWithCandidates(pipelineId, companyId);

      expect(mockPipelineRepository.findOne).toHaveBeenCalledWith({
        where: { id: pipelineId },
        relations: ['project', 'stages'],
      });
      expect(mockStageRepository.find).toHaveBeenCalledWith({
        where: { pipelineId },
        order: { order: 'ASC' },
      });
      expect(mockCandidateStatusRepository.find).toHaveBeenCalledWith({
        where: { currentStageId: mockStage.id },
        relations: ['candidate'],
        order: { movedAt: 'DESC' },
      });
    });

    it('should handle pipeline not found', async () => {
      mockPipelineRepository.findOne.mockResolvedValue(null);

      await expect(service.getPipelineWithCandidates(pipelineId, companyId)).rejects.toThrow(
        new NotFoundException(`Pipeline with ID ${pipelineId} not found`)
      );
    });

    it('should return pipeline with empty stages', async () => {
      const pipelineWithProject = {
        ...mockPipeline,
        project: mockProject,
        stages: [],
      };

      mockPipelineRepository.findOne.mockResolvedValue(pipelineWithProject);
      mockStageRepository.find.mockResolvedValue([]);

      const result = await service.getPipelineWithCandidates(pipelineId, companyId);

      expect(result).toEqual(expect.objectContaining({
        ...pipelineWithProject,
        stages: [],
      }));
    });
  });
});