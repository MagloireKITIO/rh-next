import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Company } from '../companies/entities/company.entity';
import { User } from '../auth/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Analysis } from '../analysis/entities/analysis.entity';
import { ApiKey } from '../api-keys/entities/api-key.entity';
import { OpenRouterModule } from '../openrouter/openrouter.module';
import { ApiKeyModelConfig } from '../api-keys/entities/api-key-model-config.entity';
import { ApiKeyModelConfigService } from '../api-keys/api-key-model-config.service';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User, Project, Candidate, Analysis, ApiKey, ApiKeyModelConfig]),
    OpenRouterModule,
    AnalyticsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, ApiKeyModelConfigService],
  exports: [AdminService],
})
export class AdminModule {}