import { IsUUID, IsOptional, IsString, IsInt, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { EvaluationRecommendation } from '../entities/interview-evaluation.entity';

export class CreateInterviewEvaluationDto {
  @IsUUID()
  interview_id: string;

  @IsOptional()
  criteria_scores?: Record<string, number>;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  overall_score?: number;

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  weaknesses?: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(EvaluationRecommendation)
  recommendation?: EvaluationRecommendation;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  confidence_level?: number;

  @IsOptional()
  additional_data?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  is_completed?: boolean;
}