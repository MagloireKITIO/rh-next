import { PartialType } from '@nestjs/mapped-types';
import { CreateMailTemplateDto } from './create-mail-template.dto';
import { IsOptional, IsNumber } from 'class-validator';

export class UpdateMailTemplateDto extends PartialType(CreateMailTemplateDto) {
  @IsOptional()
  @IsNumber()
  version?: number;
}