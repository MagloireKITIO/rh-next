import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { CreatePipelineDto, UpdatePipelineDto, MoveCandidateDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Post('project/:projectId')
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() createPipelineDto: CreatePipelineDto,
    @Request() req,
  ) {
    return this.pipelineService.create(createPipelineDto, projectId, req.user.company_id);
  }

  @Get('project/:projectId')
  async findByProject(@Param('projectId', ParseUUIDPipe) projectId: string, @Request() req) {
    console.log(`🔍 Getting pipelines for project: ${projectId} for company ${req.user.company_id}`);
    try {
      const result = await this.pipelineService.findByProject(projectId, req.user.company_id);
      console.log(`✅ Found ${result.length} pipeline(s) for project ${projectId}`);
      return result;
    } catch (error) {
      console.error(`❌ Error getting pipelines for project ${projectId}:`, error.message);
      throw error;
    }
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.pipelineService.findOne(id, req.user.company_id);
  }

  @Get(':id/with-candidates')
  async getPipelineWithCandidates(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    console.log(`🔍 Getting pipeline with candidates: ${id} for company ${req.user.company_id}`);
    try {
      const result = await this.pipelineService.getPipelineWithCandidates(id, req.user.company_id);
      console.log(`✅ Pipeline found with ${result.stages?.length || 0} stages`);
      return result;
    } catch (error) {
      console.error(`❌ Error getting pipeline ${id}:`, error.message);
      throw error;
    }
  }

  @Get(':id/stats')
  getPipelineStats(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.pipelineService.getPipelineStats(id, req.user.company_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePipelineDto: UpdatePipelineDto,
    @Request() req,
  ) {
    return this.pipelineService.update(id, updatePipelineDto, req.user.company_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.pipelineService.remove(id, req.user.company_id);
  }

  @Post(':id/stages')
  addStage(
    @Param('id', ParseUUIDPipe) pipelineId: string,
    @Body() stageData: { name: string; description?: string; color?: string },
    @Request() req,
  ) {
    return this.pipelineService.addStage(pipelineId, stageData, req.user.company_id);
  }

  @Patch('stages/:stageId')
  updateStage(
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() stageData: { name?: string; description?: string; color?: string },
    @Request() req,
  ) {
    return this.pipelineService.updateStage(stageId, stageData, req.user.company_id);
  }

  @Delete('stages/:stageId')
  removeStage(@Param('stageId', ParseUUIDPipe) stageId: string, @Request() req) {
    return this.pipelineService.removeStage(stageId, req.user.company_id);
  }

  @Post('move-candidate')
  moveCandidate(@Body() moveCandidateDto: MoveCandidateDto, @Request() req) {
    return this.pipelineService.moveCandidate(moveCandidateDto, req.user.company_id, req.user.id);
  }

  @Post(':id/stages/reorder')
  reorderStages(
    @Param('id', ParseUUIDPipe) pipelineId: string,
    @Body() stageOrders: { stageId: string; order: number }[],
    @Request() req,
  ) {
    return this.pipelineService.reorderStages(pipelineId, stageOrders, req.user.company_id);
  }
}