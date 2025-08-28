import { IsEmail, IsEnum, IsOptional, IsString, IsBoolean, IsNumber, IsIn } from 'class-validator';
import { MailProviderType } from '../entities/mail-configuration.entity';

export class CreateMailConfigurationDto {
  @IsEnum(MailProviderType)
  provider_type: MailProviderType;

  @IsOptional()
  @IsString()
  company_id?: string;

  // Configuration SMTP
  @IsOptional()
  @IsString()
  smtp_host?: string;

  @IsOptional()
  @IsNumber()
  smtp_port?: number;

  @IsOptional()
  @IsString()
  smtp_user?: string;

  @IsOptional()
  @IsString()
  smtp_password?: string;

  @IsOptional()
  @IsBoolean()
  smtp_secure?: boolean;

  @IsOptional()
  @IsBoolean()
  smtp_require_tls?: boolean;

  // Configuration services tiers
  @IsOptional()
  @IsString()
  api_key?: string;

  @IsOptional()
  @IsString()
  api_secret?: string;

  // Configuration générale
  @IsEmail()
  from_email: string;

  @IsOptional()
  @IsString()
  from_name?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}