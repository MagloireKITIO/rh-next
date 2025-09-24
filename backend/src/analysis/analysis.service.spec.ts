import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisService } from './analysis.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Analysis } from './entities/analysis.entity';
import { Project } from '../projects/entities/project.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { NotFoundException } from '@nestjs/common';

describe('AnalysisService', () => {
  let service: AnalysisService;
  let analysisRepository: Repository<Analysis>;
  let projectRepository: Repository<Project>;
  let candidateRepository: Repository<Candidate>;

  const mockAnalysis = {
    id: 'analysis-uuid-1',
    aiResponse: 'AI analysis response for candidate',
    analysisData: { skills: ['JavaScript', 'TypeScript'], experience: '5 years' },
    score: 85,
    summary: 'Strong technical candidate with good experience',
    strengths: ['Technical skills', 'Problem solving'],
    weaknesses: ['Communication could be improved'],
    recommendations: ['Good fit for senior role'],
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
    risks: ['May leave for better offer'],
    projectId: 'project-uuid-1',
    candidateId: 'candidate-uuid-1',
    createdAt: new Date(),
  };

  const mockProject = {
    id: 'project-uuid-1',
    name: 'Senior Developer Position',
    jobDescription: 'Looking for senior developer',
    company_id: 'company-uuid-1',
    createdAt: new Date(),
    candidates: [],
    analyses: [],
  };

  const mockCandidate = {
    id: 'candidate-uuid-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    score: 85,
    summary: 'Experienced developer',
    ranking: 1,
    status: 'analyzed',
    extractedData: {
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      experience: '5 years',
      seniority: 'SENIOR' as const,
    },
  };

  const mockAnalysisRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockProjectRepository = {
    findOne: jest.fn(),
  };

  const mockCandidateRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        {
          provide: getRepositoryToken(Analysis),
          useValue: mockAnalysisRepository,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: getRepositoryToken(Candidate),
          useValue: mockCandidateRepository,
        },
      ],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);
    analysisRepository = module.get<Repository<Analysis>>(getRepositoryToken(Analysis));
    projectRepository = module.get<Repository<Project>>(getRepositoryToken(Project));
    candidateRepository = module.get<Repository<Candidate>>(getRepositoryToken(Candidate));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createAnalysisDto: CreateAnalysisDto = {
      aiResponse: 'AI analysis response',
      analysisData: { skills: ['JavaScript'] },
      score: 85,
      summary: 'Good candidate',
      strengths: ['Technical skills'],
      weaknesses: ['Experience'],
      recommendations: ['Consider for interview'],
      hrDecision: {
        recommendation: 'ENTRETIEN',
        confidence: 0.8,
        reasoning: 'Good technical fit',
        priority: 'MEDIUM',
      },
      skillsMatch: {
        technical: 85,
        experience: 70,
        cultural: 80,
        overall: 78,
      },
      risks: ['May need training'],
      projectId: 'project-uuid-1',
      candidateId: 'candidate-uuid-1',
    };

    it('should create an analysis successfully', async () => {
      mockAnalysisRepository.create.mockReturnValue(mockAnalysis);
      mockAnalysisRepository.save.mockResolvedValue(mockAnalysis);

      const result = await service.create(createAnalysisDto);

      expect(mockAnalysisRepository.create).toHaveBeenCalledWith(createAnalysisDto);
      expect(mockAnalysisRepository.save).toHaveBeenCalledWith(mockAnalysis);
      expect(result).toEqual(mockAnalysis);
    });

    it('should handle repository errors during creation', async () => {
      const error = new Error('Database error');
      mockAnalysisRepository.create.mockReturnValue(mockAnalysis);
      mockAnalysisRepository.save.mockRejectedValue(error);

      await expect(service.create(createAnalysisDto)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all analyses with relations', async () => {
      const analyses = [mockAnalysis];
      mockAnalysisRepository.find.mockResolvedValue(analyses);

      const result = await service.findAll();

      expect(mockAnalysisRepository.find).toHaveBeenCalledWith({
        relations: ['project', 'candidate'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(analyses);
    });

    it('should return empty array when no analyses found', async () => {
      mockAnalysisRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByProject', () => {
    const projectId = 'project-uuid-1';
    const companyId = 'company-uuid-1';

    it('should return analyses for a specific project', async () => {
      const analyses = [mockAnalysis];
      mockAnalysisRepository.find.mockResolvedValue(analyses);

      const result = await service.findByProject(projectId, companyId);

      expect(mockAnalysisRepository.find).toHaveBeenCalledWith({
        where: { projectId, project: { company_id: companyId } },
        relations: ['candidate'],
        order: { score: 'DESC' },
      });
      expect(result).toEqual(analyses);
    });

    it('should return empty array when no analyses found for project', async () => {
      mockAnalysisRepository.find.mockResolvedValue([]);

      const result = await service.findByProject(projectId, companyId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const analysisId = 'analysis-uuid-1';
    const companyId = 'company-uuid-1';

    it('should return analysis when found', async () => {
      mockAnalysisRepository.findOne.mockResolvedValue(mockAnalysis);

      const result = await service.findOne(analysisId, companyId);

      expect(mockAnalysisRepository.findOne).toHaveBeenCalledWith({
        where: { id: analysisId, project: { company_id: companyId } },
        relations: ['project', 'candidate'],
      });
      expect(result).toEqual(mockAnalysis);
    });

    it('should throw NotFoundException when analysis not found', async () => {
      mockAnalysisRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(analysisId, companyId)).rejects.toThrow(
        new NotFoundException(`Analysis with ID ${analysisId} not found in your company`)
      );
    });
  });

  describe('generateProjectReport', () => {
    const projectId = 'project-uuid-1';
    const companyId = 'company-uuid-1';

    const mockProjectWithData = {
      ...mockProject,
      candidates: [
        { ...mockCandidate, score: 85, status: 'analyzed' },
        { ...mockCandidate, id: 'candidate-2', score: 70, status: 'analyzed' },
        { ...mockCandidate, id: 'candidate-3', score: 45, status: 'analyzed' },
        { ...mockCandidate, id: 'candidate-4', score: 30, status: 'pending' },
      ],
      analyses: [mockAnalysis],
    };

    it('should generate comprehensive project report', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProjectWithData);

      const result = await service.generateProjectReport(projectId, companyId);

      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId, company_id: companyId },
        relations: ['candidates', 'analyses'],
      });

      expect(result).toMatchObject({
        project: {
          id: projectId,
          name: mockProject.name,
          jobDescription: mockProject.jobDescription,
          createdAt: mockProject.createdAt,
        },
        statistics: {
          totalCandidates: 4,
          analyzedCandidates: 3,
          pendingAnalysis: 1,
          averageScore: 57.5, // (85 + 70 + 45 + 30) / 4
          scoreDistribution: {
            excellent: 1, // >= 80
            good: 1, // 60-79
            average: 1, // 40-59
            poor: 1, // < 40
          },
        },
        topCandidates: expect.arrayContaining([
          expect.objectContaining({
            score: 85,
            name: 'John Doe',
          }),
        ]),
        skillsAnalysis: expect.any(Object),
        recommendations: expect.any(Array),
        analysisDetails: expect.arrayContaining([
          expect.objectContaining({
            id: mockAnalysis.id,
            score: mockAnalysis.score,
          }),
        ]),
        generatedAt: expect.any(Date),
      });
    });

    it('should handle project with no candidates', async () => {
      const emptyProject = {
        ...mockProject,
        candidates: [],
        analyses: [],
      };
      mockProjectRepository.findOne.mockResolvedValue(emptyProject);

      const result = await service.generateProjectReport(projectId, companyId);

      expect(result.statistics).toMatchObject({
        totalCandidates: 0,
        analyzedCandidates: 0,
        pendingAnalysis: 0,
        averageScore: 0,
        scoreDistribution: {
          excellent: 0,
          good: 0,
          average: 0,
          poor: 0,
        },
      });
      expect(result.topCandidates).toEqual([]);
    });

    it('should throw NotFoundException when project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.generateProjectReport(projectId, companyId)).rejects.toThrow(
        new NotFoundException(`Project with ID ${projectId} not found in your company`)
      );
    });
  });

  describe('analyzeSkillsFromCandidates', () => {
    it('should analyze skills from candidates with extractedData', () => {
      const candidates = [
        {
          ...mockCandidate,
          extractedData: { skills: ['JavaScript', 'TypeScript', 'React'] },
        },
        {
          ...mockCandidate,
          id: 'candidate-2',
          extractedData: { skills: ['JavaScript', 'Python', 'React'] },
        },
        {
          ...mockCandidate,
          id: 'candidate-3',
          extractedData: { skills: ['Java', 'Spring'] },
        },
      ] as Candidate[];

      const result = service['analyzeSkillsFromCandidates'](candidates);

      expect(result).toEqual({
        mostCommonSkills: expect.arrayContaining([
          expect.objectContaining({
            skill: 'javascript',
            count: 2,
            percentage: expect.any(Number),
          }),
          expect.objectContaining({
            skill: 'react',
            count: 2,
            percentage: expect.any(Number),
          }),
        ]),
        totalUniqueSkills: expect.any(Number),
      });
    });

    it('should handle candidates without skills data', () => {
      const candidates = [
        { ...mockCandidate, extractedData: null },
        { ...mockCandidate, id: 'candidate-2', extractedData: {} },
      ] as Candidate[];

      const result = service['analyzeSkillsFromCandidates'](candidates);

      expect(result).toEqual({
        mostCommonSkills: [],
        totalUniqueSkills: 0,
      });
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations based on candidate data', () => {
      const candidates = [
        { ...mockCandidate, score: 85, status: 'analyzed' },
        { ...mockCandidate, id: 'candidate-2', score: 70, status: 'analyzed' },
        { ...mockCandidate, id: 'candidate-3', score: 30, status: 'pending' },
      ] as Candidate[];

      const result = service['generateRecommendations'](candidates, 61.67);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            title: expect.any(String),
            description: expect.stringContaining('candidat'),
          }),
        ])
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty candidates array', () => {
      const result = service['generateRecommendations']([], 0);

      expect(Array.isArray(result)).toBe(true);
    });
  });
});