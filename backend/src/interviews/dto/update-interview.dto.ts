import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInterviewDto } from './create-interview.dto';
import { InterviewStatus } from '../entities/interview.entity';

export class UpdateInterviewDto extends PartialType(CreateInterviewDto) {
  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  started_at?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  ended_at?: Date;

  @IsOptional()
  @IsBoolean()
  calendar_invites_sent?: boolean;

  @IsOptional()
  @IsBoolean()
  reminder_sent?: boolean;
}