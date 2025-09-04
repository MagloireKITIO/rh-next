import { Module } from '@nestjs/common';
import { TogetherAIService } from './together-ai.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { OpenRouterModule } from '../openrouter/openrouter.module';

@Module({
  imports: [ApiKeysModule, OpenRouterModule],
  providers: [TogetherAIService],
  exports: [TogetherAIService],
})
export class AiModule {}