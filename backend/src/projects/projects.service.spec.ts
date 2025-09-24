import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Analysis } from '../analysis/entities/analysis.entity';
import { StorageService } from '../storage/storage.service';
import { AnalysisQueueService } from '../candidates/analysis-queue.service';
import { PipelineService } from '../pipeline/pipeline.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { NotFoundException, Logger } from '@nestjs/common';

// Mock type for repository methods
export type MockType<T> = {
  [P in keyof T]?: jest.Mock<any, any>;
};

// Mock objects for repositories
const createMockRepository = () => ({
  create: jest.fn(entity => entity),
  save: jest.fn(entity => Promise.resolve(entity)),
  find: jest.fn(() => Promise.resolve([])),
  findOne: jest.fn(() => Promise.resolve(null)),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(() => Promise.resolve(0)),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(() => Promise.resolve({ avgScore: '75.5' })),
    getRawMany: jest.fn(() => Promise.resolve([])),
    getMany: jest.fn(() => Promise.resolve([])),
    getManyAndCount: jest.fn(() => Promise.resolve([[], 0])),
    getOne: jest.fn(() => Promise.resolve(null)),
  })),
});

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepositoryMock: MockType<Repository<Project>>;
  let candidateRepositoryMock: MockType<Repository<Candidate>>;
  let analysisRepositoryMock: MockType<Repository<Analysis>>;
  let dataSource: DataSource;
  let storageService: StorageService;
  let analysisQueueService: AnalysisQueueService;
  let pipelineService: PipelineService;

  const mockProject = {
    id: 'project-uuid-1',
    name: 'Test Project',
    jobDescription: 'Test job description',
    status: 'active',
    company_id: 'company-uuid-1',
    created_by: 'user-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };


  const mockStorageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    uploadOfferDocument: jest.fn(),
    uploadOfferImage: jest.fn(),
  };

  const mockAnalysisQueueService = {
    addToQueue: jest.fn(),
  };

  const mockPipelineService = {
    createDefaultPipeline: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
    getRepository: jest.fn(),
  };

  const mockTransactionManager = {
    findOne: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Candidate),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Analysis),
          useValue: createMockRepository(),
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: AnalysisQueueService,
          useValue: mockAnalysisQueueService,
        },
        {
          provide: PipelineService,
          useValue: mockPipelineService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectRepositoryMock = module.get(getRepositoryToken(Project));
    candidateRepositoryMock = module.get(getRepositoryToken(Candidate));
    analysisRepositoryMock = module.get(getRepositoryToken(Analysis));
    dataSource = module.get<DataSource>(DataSource);
    storageService = module.get<StorageService>(StorageService);
    analysisQueueService = module.get<AnalysisQueueService>(AnalysisQueueService);
    pipelineService = module.get<PipelineService>(PipelineService);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    // Setup transaction mock to execute callback
    mockDataSource.transaction.mockImplementation(async (callback) => {
      return await callback(mockTransactionManager);
    });

    // Setup getRepository mock to return appropriate repository
    mockDataSource.getRepository.mockReturnValue(candidateRepositoryMock);
  });


  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProjectDto: CreateProjectDto = {
      name: 'Test Project',
      jobDescription: 'Test job description',
      status: 'active',
    };

    const companyId = 'company-uuid-1';
    const userId = 'user-uuid-1';

    it('should create a project successfully', async () => {
      const mockPipeline = { id: 'pipeline-uuid-1', stages: [{ id: 'stage-1' }] };

      projectRepositoryMock.create.mockReturnValue(mockProject);
      projectRepositoryMock.save.mockResolvedValue(mockProject);
      mockPipelineService.createDefaultPipeline.mockResolvedValue(mockPipeline);

      const result = await service.create(createProjectDto, companyId, userId);

      expect(projectRepositoryMock.create).toHaveBeenCalledWith({
        ...createProjectDto,
        company_id: companyId,
        created_by: userId,
      });
      expect(projectRepositoryMock.save).toHaveBeenCalledWith(mockProject);
      expect(mockPipelineService.createDefaultPipeline).toHaveBeenCalledWith(mockProject.id);
      expect(result).toEqual(mockProject);
    });

    it('should create project even if pipeline creation fails', async () => {
      projectRepositoryMock.create.mockReturnValue(mockProject);
      projectRepositoryMock.save.mockResolvedValue(mockProject);
      mockPipelineService.createDefaultPipeline.mockRejectedValue(new Error('Pipeline error'));

      const result = await service.create(createProjectDto, companyId, userId);

      expect(result).toEqual(mockProject);
      expect(projectRepositoryMock.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all projects for a company', async () => {
      const companyId = 'company-uuid-1';
      const projects = [mockProject];

      projectRepositoryMock.find.mockResolvedValue(projects);

      const result = await service.findAll(companyId);

      expect(projectRepositoryMock.find).toHaveBeenCalledWith({
        where: { company_id: companyId },
        relations: ['candidates'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(projects);
    });
  });

  describe('findOne', () => {
    const projectId = 'project-uuid-1';
    const companyId = 'company-uuid-1';

    it('should return a project when found', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(mockProject);

      const result = await service.findOne(projectId, companyId);

      expect(projectRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: projectId, company_id: companyId },
        relations: [],
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOne(projectId, companyId)).rejects.toThrow(
        new NotFoundException(`Project with ID ${projectId} not found in your company`)
      );
    });

    it('should include relations when specified', async () => {
      const relations = ['candidates', 'analyses'];
      projectRepositoryMock.findOne.mockResolvedValue(mockProject);

      await service.findOne(projectId, companyId, relations);

      expect(projectRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: projectId, company_id: companyId },
        relations,
      });
    });
  });

  describe('findOneWithPaginatedRelations', () => {
    const projectId = 'project-uuid-1';
    const companyId = 'company-uuid-1';

    it('should return project with paginated candidates and analyses', async () => {
      const candidates = [{ id: 'candidate-1', projectId }];
      const analyses = [{ id: 'analysis-1', projectId }];

      projectRepositoryMock.findOne.mockResolvedValue(mockProject);
      candidateRepositoryMock.find.mockResolvedValue(candidates);
      analysisRepositoryMock.find.mockResolvedValue(analyses);

      const result = await service.findOneWithPaginatedRelations(projectId, companyId, 10);

      expect(projectRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: projectId, company_id: companyId },
      });
      expect(candidateRepositoryMock.find).toHaveBeenCalledWith({
        where: { projectId },
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(analysisRepositoryMock.find).toHaveBeenCalledWith({
        where: { projectId },
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({
        ...mockProject,
        candidates,
        analyses,
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOneWithPaginatedRelations(projectId, companyId)).rejects.toThrow(
        new NotFoundException(`Project with ID ${projectId} not found in your company`)
      );
    });

    it('should use default limit of 50 when not specified', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(mockProject);
      candidateRepositoryMock.find.mockResolvedValue([]);
      analysisRepositoryMock.find.mockResolvedValue([]);

      await service.findOneWithPaginatedRelations(projectId, companyId);

      expect(candidateRepositoryMock.find).toHaveBeenCalledWith({
        where: { projectId },
        take: 50,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('update', () => {
    const projectId = 'project-uuid-1';
    const companyId = 'company-uuid-1';
    const updateProjectDto: UpdateProjectDto = {
      name: 'Updated Project Name',
      status: 'inactive',
    };

    it('should update a project successfully', async () => {
      const updatedProject = { ...mockProject, ...updateProjectDto };

      projectRepositoryMock.findOne.mockResolvedValueOnce(mockProject); // findOne call
      projectRepositoryMock.update.mockResolvedValue({ affected: 1 });
      projectRepositoryMock.findOne.mockResolvedValueOnce(updatedProject); // second findOne call

      const result = await service.update(projectId, updateProjectDto, companyId);

      expect(projectRepositoryMock.update).toHaveBeenCalledWith(projectId, updateProjectDto);
      expect(result).toEqual(updatedProject);
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.update(projectId, updateProjectDto, companyId)).rejects.toThrow(
        new NotFoundException(`Project with ID ${projectId} not found in your company`)
      );
    });
  });

  describe('remove', () => {
    const projectId = 'project-uuid-1';
    const companyId = 'company-uuid-1';

    it('should delete a project and related data in transaction', async () => {
      const analysisCount = 5;
      const candidateCount = 10;

      mockTransactionManager.findOne.mockResolvedValue(mockProject);
      mockTransactionManager.count
        .mockResolvedValueOnce(analysisCount) // Analysis count
        .mockResolvedValueOnce(candidateCount); // Candidate count

      mockTransactionManager.delete
        .mockResolvedValueOnce({ affected: analysisCount }) // Delete analyses
        .mockResolvedValueOnce({ affected: candidateCount }) // Delete candidates
        .mockResolvedValueOnce({ affected: 1 }); // Delete project

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionManager);
      });

      await service.remove(projectId, companyId);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockTransactionManager.findOne).toHaveBeenCalledWith(Project, {
        where: { id: projectId, company_id: companyId },
        select: ['id', 'name'],
      });
      expect(mockTransactionManager.count).toHaveBeenCalledTimes(2);
      expect(mockTransactionManager.delete).toHaveBeenCalledTimes(3);
    });

    it('should throw NotFoundException when project not found in transaction', async () => {
      mockTransactionManager.findOne.mockResolvedValue(null);
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionManager);
      });

      await expect(service.remove(projectId, companyId)).rejects.toThrow(
        new NotFoundException(`Project with ID ${projectId} not found in your company`)
      );
    });
  });

  describe('getProjectStats', () => {
    const projectId = 'project-uuid-1';
    const companyId = 'company-uuid-1';

    it('should return project statistics', async () => {
      const mockTopCandidates = [
        { id: 'candidate-1', name: 'John Doe', score: 85, summary: 'Great candidate' },
        { id: 'candidate-2', name: 'Jane Smith', score: 80, summary: 'Good fit' },
      ];

      projectRepositoryMock.findOne.mockResolvedValue(mockProject);
      candidateRepositoryMock.count
        .mockResolvedValueOnce(15) // Total candidates
        .mockResolvedValueOnce(12); // Analyzed candidates

      // Mock the QueryBuilder for average score calculation
      candidateRepositoryMock.createQueryBuilder().getRawOne.mockResolvedValue({ avgScore: '75.5' });

      // Mock find for top candidates
      candidateRepositoryMock.find.mockResolvedValue(mockTopCandidates);

      const result = await service.getProjectStats(projectId, companyId);

      expect(result.totalCandidates).toBe(15);
      expect(result.analyzedCandidates).toBe(12);
      expect(result.pendingAnalysis).toBe(3);
      expect(result.averageScore).toBe(75.5);
      expect(result.topCandidates).toHaveLength(2);
      expect(projectRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: projectId, company_id: companyId },
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.getProjectStats(projectId, companyId)).rejects.toThrow(
        new NotFoundException(`Project with ID ${projectId} not found in your company`)
      );
    });
  });

  describe('generateShareLink', () => {
    const projectId = 'project-uuid-1';
    const companyId = 'company-uuid-1';

    it('should generate share link with default 30 days expiration', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(mockProject);
      projectRepositoryMock.update.mockResolvedValue({ affected: 1 });

      const result = await service.generateShareLink(projectId, companyId);

      expect(result.shareToken).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(projectRepositoryMock.update).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({
          public_share_token: expect.any(String),
          public_share_expires_at: expect.any(Date),
        })
      );
    });

    it('should generate share link with custom expiration days', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(mockProject);
      projectRepositoryMock.update.mockResolvedValue({ affected: 1 });

      const result = await service.generateShareLink(projectId, companyId, 7);

      expect(result.shareToken).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.generateShareLink(projectId, companyId)).rejects.toThrow(
        new NotFoundException(`Project with ID ${projectId} not found in your company`)
      );
    });
  });

  describe('getSharedProject', () => {
    const shareToken = 'valid-share-token';

    it('should return shared project when token is valid and not expired', async () => {
      const sharedProject = {
        ...mockProject,
        public_share_token: shareToken,
        public_share_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        is_public_shared: true,
      };

      projectRepositoryMock.findOne.mockResolvedValue(sharedProject);

      const result = await service.getSharedProject(shareToken);

      expect(result).toEqual(sharedProject);
      expect(projectRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          public_share_token: shareToken,
          is_public_shared: true,
        },
        relations: ['candidates', 'analyses', 'company'],
      });
    });

    it('should throw NotFoundException when token is expired', async () => {
      const expiredProject = {
        ...mockProject,
        public_share_token: shareToken,
        public_share_expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        is_public_shared: true,
      };

      projectRepositoryMock.findOne.mockResolvedValue(expiredProject);

      await expect(service.getSharedProject(shareToken)).rejects.toThrow(
        new NotFoundException('Lien de partage expiré')
      );
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.getSharedProject(shareToken)).rejects.toThrow(
        new NotFoundException('Lien de partage invalide ou expiré')
      );
    });
  });

  describe('getSharedProjectCandidates', () => {
    const shareToken = 'valid-share-token';

    it('should return paginated candidates for shared project', async () => {
      const sharedProject = {
        ...mockProject,
        public_share_token: shareToken,
        public_share_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        is_public_shared: true,
      };
      const mockCandidates = [
        { id: 'candidate-1', name: 'John Doe', score: 85 },
        { id: 'candidate-2', name: 'Jane Smith', score: 78 },
      ];

      projectRepositoryMock.findOne.mockResolvedValue(sharedProject);

      // Create a fresh QueryBuilder mock for this test
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCandidates, 2]),
      };

      // Create a fresh Repository mock that returns our QueryBuilder
      const mockCandidateRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };

      // Configure dataSource.getRepository to return our mock for this test
      mockDataSource.getRepository.mockReturnValue(mockCandidateRepo);

      const result = await service.getSharedProjectCandidates(shareToken, 1, 20);

      expect(result.data).toEqual(mockCandidates);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      // Verify that QueryBuilder methods were called correctly
      expect(mockCandidateRepo.createQueryBuilder).toHaveBeenCalledWith('candidate');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('candidate.analyses', 'analyses');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('candidate.projectId = :projectId', { projectId: sharedProject.id });
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
    });

    it('should apply filters when provided', async () => {
      const sharedProject = {
        ...mockProject,
        public_share_token: shareToken,
        public_share_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_public_shared: true,
      };
      const filters = { search: 'John', status: 'analyzed' };

      projectRepositoryMock.findOne.mockResolvedValue(sharedProject);

      // Create QueryBuilder mock for filters test
      const mockQueryBuilderWithFilters = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      const mockCandidateRepoWithFilters = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilderWithFilters),
      };

      mockDataSource.getRepository.mockReturnValue(mockCandidateRepoWithFilters);

      const result = await service.getSharedProjectCandidates(shareToken, 1, 20, filters);

      // Verify QueryBuilder was called with filters
      expect(mockQueryBuilderWithFilters.andWhere).toHaveBeenCalledWith(
        '(LOWER(candidate.name) LIKE :search OR LOWER(candidate.email) LIKE :search OR LOWER(candidate.summary) LIKE :search OR LOWER(candidate.extractedText) LIKE :search)',
        { search: '%john%' }
      );
      expect(mockQueryBuilderWithFilters.andWhere).toHaveBeenCalledWith('candidate.status = :status', { status: 'analyzed' });
    });

    it('should throw NotFoundException when project not found or expired', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.getSharedProjectCandidates(shareToken)).rejects.toThrow(
        new NotFoundException('Lien de partage invalide ou expiré')
      );
    });
  });

  describe('revokeShare', () => {
    const projectId = 'project-uuid-1';
    const companyId = 'company-uuid-1';

    it('should revoke share link successfully', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(mockProject);
      projectRepositoryMock.update.mockResolvedValue({ affected: 1 });

      await service.revokeShare(projectId, companyId);

      expect(projectRepositoryMock.update).toHaveBeenCalledWith(projectId, {
        public_share_token: null,
        public_share_expires_at: null,
        is_public_shared: false,
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.revokeShare(projectId, companyId)).rejects.toThrow(
        new NotFoundException(`Project with ID ${projectId} not found in your company`)
      );
    });
  });

  describe('getActiveJobOffers', () => {
    it('should return active job offers for company', async () => {
      const companyId = 'company-uuid-1';
      const activeProjects = [mockProject];

      // Mock QueryBuilder for getActiveJobOffers
      const mockActiveJobOffersQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(activeProjects),
      };

      projectRepositoryMock.createQueryBuilder.mockReturnValue(mockActiveJobOffersQueryBuilder);

      const result = await service.getActiveJobOffers(companyId);

      expect(result).toEqual(activeProjects);
      expect(projectRepositoryMock.createQueryBuilder).toHaveBeenCalledWith('project');
      expect(mockActiveJobOffersQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should return all active job offers when no company specified', async () => {
      const activeProjects = [mockProject];

      // Mock QueryBuilder for getActiveJobOffers without company
      const mockAllActiveJobOffersQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(activeProjects),
      };

      projectRepositoryMock.createQueryBuilder.mockReturnValue(mockAllActiveJobOffersQueryBuilder);

      const result = await service.getActiveJobOffers();

      expect(result).toEqual(activeProjects);
      expect(projectRepositoryMock.createQueryBuilder).toHaveBeenCalledWith('project');
      expect(mockAllActiveJobOffersQueryBuilder.getMany).toHaveBeenCalled();
    });
  });

  describe('getJobOffer', () => {
    const projectId = 'project-uuid-1';

    it('should return job offer when found', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(mockProject);

      const result = await service.getJobOffer(projectId);

      expect(result).toEqual(mockProject);
      expect(projectRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: projectId, status: 'active' },
        relations: ['company'],
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when job offer not found', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.getJobOffer(projectId)).rejects.toThrow(
        new NotFoundException('Offre d\'emploi non trouvée ou inactive')
      );
    });
  });

  describe('uploadOfferDocument', () => {
    const projectId = 'project-uuid-1';
    const companyId = 'company-uuid-1';
    const mockFile = {
      originalname: 'job-description.pdf',
      buffer: Buffer.from('file content'),
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    it('should upload offer document successfully', async () => {
      const fileUrl = 'https://storage.example.com/job-description.pdf';
      const updatedProject = { ...mockProject, offerDocumentUrl: fileUrl };

      projectRepositoryMock.findOne
        .mockResolvedValueOnce(mockProject) // First call in uploadOfferDocument
        .mockResolvedValueOnce(updatedProject); // Second call at the end
      mockStorageService.uploadOfferDocument.mockResolvedValue(fileUrl);
      projectRepositoryMock.update.mockResolvedValue({ affected: 1 });

      const result = await service.uploadOfferDocument(projectId, companyId, mockFile);

      expect(result.offerDocumentUrl).toBe(fileUrl);
      expect(mockStorageService.uploadOfferDocument).toHaveBeenCalledWith(
        mockFile.buffer,
        mockFile.originalname
      );
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.uploadOfferDocument(projectId, companyId, mockFile)).rejects.toThrow(
        new NotFoundException(`Project with ID ${projectId} not found in your company`)
      );
    });
  });

  describe('uploadOfferImage', () => {
    const projectId = 'project-uuid-1';
    const companyId = 'company-uuid-1';
    const mockFile = {
      originalname: 'company-logo.png',
      buffer: Buffer.from('image content'),
      mimetype: 'image/png',
    } as Express.Multer.File;

    it('should upload offer image successfully', async () => {
      const imageUrl = 'https://storage.example.com/company-logo.png';
      const updatedProject = { ...mockProject, offerImageUrl: imageUrl };

      projectRepositoryMock.findOne
        .mockResolvedValueOnce(mockProject) // First call in uploadOfferImage
        .mockResolvedValueOnce(updatedProject); // Second call at the end
      mockStorageService.uploadOfferImage.mockResolvedValue(imageUrl);
      projectRepositoryMock.update.mockResolvedValue({ affected: 1 });

      const result = await service.uploadOfferImage(projectId, companyId, mockFile);

      expect(result.offerImageUrl).toBe(imageUrl);
      expect(mockStorageService.uploadOfferImage).toHaveBeenCalledWith(
        mockFile.buffer,
        mockFile.originalname
      );
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.uploadOfferImage(projectId, companyId, mockFile)).rejects.toThrow(
        new NotFoundException(`Project with ID ${projectId} not found in your company`)
      );
    });
  });

  describe('applyToJobOffer', () => {
    const projectId = 'project-uuid-1';
    const mockFile = {
      originalname: 'john-doe-cv.pdf',
      buffer: Buffer.from('cv content'),
      mimetype: 'application/pdf',
    } as Express.Multer.File;
    const applicationData = {
      email: 'john.doe@example.com',
      phone: '+33123456789',
      message: 'I am interested in this position',
    };

    it('should apply to job offer successfully', async () => {
      const mockCandidate = {
        id: 'candidate-uuid-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      projectRepositoryMock.findOne.mockResolvedValue(mockProject);
      mockTransactionManager.findOne.mockResolvedValue(null); // No existing candidate
      mockTransactionManager.create.mockReturnValue(mockCandidate);
      mockTransactionManager.save.mockResolvedValue(mockCandidate);
      mockStorageService.uploadFile.mockResolvedValue('https://storage.example.com/cv.pdf');
      mockAnalysisQueueService.addToQueue.mockResolvedValue(undefined);

      const result = await service.applyToJobOffer(projectId, mockFile, applicationData);

      expect(result.success).toBe(true);
      expect(result.candidateId).toBe(mockCandidate.id);
      expect(result.message).toContain('Votre candidature a été reçue avec succès');
      expect(mockTransactionManager.save).toHaveBeenCalled();
      expect(mockAnalysisQueueService.addToQueue).toHaveBeenCalled();
    });


    it('should handle file name extraction correctly', async () => {
      const fileWithoutExtension = {
        ...mockFile,
        originalname: 'jane_smith_resume',
      };
      const mockCandidate = {
        id: 'candidate-uuid-2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      };

      projectRepositoryMock.findOne.mockResolvedValue(mockProject);
      mockTransactionManager.findOne.mockResolvedValue(null);
      mockTransactionManager.create.mockReturnValue(mockCandidate);
      mockTransactionManager.save.mockResolvedValue(mockCandidate);
      mockStorageService.uploadFile.mockResolvedValue('https://storage.example.com/cv.pdf');
      mockAnalysisQueueService.addToQueue.mockResolvedValue(undefined);

      const result = await service.applyToJobOffer(projectId, fileWithoutExtension, applicationData);

      expect(result.success).toBe(true);
      expect(mockTransactionManager.create).toHaveBeenCalledWith(
        expect.any(Function), // This is the Candidate entity class
        expect.objectContaining({
          name: 'jane smith', // Lowercase as extracted from filename
        })
      );
    });

    it('should throw NotFoundException when job offer not found', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.applyToJobOffer(projectId, mockFile, applicationData)).rejects.toThrow(
        new NotFoundException('Offre d\'emploi non trouvée ou inactive')
      );
    });

    it('should handle storage upload errors', async () => {
      projectRepositoryMock.findOne.mockResolvedValue(mockProject);
      mockTransactionManager.findOne.mockResolvedValue(null);
      mockStorageService.uploadFile.mockRejectedValue(new Error('Storage error'));

      await expect(service.applyToJobOffer(projectId, mockFile, applicationData)).rejects.toThrow(
        'Failed to upload CV file'
      );
    });
  });
});