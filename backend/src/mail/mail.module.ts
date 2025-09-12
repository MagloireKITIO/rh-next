import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { MailController, MailTestController } from './mail.controller';
import { MailTemplateService } from './mail-template.service';
import { MailTemplateController } from './mail-template.controller';
import { MailConfiguration } from './entities/mail-configuration.entity';
import { MailConfigurationCompany } from './entities/mail-configuration-company.entity';
import { MailTemplate } from './entities/mail-template.entity';
import { Company } from '../companies/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MailConfiguration,
      MailConfigurationCompany,
      MailTemplate,
      Company
    ]),
  ],
  controllers: [MailController, MailTestController, MailTemplateController],
  providers: [MailService, MailTemplateService],
  exports: [MailService, MailTemplateService],
})
export class MailModule {}