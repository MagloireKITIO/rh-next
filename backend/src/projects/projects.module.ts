import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController, PublicProjectsController, PublicJobOffersController } from './projects.controller';
import { Project } from './entities/project.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Analysis } from '../analysis/entities/analysis.entity';
import { StorageModule } from '../storage/storage.module';
import { MailAutomationModule } from '../mail-automation/mail-automation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Candidate, Analysis]),
    StorageModule,
    MailAutomationModule
  ],
  controllers: [ProjectsController, PublicProjectsController, PublicJobOffersController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}