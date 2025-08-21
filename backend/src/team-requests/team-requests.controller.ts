import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TeamRequestsService } from './team-requests.service';
import { CreateTeamRequestDto } from './dto/create-team-request.dto';
import { ProcessTeamRequestDto } from './dto/process-team-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyGuard } from '../auth/guards/company.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentCompany } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/entities/user.entity';

// Contrôleur pour les demandes d'équipe (nécessite authentification)
@Controller('team-requests')
@UseGuards(JwtAuthGuard, CompanyGuard)
export class TeamRequestsController {
  constructor(private readonly teamRequestsService: TeamRequestsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseGuards(RolesGuard)
  findAll(@CurrentCompany() companyId: string) {
    return this.teamRequestsService.findAllForCompany(companyId);
  }

  @Get('notifications-count')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseGuards(RolesGuard)
  getNotificationsCount(@CurrentCompany() companyId: string) {
    return this.teamRequestsService.getNotificationsCount(companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseGuards(RolesGuard)
  findOne(@Param('id') id: string, @CurrentCompany() companyId: string) {
    return this.teamRequestsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  process(
    @Param('id') id: string,
    @Body() processTeamRequestDto: ProcessTeamRequestDto,
    @CurrentCompany() companyId: string,
    @CurrentUser() user: any
  ) {
    return this.teamRequestsService.process(id, processTeamRequestDto, companyId, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string, @CurrentCompany() companyId: string) {
    return this.teamRequestsService.remove(id, companyId);
  }
}

// Contrôleur public pour soumettre des demandes
@Controller('public/team-requests')
export class PublicTeamRequestsController {
  constructor(private readonly teamRequestsService: TeamRequestsService) {}

  @Post()
  create(@Body() createTeamRequestDto: CreateTeamRequestDto) {
    return this.teamRequestsService.create(createTeamRequestDto);
  }
}