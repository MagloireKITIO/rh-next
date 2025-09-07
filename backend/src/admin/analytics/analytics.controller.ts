import { Controller, Get, Param, Query, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { AnalyticsService, ProjectAnalytics, ProjectReport } from './analytics.service';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('projects')
  async getProjectsAnalytics(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
  ): Promise<{ success: boolean; data: ProjectAnalytics[] }> {
    const projects = await this.analyticsService.getProjectsAnalytics({
      search,
      status: status === 'all' ? undefined : status,
      sortBy,
    });

    return {
      success: true,
      data: projects,
    };
  }

  @Get('projects/:id/report')
  async getProjectReport(
    @Param('id') projectId: string,
    @Query('period') period?: string,
  ): Promise<{ success: boolean; data: ProjectReport }> {
    const report = await this.analyticsService.getProjectReport(projectId, {
      period,
    });

    return {
      success: true,
      data: report,
    };
  }

  @Get('projects/:id/export')
  async exportProjectReport(
    @Param('id') projectId: string,
    @Res() res: Response,
    @Query('format') format: 'pdf' | 'excel' = 'pdf',
    @Query('period') period?: string,
  ) {
    const buffer = await this.analyticsService.exportProjectReport(projectId, {
      format,
      period,
    });

    const project = await this.analyticsService.getProjectBasicInfo(projectId);
    const filename = `rapport-${project.name.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

    res.set({
      'Content-Type': format === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.status(HttpStatus.OK).end(buffer);
  }

  @Get('global-stats')
  async getGlobalAnalyticsStats() {
    const stats = await this.analyticsService.getGlobalAnalyticsStats();

    return {
      success: true,
      data: stats,
    };
  }
}