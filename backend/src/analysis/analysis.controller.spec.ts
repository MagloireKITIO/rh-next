import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyGuard } from '../auth/guards/company.guard';
import { NotFoundException } from '@nestjs/common';

describe('AnalysisController', () => {
  let controller: AnalysisController;
  let analysisService: AnalysisService;

  const mockAnalysisService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByProject: jest.fn(),
    findOne: jest.fn(),
    generateProjectReport: jest.fn(),
    remove: jest.fn(),
  };

  const mockGuards = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockCompanyId = 'company-uuid-1';
  const mockProjectId = 'project-uuid-1';
  const mockAnalysisId = 'analysis-uuid-1';

  const mockAnalysis = {
    id: mockAnalysisId,
    aiResponse: 'Detailed AI analysis of the candidate',
    analysisData: { skills: ['JavaScript', 'TypeScript'], experience: '5 years' },
    score: 85,
    summary: 'Strong technical candidate with good experience',
    strengths: ['Technical expertise', 'Problem-solving skills'],
    weaknesses: ['Limited leadership experience'],
    recommendations: ['Consider for senior developer role'],
    hrDecision: {
      recommendation: 'RECRUTER' as const,
      confidence: 0.9,
      reasoning: 'Excellent technical skills match requirements',
      priority: 'HIGH' as const,
    },
    skillsMatch: {
      technical: 90,
      experience: 85,
      cultural: 75,
      overall: 83,
    },
    risks: ['May require higher salary'],
    projectId: mockProjectId,
    candidateId: 'candidate-uuid-1',
    createdAt: new Date(),
  };

  const mockProjectReport = {
    project: {
      id: mockProjectId,
      name: 'Senior Developer Position',
      jobDescription: 'Looking for senior developer',
      createdAt: new Date(),
    },
    statistics: {
      totalCandidates: 15,
      analyzedCandidates: 12,
      pendingAnalysis: 3,
      averageScore: 73.5,
      scoreDistribution: {
        excellent: 3,
        good: 5,
        average: 3,
        poor: 1,
      },
    },
    topCandidates: [
      { id: 'candidate-1', name: 'John Doe', score: 95 },
      { id: 'candidate-2', name: 'Jane Smith', score: 88 },
    ],
    skillsAnalysis: [
      { skill: 'javascript', count: 10, percentage: 83.3 },
      { skill: 'react', count: 8, percentage: 66.7 },
    ],
    recommendations: [
      'Consider prioritizing candidates with scores above 80',
      'Focus on JavaScript and React expertise',
    ],
    analysisDetails: [mockAnalysis],
    generatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        {
          provide: AnalysisService,
          useValue: mockAnalysisService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuards)
      .overrideGuard(CompanyGuard)
      .useValue(mockGuards)
      .compile();

    controller = module.get<AnalysisController>(AnalysisController);
    analysisService = module.get<AnalysisService>(AnalysisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createAnalysisDto: CreateAnalysisDto = {
      aiResponse: 'AI analysis response',
      analysisData: { skills: ['JavaScript', 'Python'], experience: '3 years' },
      score: 78,
      summary: 'Good candidate with potential',
      strengths: ['Quick learner', 'Technical aptitude'],
      weaknesses: ['Limited commercial experience'],
      recommendations: ['Consider for junior-mid level role'],
      hrDecision: {
        recommendation: 'ENTRETIEN',
        confidence: 0.7,
        reasoning: 'Good potential but needs assessment',
        priority: 'MEDIUM',
      },
      skillsMatch: {
        technical: 75,
        experience: 60,
        cultural: 80,
        overall: 72,
      },
      risks: ['May need extensive onboarding'],
      projectId: mockProjectId,
      candidateId: 'candidate-uuid-2',
    };

    it('should create a new analysis', async () => {
      mockAnalysisService.create.mockResolvedValue(mockAnalysis);

      const result = await controller.create(createAnalysisDto);

      expect(mockAnalysisService.create).toHaveBeenCalledWith(createAnalysisDto);
      expect(result).toEqual(mockAnalysis);
    });

    it('should handle creation errors', async () => {
      const error = new Error('Analysis creation failed');
      mockAnalysisService.create.mockRejectedValue(error);

      await expect(controller.create(createAnalysisDto)).rejects.toThrow('Analysis creation failed');
    });
  });

  describe('findAll', () => {
    it('should return all analyses when no projectId provided', async () => {
      const analyses = [mockAnalysis];
      mockAnalysisService.findAll.mockResolvedValue(analyses);

      const result = await controller.findAll(mockCompanyId);

      expect(mockAnalysisService.findAll).toHaveBeenCalled();
      expect(mockAnalysisService.findByProject).not.toHaveBeenCalled();
      expect(result).toEqual(analyses);
    });

    it('should return analyses for specific project when projectId provided', async () => {
      const projectAnalyses = [mockAnalysis];
      mockAnalysisService.findByProject.mockResolvedValue(projectAnalyses);

      const result = await controller.findAll(mockCompanyId, mockProjectId);

      expect(mockAnalysisService.findByProject).toHaveBeenCalledWith(mockProjectId, mockCompanyId);
      expect(mockAnalysisService.findAll).not.toHaveBeenCalled();
      expect(result).toEqual(projectAnalyses);
    });

    it('should return empty array when no analyses found', async () => {
      mockAnalysisService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockCompanyId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return specific analysis', async () => {
      mockAnalysisService.findOne.mockResolvedValue(mockAnalysis);

      const result = await controller.findOne(mockAnalysisId, mockCompanyId);

      expect(mockAnalysisService.findOne).toHaveBeenCalledWith(mockAnalysisId, mockCompanyId);
      expect(result).toEqual(mockAnalysis);
    });

    it('should handle analysis not found', async () => {
      const error = new NotFoundException(`Analysis with ID ${mockAnalysisId} not found in your company`);
      mockAnalysisService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(mockAnalysisId, mockCompanyId)).rejects.toThrow(NotFoundException);
      expect(mockAnalysisService.findOne).toHaveBeenCalledWith(mockAnalysisId, mockCompanyId);
    });
  });

  describe('generateProjectReport', () => {
    it('should generate comprehensive project report', async () => {
      mockAnalysisService.generateProjectReport.mockResolvedValue(mockProjectReport);

      const result = await controller.generateProjectReport(mockProjectId, mockCompanyId);

      expect(mockAnalysisService.generateProjectReport).toHaveBeenCalledWith(mockProjectId, mockCompanyId);
      expect(result).toEqual(mockProjectReport);
    });

    it('should validate report structure', async () => {
      mockAnalysisService.generateProjectReport.mockResolvedValue(mockProjectReport);

      const result = await controller.generateProjectReport(mockProjectId, mockCompanyId);

      expect(result).toMatchObject({
        project: expect.objectContaining({
          id: mockProjectId,
          name: expect.any(String),
        }),
        statistics: expect.objectContaining({
          totalCandidates: expect.any(Number),
          analyzedCandidates: expect.any(Number),
          averageScore: expect.any(Number),
          scoreDistribution: expect.objectContaining({
            excellent: expect.any(Number),
            good: expect.any(Number),
            average: expect.any(Number),
            poor: expect.any(Number),
          }),
        }),
        topCandidates: expect.any(Array),
        skillsAnalysis: expect.any(Array),
        recommendations: expect.any(Array),
        analysisDetails: expect.any(Array),
        generatedAt: expect.any(Date),
      });
    });

    it('should handle project not found error', async () => {
      const error = new NotFoundException(`Project with ID ${mockProjectId} not found in your company`);
      mockAnalysisService.generateProjectReport.mockRejectedValue(error);

      await expect(controller.generateProjectReport(mockProjectId, mockCompanyId)).rejects.toThrow(NotFoundException);
    });

    it('should handle report generation with empty data', async () => {
      const emptyReport = {
        ...mockProjectReport,
        statistics: {
          totalCandidates: 0,
          analyzedCandidates: 0,
          pendingAnalysis: 0,
          averageScore: 0,
          scoreDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
        },
        topCandidates: [],
        skillsAnalysis: [],
        analysisDetails: [],
      };
      mockAnalysisService.generateProjectReport.mockResolvedValue(emptyReport);

      const result = await controller.generateProjectReport(mockProjectId, mockCompanyId);

      expect(result.statistics.totalCandidates).toBe(0);
      expect(result.topCandidates).toEqual([]);
      expect(result.analysisDetails).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should delete analysis successfully', async () => {
      mockAnalysisService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockAnalysisId);

      expect(mockAnalysisService.remove).toHaveBeenCalledWith(mockAnalysisId);
      expect(result).toBeUndefined();
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Deletion failed');
      mockAnalysisService.remove.mockRejectedValue(error);

      await expect(controller.remove(mockAnalysisId)).rejects.toThrow('Deletion failed');
    });

    it('should handle analysis not found during deletion', async () => {
      const error = new NotFoundException('Analysis not found');
      mockAnalysisService.remove.mockRejectedValue(error);

      await expect(controller.remove(mockAnalysisId)).rejects.toThrow(NotFoundException);
    });
  });
});