import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import { OpenRouterModule } from './openrouter/openrouter.module';
import { MailModule } from './mail/mail.module';
import { PublicModule } from './public/public.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { InterviewsModule } from './interviews/interviews.module';
import { CalendarModule } from './calendar/calendar.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { PlatformSettingsModule } from './platform-settings/platform-settings.module';
import { SecurityModule } from './security/security.module';
import { StaticController } from './common/static.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
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
      subscribers: [
        process.env.NODE_ENV === 'development'
          ? 'src/**/*.subscriber.ts'
          : 'dist/**/*.subscriber.js'
      ],
      ssl: {
        rejectUnauthorized: false,
      },
      logging: process.env.NODE_ENV === 'development' ? true : ['error'],
      // Configuration du pool de connexions pour éviter ECONNRESET
      extra: {
        max: 10, // Limite du pool Supabase
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 10000,
        acquireTimeoutMillis: 30000,
      },
      // Retry sur les erreurs de connexion
      retryAttempts: 3,
      retryDelay: 3000,
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
    OpenRouterModule,
    MailModule,
    PublicModule,
    PipelineModule,
    InterviewsModule,
    CalendarModule,
    IntegrationsModule,
    PlatformSettingsModule,
    SecurityModule,
  ],
  controllers: [StaticController],
})
export class AppModule {}