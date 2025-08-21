import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController, PublicProjectsController } from './projects.controller';
import { Project } from './entities/project.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Analysis } from '../analysis/entities/analysis.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Candidate, Analysis])],
  controllers: [ProjectsController, PublicProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}