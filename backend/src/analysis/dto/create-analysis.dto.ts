import { IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateAnalysisDto {
  @IsString()
  @IsNotEmpty()
  aiResponse: string;

  @IsOptional()
  analysisData: any;

  @IsNumber()
  score: number;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsArray()
  @IsOptional()
  strengths?: string[];

  @IsArray()
  @IsOptional()
  weaknesses?: string[];

  @IsArray()
  @IsOptional()
  recommendations?: string[];

  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsUUID()
  @IsNotEmpty()
  candidateId: string;
}