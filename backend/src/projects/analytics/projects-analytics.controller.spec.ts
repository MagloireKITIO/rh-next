import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsAnalyticsController } from './projects-analytics.controller';
import { ProjectsAnalyticsService, ProjectAnalytics, ProjectReport } from './projects-analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Response } from 'express';

describe('ProjectsAnalyticsController', () => {
  let controller: ProjectsAnalyticsController;
  let service: ProjectsAnalyticsService;

  const mockProjectsAnalyticsService = {
    getProjectsAnalytics: jest.fn(),
    getProjectReport: jest.fn(),
    exportProjectReport: jest.fn(),
    getProjectBasicInfo: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      company_id: 'company-123',
    },
  };

  const mockResponse = {
    set: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  } as any as Response;

  const mockProjectAnalytics: ProjectAnalytics = {
    id: 'project-123',
    name: 'Frontend Developer Position',
    status: 'active',
    totalCandidates: 25,
    analyzedCandidates: 20,
    averageScore: 75.5,
    topCandidateScore: 92.0,
    createdAt: '2024-01-15T10:00:00Z',
    lastActivity: '2024-01-20T14:30:00Z',
  };

  const mockProjectReport: ProjectReport = {
    project: {
      id: 'project-123',
      name: 'Frontend Developer Position',
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z',
      jobDescription: 'Looking for experienced React developer',
    },
    metrics: {
      totalCandidates: 25,
      analyzedCandidates: 20,
      pendingAnalysis: 5,
      averageScore: 75.5,
      topScore: 92.0,
      bottomScore: 45.0,
      conversionRate: 80.0,
    },
    scoreDistribution: {
      excellent: 5,
      good: 8,
      average: 7,
      poor: 5,
    },
    timeline: [
      {
        date: '2024-01-15',
        candidatesAdded: 10,
        candidatesAnalyzed: 8,
      },
      {
        date: '2024-01-16',
        candidatesAdded: 15,
        candidatesAnalyzed: 12,
      },
    ],
    topCandidates: [
      {
        id: 'candidate-1',
        name: 'John Doe',
        score: 92.0,
        summary: 'Excellent technical skills',
        status: 'analyzed',
        hrDecision: { recommendation: 'RECRUTER' },
      },
      {
        id: 'candidate-2',
        name: 'Jane Smith',
        score: 88.5,
        summary: 'Strong experience in React',
        status: 'analyzed',
        hrDecision: { recommendation: 'ENTRETIEN' },
      },
    ],
    skillsAnalysis: {
      technical: 78.0,
      experience: 75.0,
      cultural: 72.0,
      overall: 75.5,
    },
    hrRecommendations: {
      recruit: 8,
      interview: 7,
      reject: 5,
    },
    risks: ['Low cultural fit scores for some candidates'],
    insights: ['Strong technical skills across all candidates', 'Consider focusing on cultural fit'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsAnalyticsController],
      providers: [
        {
          provide: ProjectsAnalyticsService,
          useValue: mockProjectsAnalyticsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProjectsAnalyticsController>(ProjectsAnalyticsController);
    service = module.get<ProjectsAnalyticsService>(ProjectsAnalyticsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProjectsAnalytics', () => {
    it('should return projects analytics without filters', async () => {
      const projects = [mockProjectAnalytics];
      mockProjectsAnalyticsService.getProjectsAnalytics.mockResolvedValue(projects);

      const result = await controller.getProjectsAnalytics(mockRequest);

      expect(service.getProjectsAnalytics).toHaveBeenCalledWith('company-123', {
        search: undefined,
        status: undefined,
        sortBy: undefined,
      });
      expect(result).toEqual({
        success: true,
        data: projects,
      });
    });

    it('should return projects analytics with search filter', async () => {
      const projects = [mockProjectAnalytics];
      mockProjectsAnalyticsService.getProjectsAnalytics.mockResolvedValue(projects);

      const result = await controller.getProjectsAnalytics(mockRequest, 'Frontend');

      expect(service.getProjectsAnalytics).toHaveBeenCalledWith('company-123', {
        search: 'Frontend',
        status: undefined,
        sortBy: undefined,
      });
      expect(result).toEqual({
        success: true,
        data: projects,
      });
    });

    it('should return projects analytics with status filter', async () => {
      const projects = [mockProjectAnalytics];
      mockProjectsAnalyticsService.getProjectsAnalytics.mockResolvedValue(projects);

      const result = await controller.getProjectsAnalytics(mockRequest, undefined, 'active');

      expect(service.getProjectsAnalytics).toHaveBeenCalledWith('company-123', {
        search: undefined,
        status: 'active',
        sortBy: undefined,
      });
      expect(result).toEqual({
        success: true,
        data: projects,
      });
    });

    it('should handle "all" status filter by converting to undefined', async () => {
      const projects = [mockProjectAnalytics];
      mockProjectsAnalyticsService.getProjectsAnalytics.mockResolvedValue(projects);

      const result = await controller.getProjectsAnalytics(mockRequest, undefined, 'all');

      expect(service.getProjectsAnalytics).toHaveBeenCalledWith('company-123', {
        search: undefined,
        status: undefined,
        sortBy: undefined,
      });
      expect(result).toEqual({
        success: true,
        data: projects,
      });
    });

    it('should return projects analytics with sortBy filter', async () => {
      const projects = [mockProjectAnalytics];
      mockProjectsAnalyticsService.getProjectsAnalytics.mockResolvedValue(projects);

      const result = await controller.getProjectsAnalytics(mockRequest, undefined, undefined, 'name');

      expect(service.getProjectsAnalytics).toHaveBeenCalledWith('company-123', {
        search: undefined,
        status: undefined,
        sortBy: 'name',
      });
      expect(result).toEqual({
        success: true,
        data: projects,
      });
    });

    it('should return projects analytics with all filters', async () => {
      const projects = [mockProjectAnalytics];
      mockProjectsAnalyticsService.getProjectsAnalytics.mockResolvedValue(projects);

      const result = await controller.getProjectsAnalytics(
        mockRequest,
        'Developer',
        'active',
        'createdAt'
      );

      expect(service.getProjectsAnalytics).toHaveBeenCalledWith('company-123', {
        search: 'Developer',
        status: 'active',
        sortBy: 'createdAt',
      });
      expect(result).toEqual({
        success: true,
        data: projects,
      });
    });

    it('should handle empty results', async () => {
      mockProjectsAnalyticsService.getProjectsAnalytics.mockResolvedValue([]);

      const result = await controller.getProjectsAnalytics(mockRequest);

      expect(service.getProjectsAnalytics).toHaveBeenCalledWith('company-123', {
        search: undefined,
        status: undefined,
        sortBy: undefined,
      });
      expect(result).toEqual({
        success: true,
        data: [],
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockProjectsAnalyticsService.getProjectsAnalytics.mockRejectedValue(error);

      await expect(controller.getProjectsAnalytics(mockRequest)).rejects.toThrow(error);
      expect(service.getProjectsAnalytics).toHaveBeenCalledWith('company-123', {
        search: undefined,
        status: undefined,
        sortBy: undefined,
      });
    });
  });

  describe('getProjectReport', () => {
    it('should return project report without period', async () => {
      mockProjectsAnalyticsService.getProjectReport.mockResolvedValue(mockProjectReport);

      const result = await controller.getProjectReport(mockRequest, 'project-123');

      expect(service.getProjectReport).toHaveBeenCalledWith('project-123', 'company-123', {
        period: undefined,
      });
      expect(result).toEqual({
        success: true,
        data: mockProjectReport,
      });
    });

    it('should return project report with period', async () => {
      mockProjectsAnalyticsService.getProjectReport.mockResolvedValue(mockProjectReport);

      const result = await controller.getProjectReport(mockRequest, 'project-123', '7d');

      expect(service.getProjectReport).toHaveBeenCalledWith('project-123', 'company-123', {
        period: '7d',
      });
      expect(result).toEqual({
        success: true,
        data: mockProjectReport,
      });
    });

    it('should handle different periods', async () => {
      mockProjectsAnalyticsService.getProjectReport.mockResolvedValue(mockProjectReport);

      const periods = ['30d', '90d', '1y'];

      for (const period of periods) {
        await controller.getProjectReport(mockRequest, 'project-123', period);

        expect(service.getProjectReport).toHaveBeenCalledWith('project-123', 'company-123', {
          period,
        });
      }
    });

    it('should handle project not found', async () => {
      const error = new Error('Project not found');
      mockProjectsAnalyticsService.getProjectReport.mockRejectedValue(error);

      await expect(controller.getProjectReport(mockRequest, 'non-existent')).rejects.toThrow(error);
      expect(service.getProjectReport).toHaveBeenCalledWith('non-existent', 'company-123', {
        period: undefined,
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Report generation failed');
      mockProjectsAnalyticsService.getProjectReport.mockRejectedValue(error);

      await expect(controller.getProjectReport(mockRequest, 'project-123')).rejects.toThrow(error);
      expect(service.getProjectReport).toHaveBeenCalledWith('project-123', 'company-123', {
        period: undefined,
      });
    });
  });

  describe('exportProjectReport', () => {
    const mockBuffer = Buffer.from('mock file content');
    const mockProjectInfo = {
      id: 'project-123',
      name: 'Frontend Developer Position',
    };

    beforeEach(() => {
      mockProjectsAnalyticsService.exportProjectReport.mockResolvedValue(mockBuffer);
      mockProjectsAnalyticsService.getProjectBasicInfo.mockResolvedValue(mockProjectInfo);
    });

    it('should export project report as PDF (default)', async () => {
      await controller.exportProjectReport(mockRequest, 'project-123', mockResponse);

      expect(service.exportProjectReport).toHaveBeenCalledWith('project-123', 'company-123', {
        format: 'pdf',
        period: undefined,
      });
      expect(service.getProjectBasicInfo).toHaveBeenCalledWith('project-123', 'company-123');

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': expect.stringMatching(/attachment; filename="rapport-Frontend_Developer_Position-\d{4}-\d{2}-\d{2}\.pdf"/),
        'Content-Length': mockBuffer.length,
      });
      expect(mockResponse.end).toHaveBeenCalledWith(mockBuffer);
    });

    it('should export project report as Excel', async () => {
      await controller.exportProjectReport(mockRequest, 'project-123', mockResponse, 'excel');

      expect(service.exportProjectReport).toHaveBeenCalledWith('project-123', 'company-123', {
        format: 'excel',
        period: undefined,
      });
      expect(service.getProjectBasicInfo).toHaveBeenCalledWith('project-123', 'company-123');

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': expect.stringMatching(/attachment; filename="rapport-Frontend_Developer_Position-\d{4}-\d{2}-\d{2}\.xlsx"/),
        'Content-Length': mockBuffer.length,
      });
      expect(mockResponse.end).toHaveBeenCalledWith(mockBuffer);
    });

    it('should export project report with period', async () => {
      await controller.exportProjectReport(
        mockRequest,
        'project-123',
        mockResponse,
        'pdf',
        '30d'
      );

      expect(service.exportProjectReport).toHaveBeenCalledWith('project-123', 'company-123', {
        format: 'pdf',
        period: '30d',
      });
      expect(service.getProjectBasicInfo).toHaveBeenCalledWith('project-123', 'company-123');

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': expect.stringMatching(/attachment; filename="rapport-Frontend_Developer_Position-\d{4}-\d{2}-\d{2}\.pdf"/),
        'Content-Length': mockBuffer.length,
      });
      expect(mockResponse.end).toHaveBeenCalledWith(mockBuffer);
    });

    it('should handle project names with special characters', async () => {
      const projectWithSpecialChars = {
        id: 'project-456',
        name: 'Senior Frontend Developer - React/Vue.js (Remote)',
      };
      mockProjectsAnalyticsService.getProjectBasicInfo.mockResolvedValue(projectWithSpecialChars);

      await controller.exportProjectReport(mockRequest, 'project-456', mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': expect.stringMatching(/attachment; filename="rapport-Senior_Frontend_Developer___React_Vue_js__Remote_-\d{4}-\d{2}-\d{2}\.pdf"/),
        'Content-Length': mockBuffer.length,
      });
    });

    it('should handle export errors', async () => {
      const error = new Error('Export failed');
      mockProjectsAnalyticsService.exportProjectReport.mockRejectedValue(error);

      await expect(
        controller.exportProjectReport(mockRequest, 'project-123', mockResponse)
      ).rejects.toThrow(error);

      expect(service.exportProjectReport).toHaveBeenCalledWith('project-123', 'company-123', {
        format: 'pdf',
        period: undefined,
      });
    });

    it('should handle project info retrieval errors', async () => {
      const error = new Error('Project not found');
      mockProjectsAnalyticsService.getProjectBasicInfo.mockRejectedValue(error);

      await expect(
        controller.exportProjectReport(mockRequest, 'project-123', mockResponse)
      ).rejects.toThrow(error);

      expect(service.exportProjectReport).toHaveBeenCalledWith('project-123', 'company-123', {
        format: 'pdf',
        period: undefined,
      });
      expect(service.getProjectBasicInfo).toHaveBeenCalledWith('project-123', 'company-123');
    });

    it('should handle different export formats correctly', async () => {
      // Test Excel format
      await controller.exportProjectReport(mockRequest, 'project-123', mockResponse, 'excel');

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': expect.stringContaining('.xlsx'),
        })
      );

      jest.clearAllMocks();

      // Test PDF format
      await controller.exportProjectReport(mockRequest, 'project-123', mockResponse, 'pdf');

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/pdf',
          'Content-Disposition': expect.stringContaining('.pdf'),
        })
      );
    });
  });

  describe('Authentication Guards', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', ProjectsAnalyticsController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should protect getProjectsAnalytics with JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.getProjectsAnalytics);
      expect(guards).toBeFalsy(); // inherited from class level
    });

    it('should protect getProjectReport with JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.getProjectReport);
      expect(guards).toBeFalsy(); // inherited from class level
    });

    it('should protect exportProjectReport with JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', controller.exportProjectReport);
      expect(guards).toBeFalsy(); // inherited from class level
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user in request', async () => {
      const invalidRequest = { user: undefined };

      await expect(controller.getProjectsAnalytics(invalidRequest as any)).rejects.toThrow();
    });

    it('should handle missing company_id in request', async () => {
      const invalidRequest = { user: { id: 'user-123' } };
      mockProjectsAnalyticsService.getProjectsAnalytics.mockResolvedValue([]);

      const result = await controller.getProjectsAnalytics(invalidRequest as any);

      expect(service.getProjectsAnalytics).toHaveBeenCalledWith(undefined, {
        search: undefined,
        status: undefined,
        sortBy: undefined,
      });
      expect(result).toEqual({
        success: true,
        data: [],
      });
    });

    it('should handle empty project name in export', async () => {
      const mockBuffer = Buffer.from('test content');
      const projectWithEmptyName = {
        id: 'project-789',
        name: '',
      };
      mockProjectsAnalyticsService.getProjectBasicInfo.mockResolvedValue(projectWithEmptyName);
      mockProjectsAnalyticsService.exportProjectReport.mockResolvedValue(mockBuffer);

      await controller.exportProjectReport(mockRequest, 'project-789', mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': expect.stringMatching(/attachment; filename="rapport--\d{4}-\d{2}-\d{2}\.pdf"/),
        'Content-Length': mockBuffer.length,
      });
    });

    it('should handle very long filter values', async () => {
      const longSearch = 'a'.repeat(1000);
      const projects = [mockProjectAnalytics];
      mockProjectsAnalyticsService.getProjectsAnalytics.mockResolvedValue(projects);

      const result = await controller.getProjectsAnalytics(mockRequest, longSearch);

      expect(service.getProjectsAnalytics).toHaveBeenCalledWith('company-123', {
        search: longSearch,
        status: undefined,
        sortBy: undefined,
      });
      expect(result).toEqual({
        success: true,
        data: projects,
      });
    });
  });
});