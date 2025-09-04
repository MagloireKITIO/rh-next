import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ConditionOperator, ConditionLogic } from '../entities/automation-condition.entity';

export class CreateAutomationConditionDto {
  @IsString()
  field_path: string;

  @IsEnum(ConditionOperator)
  operator: ConditionOperator;

  @IsOptional()
  value?: any;

  @IsOptional()
  @IsEnum(ConditionLogic)
  logic?: ConditionLogic;

  @IsOptional()
  @IsNumber()
  order?: number;
}