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

  @IsOptional()
  hrDecision?: {
    recommendation: 'RECRUTER' | 'ENTRETIEN' | 'REJETER';
    confidence: number;
    reasoning: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  };

  @IsOptional()
  skillsMatch?: {
    technical: number;
    experience: number;
    cultural: number;
    overall: number;
  };

  @IsArray()
  @IsOptional()
  risks?: string[];

  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsUUID()
  @IsNotEmpty()
  candidateId: string;
}