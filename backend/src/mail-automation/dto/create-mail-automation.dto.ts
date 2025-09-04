import { IsString, IsEnum, IsUUID, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { AutomationTrigger, AutomationEntityType } from '../entities/mail-automation.entity';
import { CreateAutomationConditionDto } from './create-automation-condition.dto';

export class CreateMailAutomationDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AutomationTrigger)
  trigger: AutomationTrigger;

  @IsEnum(AutomationEntityType)
  entity_type: AutomationEntityType;

  @IsUUID()
  company_id: string;

  @IsUUID()
  mail_template_id: string;

  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @IsOptional()
  @IsObject()
  template_variables?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAutomationConditionDto)
  conditions?: CreateAutomationConditionDto[];
}