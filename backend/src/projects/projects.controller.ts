import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post(':id/offer-document')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('document'))
  async uploadOfferDocument(
    @Param('id') id: string,
    @CurrentCompany() companyId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.projectsService.uploadOfferDocument(id, companyId, file);
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

  @Get('shared/:token/candidates')
  getSharedProjectCandidates(
    @Param('token') token: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('scoreFilter') scoreFilter?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const pageLimit = limit ? parseInt(limit, 10) : 20;
    
    const filters = {
      search,
      status,
      scoreFilter
    };
    
    return this.projectsService.getSharedProjectCandidates(token, pageNumber, pageLimit, filters);
  }
}

// Contrôleur pour les offres d'emploi publiques
@Controller('public/job-offers')
export class PublicJobOffersController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  getActiveJobOffers(@Query('company') companyId?: string) {
    return this.projectsService.getActiveJobOffers(companyId);
  }

  @Get(':id')
  getJobOffer(@Param('id') id: string) {
    return this.projectsService.getJobOffer(id);
  }

  @Post(':id/apply')
  @UseInterceptors(FileInterceptor('cv'))
  applyToJobOffer(
    @Param('id') id: string, 
    @UploadedFile() file: Express.Multer.File,
    @Body() applicationData: any
  ) {
    return this.projectsService.applyToJobOffer(id, file, applicationData);
  }
}