import { IsEnum, IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { MailTemplateType, MailTemplateStatus } from '../entities/mail-template.entity';

export class CreateMailTemplateDto {
  @IsEnum(MailTemplateType)
  type: MailTemplateType;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  subject: string;

  @IsString()
  html_content: string;

  @IsOptional()
  @IsString()
  text_content?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @IsOptional()
  @IsEnum(MailTemplateStatus)
  status?: MailTemplateStatus;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @IsOptional()
  @IsString()
  company_id?: string;
}