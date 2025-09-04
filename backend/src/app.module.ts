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
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';
import { MailConfigurationModule } from './mail-configuration/mail-configuration.module';
import { MailAutomationModule } from './mail-automation/mail-automation.module';
import { OpenRouterModule } from './openrouter/openrouter.module';
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
      synchronize: process.env.NODE_ENV === 'development', // Sync uniquement en dev
      migrationsRun: process.env.NODE_ENV !== 'development', // Migrations en prod/test
      migrations: [
        process.env.NODE_ENV === 'development' 
          ? 'src/migrations/*.ts'
          : 'dist/migrations/*.js'
      ],
      ssl: {
        rejectUnauthorized: false,
      },
      logging: process.env.NODE_ENV === 'development' ? true : ['error'],
    }),
    CommonModule,
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
    AdminModule,
    HealthModule,
    MailConfigurationModule,
    MailAutomationModule,
    OpenRouterModule,
  ],
  controllers: [StaticController],
})
export class AppModule {}