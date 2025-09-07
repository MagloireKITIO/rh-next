import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsAnalyticsController } from './projects-analytics.controller';
import { ProjectsAnalyticsService } from './projects-analytics.service';
import { Project } from '../entities/project.entity';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Analysis } from '../../analysis/entities/analysis.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Candidate,
      Analysis,
    ]),
  ],
  controllers: [ProjectsAnalyticsController],
  providers: [ProjectsAnalyticsService],
  exports: [ProjectsAnalyticsService],
})
export class ProjectsAnalyticsModule {}