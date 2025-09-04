import { PartialType } from '@nestjs/mapped-types';
import { CreateMailAutomationDto } from './create-mail-automation.dto';

export class UpdateMailAutomationDto extends PartialType(CreateMailAutomationDto) {}