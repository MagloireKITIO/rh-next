import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Put, Delete, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, InviteUserDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CompanyGuard } from '../auth/guards/company.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentCompany } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('companies')
@UseGuards(JwtAuthGuard, CompanyGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('current')
  findCurrent(@CurrentCompany() companyId: string) {
    return this.companiesService.findOne(companyId);
  }

  @Patch('current')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  updateCurrent(@CurrentCompany() companyId: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(companyId, updateCompanyDto);
  }

  @Get('current/users')
  @Roles(UserRole.ADMIN, UserRole.HR)
  @UseGuards(RolesGuard)
  getUsers(
    @CurrentCompany() companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const pageLimit = limit ? parseInt(limit, 10) : 50;
    
    return this.companiesService.getUsers(companyId, pageNumber, pageLimit);
  }

  @Post('current/invite')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  inviteUser(@CurrentCompany() companyId: string, @Body() inviteUserDto: InviteUserDto) {
    return this.companiesService.inviteUser(companyId, inviteUserDto);
  }

  @Put('current/users/:userId/role')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  updateUserRole(
    @CurrentCompany() companyId: string,
    @Param('userId') userId: string,
    @Body('role') role: UserRole,
  ) {
    return this.companiesService.updateUserRole(companyId, userId, role);
  }

  @Put('current/users/:userId/deactivate')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  deactivateUser(@CurrentCompany() companyId: string, @Param('userId') userId: string) {
    return this.companiesService.deactivateUser(companyId, userId);
  }

  @Put('current/users/:userId/reactivate')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  reactivateUser(@CurrentCompany() companyId: string, @Param('userId') userId: string) {
    return this.companiesService.reactivateUser(companyId, userId);
  }

  @Post('current/users/:userId/resend-invitation')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  resendInvitation(@CurrentCompany() companyId: string, @Param('userId') userId: string) {
    return this.companiesService.resendInvitation(companyId, userId);
  }

  @Delete('current/users/:userId')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  deleteUser(@CurrentCompany() companyId: string, @Param('userId') userId: string) {
    return this.companiesService.deleteUser(companyId, userId);
  }
}