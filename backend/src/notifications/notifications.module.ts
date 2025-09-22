import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Interview } from '../interviews/entities/interview.entity';
import { InterviewParticipant } from '../interviews/entities/interview-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Interview, InterviewParticipant]),
  ],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}