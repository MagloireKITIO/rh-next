import { IsOptional, IsString, IsEnum, IsNumber, IsBoolean, IsDateString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { LoginStatus, DeviceType } from '../entities/login-audit.entity';

export class CreateLoginAuditDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsUUID()
  company_id: string;

  @IsString()
  email_attempt: string;

  @IsEnum(LoginStatus)
  status: LoginStatus;

  @IsOptional()
  @IsString()
  failure_reason?: string;

  @IsString()
  ip_address: string;

  @IsOptional()
  @IsString()
  user_agent?: string;

  @IsOptional()
  @IsEnum(DeviceType)
  device_type?: DeviceType;

  @IsOptional()
  @IsString()
  browser?: string;

  @IsOptional()
  @IsString()
  operating_system?: string;

  @IsOptional()
  @IsString()
  location_country?: string;

  @IsOptional()
  @IsString()
  location_city?: string;

  @IsOptional()
  @IsString()
  location_region?: string;

  @IsOptional()
  @IsNumber()
  location_latitude?: number;

  @IsOptional()
  @IsNumber()
  location_longitude?: number;

  @IsOptional()
  @IsNumber()
  session_duration_seconds?: number;

  @IsOptional()
  @IsString()
  session_token?: string;

  @IsOptional()
  @IsBoolean()
  is_suspicious?: boolean;

  @IsOptional()
  @IsString()
  suspicious_reasons?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class LoginAuditQueryDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsEnum(LoginStatus)
  status?: LoginStatus;

  @IsOptional()
  @IsString()
  email_attempt?: string;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsEnum(DeviceType)
  device_type?: DeviceType;

  @IsOptional()
  @IsBoolean()
  is_suspicious?: boolean;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 50;

  @IsOptional()
  @IsString()
  search?: string;
}

export class LoginAuditStatsDto {
  total_attempts: number;
  successful_logins: number;
  failed_attempts: number;
  suspicious_activities: number;
  unique_users: number;
  unique_ips: number;
  success_rate: number;
}