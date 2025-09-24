import { Test, TestingModule } from '@nestjs/testing';
import { PipelineController } from './pipeline.controller';
import { PipelineService } from './pipeline.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePipelineDto, UpdatePipelineDto, MoveCandidateDto } from './dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PipelineController', () => {
  let controller: PipelineController;
  let pipelineService: PipelineService;

  const mockPipeline = {
    id: 'pipeline-uuid-1',
    name: 'Pipeline de Recrutement',
    description: 'Pipeline par défaut',
    projectId: 'project-uuid-1',
    isActive: true,
    stages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPipelineWithCandidates = {
    ...mockPipeline,
    stages: [
      {
        id: 'stage-uuid-1',
        name: 'Candidature',
        candidates: [
          {
            id: 'candidate-uuid-1',
            name: 'John Doe',
            email: 'john@example.com',
          },
        ],
      },
    ],
  };

  const mockPipelineStats = {
    pipeline: {
      id: 'pipeline-uuid-1',
      name: 'Pipeline de Recrutement',
    },
    stages: [
      {
        stageId: 'stage-uuid-1',
        stageName: 'Candidature',
        candidatesCount: 5,
        averageDays: 3,
      },
    ],
    conversionRates: [
      {
        fromStage: 'Candidature',
        toStage: 'Entretien',
        rate: 0.6,
      },
    ],
    totalCandidates: 10,
  };

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    company_id: 'company-uuid-1',
    role: 'admin',
  };

  const mockRequest = {
    user: mockUser,
  };

  const mockPipelineService = {
    create: jest.fn(),
    findByProject: jest.fn(),
    findOne: jest.fn(),
    getPipelineWithCandidates: jest.fn(),
    getPipelineStats: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addStage: jest.fn(),
    updateStage: jest.fn(),
    removeStage: jest.fn(),
    moveCandidate: jest.fn(),
    reorderStages: jest.fn(),
    getProjectTimeline: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PipelineController],
      providers: [
        {
          provide: PipelineService,
          useValue: mockPipelineService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PipelineController>(PipelineController);
    pipelineService = module.get<PipelineService>(PipelineService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createPipelineDto: CreatePipelineDto = {
      name: 'New Pipeline',
      description: 'Pipeline description',
    };

    it('should create a pipeline successfully', async () => {
      mockPipelineService.create.mockResolvedValue(mockPipeline);

      const result = await controller.create('project-uuid-1', createPipelineDto, mockRequest);

      expect(mockPipelineService.create).toHaveBeenCalledWith(
        createPipelineDto,
        'project-uuid-1',
        'company-uuid-1'
      );
      expect(result).toEqual(mockPipeline);
    });

    it('should handle creation errors', async () => {
      const error = new BadRequestException('Invalid pipeline data');
      mockPipelineService.create.mockRejectedValue(error);

      await expect(
        controller.create('project-uuid-1', createPipelineDto, mockRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByProject', () => {
    it('should return pipelines for a project', async () => {
      const pipelines = [mockPipeline];
      mockPipelineService.findByProject.mockResolvedValue(pipelines);

      const result = await controller.findByProject('project-uuid-1', mockRequest);

      expect(mockPipelineService.findByProject).toHaveBeenCalledWith(
        'project-uuid-1',
        'company-uuid-1'
      );
      expect(result).toEqual(pipelines);
    });

    it('should handle project not found', async () => {
      const error = new NotFoundException('Project not found');
      mockPipelineService.findByProject.mockRejectedValue(error);

      await expect(
        controller.findByProject('invalid-project-id', mockRequest)
      ).rejects.toThrow(NotFoundException);
    });

    it('should log the operation', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockPipelineService.findByProject.mockResolvedValue([mockPipeline]);

      await controller.findByProject('project-uuid-1', mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Getting pipelines for project: project-uuid-1')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found 1 pipeline(s) for project project-uuid-1')
      );

      consoleSpy.mockRestore();
    });

    it('should log errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Database error');
      mockPipelineService.findByProject.mockRejectedValue(error);

      await expect(
        controller.findByProject('project-uuid-1', mockRequest)
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error getting pipelines for project project-uuid-1:'),
        'Database error'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('findOne', () => {
    it('should return a pipeline by id', async () => {
      mockPipelineService.findOne.mockResolvedValue(mockPipeline);

      const result = await controller.findOne('pipeline-uuid-1', mockRequest);

      expect(mockPipelineService.findOne).toHaveBeenCalledWith(
        'pipeline-uuid-1',
        'company-uuid-1'
      );
      expect(result).toEqual(mockPipeline);
    });

    it('should handle pipeline not found', async () => {
      const error = new NotFoundException('Pipeline not found');
      mockPipelineService.findOne.mockRejectedValue(error);

      await expect(
        controller.findOne('invalid-pipeline-id', mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPipelineWithCandidates', () => {
    it('should return pipeline with candidates', async () => {
      mockPipelineService.getPipelineWithCandidates.mockResolvedValue(mockPipelineWithCandidates);

      const result = await controller.getPipelineWithCandidates('pipeline-uuid-1', mockRequest);

      expect(mockPipelineService.getPipelineWithCandidates).toHaveBeenCalledWith(
        'pipeline-uuid-1',
        'company-uuid-1'
      );
      expect(result).toEqual(mockPipelineWithCandidates);
    });

    it('should log the operation with stages count', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockPipelineService.getPipelineWithCandidates.mockResolvedValue(mockPipelineWithCandidates);

      await controller.getPipelineWithCandidates('pipeline-uuid-1', mockRequest);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Getting pipeline with candidates: pipeline-uuid-1')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Pipeline found with 1 stages')
      );

      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new NotFoundException('Pipeline not found');
      mockPipelineService.getPipelineWithCandidates.mockRejectedValue(error);

      await expect(
        controller.getPipelineWithCandidates('invalid-id', mockRequest)
      ).rejects.toThrow(NotFoundException);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error getting pipeline invalid-id:'),
        'Pipeline not found'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getPipelineStats', () => {
    it('should return pipeline statistics', async () => {
      mockPipelineService.getPipelineStats.mockResolvedValue(mockPipelineStats);

      const result = await controller.getPipelineStats('pipeline-uuid-1', mockRequest);

      expect(mockPipelineService.getPipelineStats).toHaveBeenCalledWith(
        'pipeline-uuid-1',
        'company-uuid-1'
      );
      expect(result).toEqual(mockPipelineStats);
    });

    it('should handle stats retrieval errors', async () => {
      const error = new NotFoundException('Pipeline not found');
      mockPipelineService.getPipelineStats.mockRejectedValue(error);

      await expect(
        controller.getPipelineStats('invalid-id', mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updatePipelineDto: UpdatePipelineDto = {
      name: 'Updated Pipeline',
      description: 'Updated description',
    };

    it('should update a pipeline successfully', async () => {
      const updatedPipeline = { ...mockPipeline, ...updatePipelineDto };
      mockPipelineService.update.mockResolvedValue(updatedPipeline);

      const result = await controller.update('pipeline-uuid-1', updatePipelineDto, mockRequest);

      expect(mockPipelineService.update).toHaveBeenCalledWith(
        'pipeline-uuid-1',
        updatePipelineDto,
        'company-uuid-1'
      );
      expect(result).toEqual(updatedPipeline);
    });

    it('should handle update errors', async () => {
      const error = new NotFoundException('Pipeline not found');
      mockPipelineService.update.mockRejectedValue(error);

      await expect(
        controller.update('invalid-id', updatePipelineDto, mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a pipeline successfully', async () => {
      mockPipelineService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove('pipeline-uuid-1', mockRequest);

      expect(mockPipelineService.remove).toHaveBeenCalledWith(
        'pipeline-uuid-1',
        'company-uuid-1'
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle deletion errors', async () => {
      const error = new NotFoundException('Pipeline not found');
      mockPipelineService.remove.mockRejectedValue(error);

      await expect(
        controller.remove('invalid-id', mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addStage', () => {
    const stageData = {
      name: 'New Stage',
      description: 'Stage description',
      color: '#ff5733',
    };

    it('should add a stage to pipeline successfully', async () => {
      const newStage = {
        id: 'stage-uuid-2',
        ...stageData,
        pipelineId: 'pipeline-uuid-1',
      };
      mockPipelineService.addStage.mockResolvedValue(newStage);

      const result = await controller.addStage('pipeline-uuid-1', stageData, mockRequest);

      expect(mockPipelineService.addStage).toHaveBeenCalledWith(
        'pipeline-uuid-1',
        stageData,
        'company-uuid-1'
      );
      expect(result).toEqual(newStage);
    });

    it('should handle stage addition errors', async () => {
      const error = new BadRequestException('Invalid stage data');
      mockPipelineService.addStage.mockRejectedValue(error);

      await expect(
        controller.addStage('pipeline-uuid-1', stageData, mockRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStage', () => {
    const stageUpdateData = {
      name: 'Updated Stage',
      color: '#33ff57',
    };

    it('should update a stage successfully', async () => {
      const updatedStage = {
        id: 'stage-uuid-1',
        ...stageUpdateData,
        pipelineId: 'pipeline-uuid-1',
      };
      mockPipelineService.updateStage.mockResolvedValue(updatedStage);

      const result = await controller.updateStage('stage-uuid-1', stageUpdateData, mockRequest);

      expect(mockPipelineService.updateStage).toHaveBeenCalledWith(
        'stage-uuid-1',
        stageUpdateData,
        'company-uuid-1'
      );
      expect(result).toEqual(updatedStage);
    });

    it('should handle stage update errors', async () => {
      const error = new NotFoundException('Stage not found');
      mockPipelineService.updateStage.mockRejectedValue(error);

      await expect(
        controller.updateStage('invalid-stage-id', stageUpdateData, mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeStage', () => {
    it('should remove a stage successfully', async () => {
      mockPipelineService.removeStage.mockResolvedValue({ success: true });

      const result = await controller.removeStage('stage-uuid-1', mockRequest);

      expect(mockPipelineService.removeStage).toHaveBeenCalledWith(
        'stage-uuid-1',
        'company-uuid-1'
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle stage removal errors', async () => {
      const error = new BadRequestException('Cannot remove stage with candidates');
      mockPipelineService.removeStage.mockRejectedValue(error);

      await expect(
        controller.removeStage('stage-uuid-1', mockRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('moveCandidate', () => {
    const moveCandidateDto: MoveCandidateDto = {
      candidateId: 'candidate-uuid-1',
      stageId: 'stage-uuid-2',
      notes: 'Moved to next stage',
    };

    it('should move candidate successfully', async () => {
      const candidateStatus = {
        id: 'status-uuid-1',
        candidateId: 'candidate-uuid-1',
        currentStageId: 'stage-uuid-2',
        movedAt: new Date(),
      };
      mockPipelineService.moveCandidate.mockResolvedValue(candidateStatus);

      const result = await controller.moveCandidate(moveCandidateDto, mockRequest);

      expect(mockPipelineService.moveCandidate).toHaveBeenCalledWith(
        moveCandidateDto,
        'company-uuid-1',
        'user-uuid-1'
      );
      expect(result).toEqual(candidateStatus);
    });

    it('should handle candidate movement errors', async () => {
      const error = new BadRequestException('Invalid stage or candidate');
      mockPipelineService.moveCandidate.mockRejectedValue(error);

      await expect(
        controller.moveCandidate(moveCandidateDto, mockRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reorderStages', () => {
    const stageOrders = [
      { stageId: 'stage-uuid-1', order: 2 },
      { stageId: 'stage-uuid-2', order: 1 },
    ];

    it('should reorder stages successfully', async () => {
      const reorderedStages = [
        { id: 'stage-uuid-2', order: 1 },
        { id: 'stage-uuid-1', order: 2 },
      ];
      mockPipelineService.reorderStages.mockResolvedValue(reorderedStages);

      const result = await controller.reorderStages('pipeline-uuid-1', stageOrders, mockRequest);

      expect(mockPipelineService.reorderStages).toHaveBeenCalledWith(
        'pipeline-uuid-1',
        stageOrders,
        'company-uuid-1'
      );
      expect(result).toEqual(reorderedStages);
    });

    it('should handle reordering errors', async () => {
      const error = new BadRequestException('Invalid stage order');
      mockPipelineService.reorderStages.mockRejectedValue(error);

      await expect(
        controller.reorderStages('pipeline-uuid-1', stageOrders, mockRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getProjectTimeline', () => {
    it('should return project timeline', async () => {
      const timeline = {
        events: [
          {
            id: 'event-1',
            type: 'candidate_movement',
            candidateName: 'John Doe',
            fromStage: 'Candidature',
            toStage: 'Entretien',
            createdAt: new Date(),
          },
        ],
        total: 1,
        hasMore: false,
      };
      mockPipelineService.getProjectTimeline.mockResolvedValue(timeline);

      const result = await controller.getProjectTimeline('project-uuid-1', mockRequest);

      expect(mockPipelineService.getProjectTimeline).toHaveBeenCalledWith(
        'project-uuid-1',
        'company-uuid-1'
      );
      expect(result).toEqual(timeline);
    });

    it('should handle timeline retrieval errors', async () => {
      const error = new NotFoundException('Project not found');
      mockPipelineService.getProjectTimeline.mockRejectedValue(error);

      await expect(
        controller.getProjectTimeline('invalid-project-id', mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });
});