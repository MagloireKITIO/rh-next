import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyGuard } from '../auth/guards/company.guard';
import { CurrentCompany } from '../auth/decorators/current-user.decorator';

@Controller('analysis')
@UseGuards(JwtAuthGuard, CompanyGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  create(@Body() createAnalysisDto: CreateAnalysisDto) {
    return this.analysisService.create(createAnalysisDto);
  }

  @Get()
  findAll(@CurrentCompany() companyId: string, @Query('projectId') projectId?: string) {
    if (projectId) {
      return this.analysisService.findByProject(projectId, companyId);
    }
    return this.analysisService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentCompany() companyId: string) {
    return this.analysisService.findOne(id, companyId);
  }

  @Get('report/:projectId')
  generateProjectReport(@Param('projectId') projectId: string, @CurrentCompany() companyId: string) {
    return this.analysisService.generateProjectReport(projectId, companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.analysisService.remove(id);
  }
}