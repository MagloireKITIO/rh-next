import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  jobDescription: string;

  @IsString()
  @IsOptional()
  customPrompt?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  offerDescription?: string;

  @IsString()
  @IsOptional()
  offerDocumentUrl?: string;

  @IsString()
  @IsOptional()
  offerDocumentFileName?: string;
}