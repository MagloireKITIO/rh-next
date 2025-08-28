import { PartialType } from '@nestjs/mapped-types';
import { CreateMailConfigurationDto } from './create-mail-configuration.dto';

export class UpdateMailConfigurationDto extends PartialType(CreateMailConfigurationDto) {}