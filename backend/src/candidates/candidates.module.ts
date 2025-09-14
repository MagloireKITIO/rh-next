import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { AnalysisQueueService } from './analysis-queue.service';
import { Candidate } from './entities/candidate.entity';
import { ProjectsModule } from '../projects/projects.module';
import { AiModule } from '../ai/ai.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { StorageModule } from '../storage/storage.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate]),
    forwardRef(() => ProjectsModule),
    AiModule,
    AnalysisModule,
    StorageModule,
    WebSocketModule,
    ApiKeysModule,
    MailModule,
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService, AnalysisQueueService],
  exports: [CandidatesService, AnalysisQueueService],
})
export class CandidatesModule {}