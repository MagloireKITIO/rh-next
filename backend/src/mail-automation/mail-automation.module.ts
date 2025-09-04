import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailAutomation } from './entities/mail-automation.entity';
import { AutomationCondition } from './entities/automation-condition.entity';
import { MailAutomationService } from './services/mail-automation.service';
import { ConditionEvaluatorService } from './services/condition-evaluator.service';
import { AutomationTriggerService } from './services/automation-trigger.service';
import { MailAutomationController } from './mail-automation.controller';
import { MailConfigurationModule } from '../mail-configuration/mail-configuration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MailAutomation, AutomationCondition]),
    MailConfigurationModule, // Import du module mail-configuration existant
  ],
  controllers: [MailAutomationController],
  providers: [
    MailAutomationService,
    ConditionEvaluatorService,
    AutomationTriggerService,
  ],
  exports: [
    MailAutomationService,
    ConditionEvaluatorService,
    AutomationTriggerService,
  ], // Export des services pour utilisation dans d'autres modules
})
export class MailAutomationModule {}