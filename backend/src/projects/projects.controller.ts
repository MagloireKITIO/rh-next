import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyGuard } from '../auth/guards/company.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentCompany } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('projects')
@UseGuards(JwtAuthGuard, CompanyGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseGuards(RolesGuard)
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentCompany() companyId: string,
    @CurrentUser() user: any
  ) {
    return this.projectsService.create(createProjectDto, companyId, user.id);
  }

  @Get()
  findAll(@CurrentCompany() companyId: string) {
    return this.projectsService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentCompany() companyId: string) {
    console.log('🎯 [PROJECTS CONTROLLER] findOne called:', {
      projectId: id,
      companyId: companyId
    });
    return this.projectsService.findOne(id, companyId);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string, @CurrentCompany() companyId: string) {
    return this.projectsService.getProjectStats(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseGuards(RolesGuard)
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentCompany() companyId: string
  ) {
    return this.projectsService.update(id, updateProjectDto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string, @CurrentCompany() companyId: string) {
    return this.projectsService.remove(id, companyId);
  }

  @Post(':id/share')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseGuards(RolesGuard)
  generateShareLink(
    @Param('id') id: string, 
    @CurrentCompany() companyId: string,
    @Body('expirationDays') expirationDays?: number
  ) {
    return this.projectsService.generateShareLink(id, companyId, expirationDays);
  }

  @Delete(':id/share')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseGuards(RolesGuard)
  revokeShare(@Param('id') id: string, @CurrentCompany() companyId: string) {
    return this.projectsService.revokeShare(id, companyId);
  }
}

// Contrôleur séparé pour l'accès public
@Controller('public/projects')
export class PublicProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('shared/:token')
  getSharedProject(@Param('token') token: string) {
    return this.projectsService.getSharedProject(token);
  }
}