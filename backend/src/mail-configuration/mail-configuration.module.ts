import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailConfigurationService } from './mail-configuration.service';
import { MailConfigurationController, MailConfigurationsController } from './mail-configuration.controller';
import { MailService } from './mail.service';
import { MailConfiguration } from './entities/mail-configuration.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MailConfiguration])
  ],
  controllers: [MailConfigurationController, MailConfigurationsController],
  providers: [MailConfigurationService, MailService],
  exports: [MailConfigurationService, MailService], // Export des services pour utilisation dans d'autres modules
})
export class MailConfigurationModule {}