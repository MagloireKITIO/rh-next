import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationSubscriber } from './automation.subscriber';
import { MailAutomationModule } from '../mail-automation.module';

/**
 * Module dédié aux subscribers d'automatisation
 * 
 * Ce module configure les subscribers TypeORM pour déclencher automatiquement
 * les automatisations lors des opérations CRUD sur les entités.
 */
@Module({
  imports: [
    // Import du module d'automatisation pour accéder aux services
    MailAutomationModule,
  ],
  providers: [
    AutomationSubscriber,
  ],
  exports: [
    AutomationSubscriber,
  ],
})
export class SubscribersModule {}