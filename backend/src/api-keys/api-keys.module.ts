import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { ApiKey } from './entities/api-key.entity';
import { ApiKeyModelConfig } from './entities/api-key-model-config.entity';
import { ApiKeyModelConfigService } from './api-key-model-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey, ApiKeyModelConfig])],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyModelConfigService],
  exports: [ApiKeysService, ApiKeyModelConfigService],
})
export class ApiKeysModule {}