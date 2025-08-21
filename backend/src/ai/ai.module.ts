import { Module } from '@nestjs/common';
import { TogetherAIService } from './together-ai.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ApiKeysModule],
  providers: [TogetherAIService],
  exports: [TogetherAIService],
})
export class AiModule {}