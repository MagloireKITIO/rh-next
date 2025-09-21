import { IsString, IsOptional, IsUUID, IsEnum, IsDate, IsInt, IsBoolean, ValidateNested, IsArray, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { InterviewType } from '../entities/interview.entity';
import { ParticipantRole } from '../entities/interview-participant.entity';

export class CreateInterviewParticipantDto {
  @IsUUID()
  user_id: string;

  @IsEnum(ParticipantRole)
  role: ParticipantRole;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInterviewDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDate()
  @Type(() => Date)
  scheduled_at: Date;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  duration_minutes?: number;

  @IsEnum(InterviewType)
  type: InterviewType;

  @IsOptional()
  @IsString()
  meeting_link?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  agenda?: string;

  @IsOptional()
  evaluation_criteria?: Record<string, any>;

  @IsUUID()
  candidate_id: string;

  @IsUUID()
  project_id: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInterviewParticipantDto)
  participants?: CreateInterviewParticipantDto[];
}