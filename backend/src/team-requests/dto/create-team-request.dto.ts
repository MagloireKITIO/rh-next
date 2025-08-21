import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTeamRequestDto {
  @IsEmail()
  @IsNotEmpty()
  requester_email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  requester_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;

  @IsString()
  @IsNotEmpty()
  project_share_token: string;
}