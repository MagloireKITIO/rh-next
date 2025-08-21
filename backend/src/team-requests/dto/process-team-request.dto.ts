import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TeamRequestStatus } from '../entities/team-request.entity';

export class ProcessTeamRequestDto {
  @IsEnum(TeamRequestStatus)
  status: TeamRequestStatus.APPROVED | TeamRequestStatus.REJECTED;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  rejection_reason?: string;
}