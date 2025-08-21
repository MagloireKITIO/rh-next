import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { Analysis } from './entities/analysis.entity';
import { Project } from '../projects/entities/project.entity';
import { Candidate } from '../candidates/entities/candidate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Analysis, Project, Candidate])
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}