import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { UserIntegration } from './entities/user-integration.entity';
import { User } from '../auth/entities/user.entity';
import { Configuration } from '../configuration/entities/configuration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserIntegration, User, Configuration]),
    ConfigModule,
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}