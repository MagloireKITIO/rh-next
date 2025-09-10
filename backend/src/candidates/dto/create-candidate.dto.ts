import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsEnum } from 'class-validator';
import { CandidateSource } from '../entities/candidate.entity';

export class CreateCandidateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  extractedText: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsNumber()
  @IsOptional()
  score?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsEnum(CandidateSource)
  @IsOptional()
  source?: CandidateSource;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsOptional()
  extractedData?: any;
}