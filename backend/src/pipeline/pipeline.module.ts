import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PipelineService } from './pipeline.service';
import { PipelineController } from './pipeline.controller';
import { RecruitmentPipeline } from './entities/recruitment-pipeline.entity';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { CandidatePipelineStatus } from './entities/candidate-pipeline-status.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecruitmentPipeline,
      PipelineStage,
      CandidatePipelineStatus,
      Candidate,
      Project,
    ]),
  ],
  controllers: [PipelineController],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}