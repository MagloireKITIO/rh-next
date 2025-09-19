import { IsString, IsOptional, IsUUID } from 'class-validator';

export class MoveCandidateDto {
  @IsUUID()
  candidateId: string;

  @IsUUID()
  stageId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}