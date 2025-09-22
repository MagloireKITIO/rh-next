import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { Interview } from './entities/interview.entity';
import { InterviewParticipant } from './entities/interview-participant.entity';
import { InterviewEvaluation } from './entities/interview-evaluation.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../auth/entities/user.entity';
import { CalendarModule } from '../calendar/calendar.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Interview,
      InterviewParticipant,
      InterviewEvaluation,
      Candidate,
      Project,
      User,
    ]),
    CalendarModule,
    NotificationsModule,
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService],
})
export class InterviewsModule {}