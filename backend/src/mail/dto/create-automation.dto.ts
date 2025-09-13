import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { TriggerType, VisibilityType } from '../entities/mail-automation.entity';

export class CreateMailAutomationDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  company_id?: string;

  @IsString()
  target_entity: string;

  @IsEnum(TriggerType)
  trigger_type: TriggerType;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsString()
  conditions_querystring?: string;

  @IsUUID()
  mail_template_id: string;

  @IsString()
  recipient_rules: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cc_users?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsEnum(VisibilityType)
  visibility?: VisibilityType;
}

export class UpdateMailAutomationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  target_entity?: string;

  @IsOptional()
  @IsEnum(TriggerType)
  trigger_type?: TriggerType;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsString()
  conditions_querystring?: string;

  @IsOptional()
  @IsUUID()
  mail_template_id?: string;

  @IsOptional()
  @IsString()
  recipient_rules?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cc_users?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsEnum(VisibilityType)
  visibility?: VisibilityType;
}