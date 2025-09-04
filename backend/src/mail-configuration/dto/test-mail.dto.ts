import { IsEmail, IsOptional, IsString } from 'class-validator';

export class TestMailDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  company_id?: string;
}