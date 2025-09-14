import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailService } from './mail.service';
import { MailController, MailTestController } from './mail.controller';
import { MailTemplateService } from './mail-template.service';
import { MailTemplateController } from './mail-template.controller';
import { MailAutomationService } from './mail-automation.service';
import { MailAutomationController, UserMailAutomationController } from './mail-automation.controller';
import { AutomationEventService } from './automation-event.service';
import { AutomationSubscriber } from './subscribers/automation.subscriber';
import { MailConfiguration } from './entities/mail-configuration.entity';
import { MailConfigurationCompany } from './entities/mail-configuration-company.entity';
import { EmailHistory } from './entities/email-history.entity';
import { MailTemplate } from './entities/mail-template.entity';
import { MailAutomation } from './entities/mail-automation.entity';
import { AutomationLog } from './entities/automation-log.entity';
import { Company } from '../companies/entities/company.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MailConfiguration,
      MailConfigurationCompany,
      EmailHistory,
      MailTemplate,
      MailAutomation,
      AutomationLog,
      Company,
      Project
    ]),
  ],
  controllers: [
    MailController, 
    MailTestController, 
    MailTemplateController, 
    MailAutomationController,
    UserMailAutomationController
  ],
  providers: [
    MailService, 
    MailTemplateService, 
    MailAutomationService, 
    AutomationEventService,
    AutomationSubscriber
  ],
  exports: [
    MailService, 
    MailTemplateService, 
    MailAutomationService, 
    AutomationEventService,
    AutomationSubscriber
  ],
})
export class MailModule implements OnModuleInit {
  constructor(
    private eventEmitter: EventEmitter2,
    private automationEventService: AutomationEventService
  ) {}

  onModuleInit() {
    // Initialiser le service dans le subscriber
    AutomationSubscriber.setAutomationEventService(this.automationEventService);
    console.log('✅ [MAIL MODULE] AutomationEventService initialized in subscriber');
  }
}