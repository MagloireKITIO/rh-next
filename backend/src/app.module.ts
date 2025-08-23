import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from './projects/projects.module';
import { CandidatesModule } from './candidates/candidates.module';
import { AiModule } from './ai/ai.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { AnalysisModule } from './analysis/analysis.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { WebSocketModule } from './websocket/websocket.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { TeamRequestsModule } from './team-requests/team-requests.module';
import { HealthModule } from './health/health.module';
import { StaticController } from './common/static.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true, // À désactiver en production
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    AuthModule,
    CompaniesModule,
    ProjectsModule,
    CandidatesModule,
    AiModule,
    ConfigurationModule,
    AnalysisModule,
    ApiKeysModule,
    WebSocketModule,
    TeamRequestsModule,
    HealthModule,
  ],
  controllers: [StaticController],
})
export class AppModule {}