import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailConfigurationService } from './mail-configuration.service';
import { MailConfigurationController, MailConfigurationsController } from './mail-configuration.controller';
import { MailService } from './mail.service';
import { MailConfiguration } from './entities/mail-configuration.entity';
import { MailConfigurationCompany } from './entities/mail-configuration-company.entity';
import { MailTemplate } from './entities/mail-template.entity';
import { MailTemplateService } from './mail-template.service';
import { MailTemplateController } from './mail-template.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MailConfiguration, MailConfigurationCompany, MailTemplate])
  ],
  controllers: [MailConfigurationController, MailConfigurationsController, MailTemplateController],
  providers: [MailConfigurationService, MailService, MailTemplateService],
  exports: [MailConfigurationService, MailService, MailTemplateService], // Export des services pour utilisation dans d'autres modules
})
export class MailConfigurationModule {}