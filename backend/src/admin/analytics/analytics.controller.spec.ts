import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService, ProjectAnalytics, ProjectReport } from './analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: jest.Mocked<AnalyticsService>;

  const mockAnalyticsService = {
    getProjectsAnalytics: jest.fn(),
    getProjectReport: jest.fn(),
    exportProjectReport: jest.fn(),
    getProjectBasicInfo: jest.fn(),
    getGlobalAnalyticsStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProjectsAnalytics', () => {
    it('should get projects analytics without filters', async () => {
      const mockProjects: ProjectAnalytics[] = [
        {
          id: 'project-1',
          name: 'Test Project',
          status: 'active',
          companyName: 'Test Company',
          totalCandidates: 10,
          analyzedCandidates: 8,
          averageScore: 75.5,
          topCandidateScore: 95.0,
          createdAt: '2023-01-01',
          lastActivity: '2023-01-15'
        }
      ];
      analyticsService.getProjectsAnalytics.mockResolvedValue(mockProjects);

      const result = await controller.getProjectsAnalytics();

      expect(analyticsService.getProjectsAnalytics).toHaveBeenCalledWith({
        search: undefined,
        status: undefined,
        sortBy: undefined,
      });
      expect(result).toEqual({
        success: true,
        data: mockProjects,
      });
    });

    it('should get projects analytics with filters', async () => {
      const mockProjects: ProjectAnalytics[] = [
        {
          id: 'project-1',
          name: 'Test Project',
          status: 'active',
          companyName: 'Test Company',
          totalCandidates: 10,
          analyzedCandidates: 8,
          averageScore: 75.5,
          topCandidateScore: 95.0,
          createdAt: '2023-01-01',
          lastActivity: '2023-01-15'
        }
      ];
      analyticsService.getProjectsAnalytics.mockResolvedValue(mockProjects);

      const result = await controller.getProjectsAnalytics('test', 'active', 'name');

      expect(analyticsService.getProjectsAnalytics).toHaveBeenCalledWith({
        search: 'test',
        status: 'active',
        sortBy: 'name',
      });
      expect(result).toEqual({
        success: true,
        data: mockProjects,
      });
    });

    it('should handle "all" status filter', async () => {
      const mockProjects: ProjectAnalytics[] = [];
      analyticsService.getProjectsAnalytics.mockResolvedValue(mockProjects);

      const result = await controller.getProjectsAnalytics(undefined, 'all');

      expect(analyticsService.getProjectsAnalytics).toHaveBeenCalledWith({
        search: undefined,
        status: undefined,
        sortBy: undefined,
      });
      expect(result).toEqual({
        success: true,
        data: mockProjects,
      });
    });
  });

  describe('getProjectReport', () => {
    it('should get project report without period', async () => {
      const mockReport: ProjectReport = {
        project: {
          id: 'project-1',
          name: 'Test Project',
          status: 'active',
          companyName: 'Test Company',
          createdAt: '2023-01-01',
          jobDescription: 'Test job description'
        },
        metrics: {
          totalCandidates: 10,
          analyzedCandidates: 8,
          pendingAnalysis: 2,
          averageScore: 75.5,
          topScore: 95.0,
          bottomScore: 60.0,
          conversionRate: 80.0
        }
      } as ProjectReport;
      analyticsService.getProjectReport.mockResolvedValue(mockReport);

      const result = await controller.getProjectReport('project-1');

      expect(analyticsService.getProjectReport).toHaveBeenCalledWith('project-1', {
        period: undefined,
      });
      expect(result).toEqual({
        success: true,
        data: mockReport,
      });
    });

    it('should get project report with period', async () => {
      const mockReport: ProjectReport = {
        project: {
          id: 'project-1',
          name: 'Test Project',
          status: 'active',
          companyName: 'Test Company',
          createdAt: '2023-01-01',
          jobDescription: 'Test job description'
        },
        metrics: {
          totalCandidates: 5,
          analyzedCandidates: 4,
          pendingAnalysis: 1,
          averageScore: 80.0,
          topScore: 95.0,
          bottomScore: 65.0,
          conversionRate: 80.0
        }
      } as ProjectReport;
      analyticsService.getProjectReport.mockResolvedValue(mockReport);

      const result = await controller.getProjectReport('project-1', '7d');

      expect(analyticsService.getProjectReport).toHaveBeenCalledWith('project-1', {
        period: '7d',
      });
      expect(result).toEqual({
        success: true,
        data: mockReport,
      });
    });
  });

  describe('exportProjectReport', () => {
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockResponse = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        end: jest.fn(),
      };
    });

    it('should export project report as PDF', async () => {
      const mockBuffer = Buffer.from('pdf-content');
      const mockProject = { name: 'Test Project' };

      analyticsService.exportProjectReport.mockResolvedValue(mockBuffer);
      analyticsService.getProjectBasicInfo.mockResolvedValue(mockProject as any);

      await controller.exportProjectReport('project-1', mockResponse as Response);

      expect(analyticsService.exportProjectReport).toHaveBeenCalledWith('project-1', {
        format: 'pdf',
        period: undefined,
      });
      expect(analyticsService.getProjectBasicInfo).toHaveBeenCalledWith('project-1');

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': expect.stringContaining('attachment; filename="rapport-Test_Project-'),
        'Content-Length': mockBuffer.length,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.end).toHaveBeenCalledWith(mockBuffer);
    });

    it('should export project report as Excel', async () => {
      const mockBuffer = Buffer.from('excel-content');
      const mockProject = { name: 'Test Project' };

      analyticsService.exportProjectReport.mockResolvedValue(mockBuffer);
      analyticsService.getProjectBasicInfo.mockResolvedValue(mockProject as any);

      await controller.exportProjectReport('project-1', mockResponse as Response, 'excel');

      expect(analyticsService.exportProjectReport).toHaveBeenCalledWith('project-1', {
        format: 'excel',
        period: undefined,
      });
      expect(analyticsService.getProjectBasicInfo).toHaveBeenCalledWith('project-1');

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': expect.stringContaining('attachment; filename="rapport-Test_Project-'),
        'Content-Length': mockBuffer.length,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.end).toHaveBeenCalledWith(mockBuffer);
    });

    it('should export project report with period', async () => {
      const mockBuffer = Buffer.from('pdf-content');
      const mockProject = { name: 'Test Project' };

      analyticsService.exportProjectReport.mockResolvedValue(mockBuffer);
      analyticsService.getProjectBasicInfo.mockResolvedValue(mockProject as any);

      await controller.exportProjectReport('project-1', mockResponse as Response, 'pdf', '30d');

      expect(analyticsService.exportProjectReport).toHaveBeenCalledWith('project-1', {
        format: 'pdf',
        period: '30d',
      });
    });

    it('should sanitize project name in filename', async () => {
      const mockBuffer = Buffer.from('pdf-content');
      const mockProject = { name: 'Test Project @#$%' };

      analyticsService.exportProjectReport.mockResolvedValue(mockBuffer);
      analyticsService.getProjectBasicInfo.mockResolvedValue(mockProject as any);

      await controller.exportProjectReport('project-1', mockResponse as Response);

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': expect.stringContaining('rapport-Test_Project_____-'),
        'Content-Length': mockBuffer.length,
      });
    });
  });

  describe('getGlobalAnalyticsStats', () => {
    it('should get global analytics stats', async () => {
      const mockStats = {
        totalProjects: 25,
        activeProjects: 20,
        totalCandidates: 500,
        analyzedCandidates: 450,
        averageProjectScore: 78.5,
        topPerformingProject: {
          id: 'project-1',
          name: 'Best Project',
          score: 95.0
        },
        recentActivity: [
          {
            type: 'analysis_completed',
            projectName: 'Test Project',
            timestamp: '2023-01-15T10:00:00Z'
          }
        ]
      };
      analyticsService.getGlobalAnalyticsStats.mockResolvedValue(mockStats as any);

      const result = await controller.getGlobalAnalyticsStats();

      expect(analyticsService.getGlobalAnalyticsStats).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: mockStats,
      });
    });
  });
});