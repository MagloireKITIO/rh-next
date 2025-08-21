import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamRequestsService } from './team-requests.service';
import { TeamRequestsController, PublicTeamRequestsController } from './team-requests.controller';
import { TeamRequest } from './entities/team-request.entity';
import { User } from '../auth/entities/user.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TeamRequest, User, Project])],
  controllers: [TeamRequestsController, PublicTeamRequestsController],
  providers: [TeamRequestsService],
  exports: [TeamRequestsService],
})
export class TeamRequestsModule {}