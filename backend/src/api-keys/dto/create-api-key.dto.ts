import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @MinLength(10, { message: 'API key must be at least 10 characters long' })
  key: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsString()
  provider?: string = 'together_ai';
}