import { Controller, Get, Param, Query, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProjectsAnalyticsService, ProjectAnalytics, ProjectReport } from './projects-analytics.service';

@Controller('projects-analytics')
@UseGuards(JwtAuthGuard)
export class ProjectsAnalyticsController {
  constructor(private readonly projectsAnalyticsService: ProjectsAnalyticsService) {}

  @Get()
  async getProjectsAnalytics(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
  ): Promise<{ success: boolean; data: ProjectAnalytics[] }> {
    const projects = await this.projectsAnalyticsService.getProjectsAnalytics(
      req.user.company_id,
      {
        search,
        status: status === 'all' ? undefined : status,
        sortBy,
      }
    );

    return {
      success: true,
      data: projects,
    };
  }

  @Get('projects/:id/report')
  async getProjectReport(
    @Request() req: any,
    @Param('id') projectId: string,
    @Query('period') period?: string,
  ): Promise<{ success: boolean; data: ProjectReport }> {
    const report = await this.projectsAnalyticsService.getProjectReport(
      projectId,
      req.user.company_id,
      { period }
    );

    return {
      success: true,
      data: report,
    };
  }

  @Get('projects/:id/export')
  async exportProjectReport(
    @Request() req: any,
    @Param('id') projectId: string,
    @Res() res: Response,
    @Query('format') format: 'pdf' | 'excel' = 'pdf',
    @Query('period') period?: string,
  ) {
    const buffer = await this.projectsAnalyticsService.exportProjectReport(
      projectId,
      req.user.company_id,
      {
        format,
        period,
      }
    );

    const project = await this.projectsAnalyticsService.getProjectBasicInfo(
      projectId,
      req.user.company_id
    );
    const filename = `rapport-${project.name.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

    res.set({
      'Content-Type': format === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}