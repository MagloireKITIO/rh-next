import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
}