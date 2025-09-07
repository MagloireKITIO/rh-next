import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Project } from '../../projects/entities/project.entity';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Analysis } from '../../analysis/entities/analysis.entity';
import { Company } from '../../companies/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Candidate,
      Analysis,
      Company,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}