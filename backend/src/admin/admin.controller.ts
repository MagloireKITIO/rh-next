import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard & Stats
  @Get('stats')
  async getGlobalStats() {
    return this.adminService.getGlobalStats();
  }

  @Get('companies/stats')
  async getCompaniesStats() {
    return this.adminService.getCompaniesStats();
  }

  @Get('companies/automation-stats')
  async getCompaniesAutomationStats() {
    return this.adminService.getCompaniesAutomationStats();
  }

  // Companies Management
  @Get('companies')
  async getAllCompanies() {
    return this.adminService.getAllCompanies();
  }

  @Get('companies/:id')
  async getCompanyById(@Param('id') id: string) {
    return this.adminService.getCompanyById(id);
  }

  @Post('companies')
  async createCompany(
    @Body() createCompanyDto: { name: string; domain: string; description?: string },
    @CurrentUser() user: User
  ) {
    return this.adminService.createCompany(createCompanyDto, user.id);
  }

  @Patch('companies/:id')
  async updateCompany(
    @Param('id') id: string,
    @Body() updateData: any
  ) {
    return this.adminService.updateCompany(id, updateData);
  }

  @Delete('companies/:id')
  async deleteCompany(@Param('id') id: string) {
    return this.adminService.deleteCompany(id);
  }

  @Patch('companies/:id/toggle')
  async toggleCompanyStatus(@Param('id') id: string) {
    return this.adminService.toggleCompanyStatus(id);
  }

  // Users Management
  @Get('users')
  async getAllUsers(@Query('company') companyId?: string) {
    if (companyId) {
      return this.adminService.getUsersByCompany(companyId);
    }
    return this.adminService.getAllUsers();
  }

  @Get('users/company/:companyId')
  async getUsersByCompany(@Param('companyId') companyId: string) {
    return this.adminService.getUsersByCompany(companyId);
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  async createUser(
    @Body() createUserDto: {
      email: string;
      name: string;
      role: string;
      company_id?: string;
    }
  ) {
    return this.adminService.createUser(createUserDto);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: any
  ) {
    return this.adminService.updateUser(id, updateData);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id/toggle')
  async toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }

  @Post('users/:id/resend-invitation')
  async resendUserInvitation(@Param('id') id: string) {
    return this.adminService.resendUserInvitation(id);
  }

  // Projects Management (Global view)
  @Get('projects')
  async getAllProjects(@Query('company') companyId?: string) {
    if (companyId) {
      return this.adminService.getProjectsByCompany(companyId);
    }
    return this.adminService.getAllProjects();
  }

  @Get('projects/company/:companyId')
  async getProjectsByCompany(@Param('companyId') companyId: string) {
    return this.adminService.getProjectsByCompany(companyId);
  }

  // API Keys Management
  @Get('api-keys')
  async getAllApiKeys() {
    return this.adminService.getAllApiKeys();
  }

  @Get('api-keys/stats')
  async getApiKeysStats() {
    return this.adminService.getApiKeysStats();
  }

  @Get('api-keys/:id')
  async getApiKeyById(@Param('id') id: string) {
    return this.adminService.getApiKeyById(id);
  }

  @Post('api-keys')
  async createApiKey(
    @Body() createApiKeyDto: {
      key: string;
      name?: string;
      provider?: string;
      company_id?: string;
    }
  ) {
    return this.adminService.createApiKey(createApiKeyDto);
  }

  @Patch('api-keys/:id')
  async updateApiKey(
    @Param('id') id: string,
    @Body() updateData: {
      key?: string;
      name?: string;
      company_id?: string;
      provider?: string;
    }
  ) {
    return this.adminService.updateApiKey(id, updateData);
  }

  @Delete('api-keys/:id')
  async deleteApiKey(@Param('id') id: string) {
    return this.adminService.deleteApiKey(id);
  }

  @Patch('api-keys/:id/toggle')
  async toggleApiKeyStatus(@Param('id') id: string) {
    return this.adminService.toggleApiKeyStatus(id);
  }

  // System Settings
  @Get('settings')
  async getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Patch('settings')
  async updateSystemSettings(@Body() settings: any) {
    return this.adminService.updateSystemSettings(settings);
  }

  // Mail Automations Management
  @Get('mail-automations/stats')
  async getMailAutomationStats() {
    return this.adminService.getMailAutomationStats();
  }

  @Get('mail-automations')
  async getAllMailAutomations() {
    return this.adminService.getAllMailAutomations();
  }

  @Get('mail-automations/:id')
  async getMailAutomationById(@Param('id') id: string) {
    return this.adminService.getMailAutomationById(id);
  }

  @Post('mail-automations')
  async createMailAutomation(@Body() createDto: any) {
    return this.adminService.createMailAutomation(createDto);
  }

  @Patch('mail-automations/:id')
  async updateMailAutomation(@Param('id') id: string, @Body() updateDto: any) {
    return this.adminService.updateMailAutomation(id, updateDto);
  }

  @Delete('mail-automations/:id')
  async deleteMailAutomation(@Param('id') id: string) {
    return this.adminService.deleteMailAutomation(id);
  }

  @Patch('mail-automations/:id/toggle')
  async toggleMailAutomationStatus(@Param('id') id: string) {
    return this.adminService.toggleMailAutomationStatus(id);
  }

  // Mail Templates for automation
  @Get('mail-templates')
  async getMailTemplates() {
    return this.adminService.getMailTemplates();
  }

  // OpenRouter Models Management
  @Get('api-keys/:keyId/openrouter/models')
  async getOpenRouterModels(
    @Param('keyId') keyId: string,
    @Query('modality') modality?: string,
    @Query('provider') provider?: string,
    @Query('maxContextLength') maxContextLength?: string
  ) {
    const filters = {
      ...(modality && { modality }),
      ...(provider && { provider }),
      ...(maxContextLength && { maxContextLength: parseInt(maxContextLength) }),
    };

    return this.adminService.getOpenRouterModels(keyId, Object.keys(filters).length > 0 ? filters : undefined);
  }

  @Get('api-keys/:keyId/openrouter/providers')
  async getOpenRouterProviders(@Param('keyId') keyId: string) {
    return this.adminService.getOpenRouterProviders(keyId);
  }

  @Get('api-keys/:keyId/openrouter/models/:modelId')
  async getOpenRouterModelById(
    @Param('keyId') keyId: string,
    @Param('modelId') modelId: string
  ) {
    return this.adminService.getOpenRouterModelById(keyId, modelId);
  }

  // API Key Model Configuration Management
  @Get('api-keys/:keyId/model-config')
  async getApiKeyModelConfig(@Param('keyId') keyId: string) {
    return this.adminService.getApiKeyModelConfig(keyId);
  }

  @Post('api-keys/:keyId/model-config')
  async createModelConfig(
    @Param('keyId') keyId: string,
    @Body() configData: {
      primaryModel: string;
      fallbackModel1?: string;
      fallbackModel2?: string;
      fallbackModel3?: string;
      notes?: string;
    }
  ) {
    return this.adminService.createOrUpdateModelConfig(keyId, configData);
  }

  @Patch('api-keys/:keyId/model-config')
  async updateModelConfig(
    @Param('keyId') keyId: string,
    @Body() configData: {
      primaryModel?: string;
      fallbackModel1?: string;
      fallbackModel2?: string;
      fallbackModel3?: string;
      notes?: string;
    }
  ) {
    return this.adminService.createOrUpdateModelConfig(keyId, configData);
  }

  @Delete('api-keys/:keyId/model-config')
  async deleteModelConfig(@Param('keyId') keyId: string) {
    return this.adminService.deleteModelConfig(keyId);
  }

  @Get('model-configs')
  async getAllModelConfigs() {
    return this.adminService.getAllModelConfigs();
  }

  @Get('model-configs/stats')
  async getModelConfigStats() {
    return this.adminService.getModelConfigStats();
  }
}