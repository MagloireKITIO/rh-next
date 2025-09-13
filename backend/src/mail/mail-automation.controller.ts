import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { MailAutomationService } from './mail-automation.service';
import { CreateMailAutomationDto, UpdateMailAutomationDto } from './dto/create-automation.dto';

@Controller('admin/mail-automations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR)
export class MailAutomationController {
  constructor(private readonly mailAutomationService: MailAutomationService) {}

  @Get()
  async findAll(@Request() req) {
    const automations = await this.mailAutomationService.findAll(
      req.user.role,
      req.user.company_id,
    );
    return { data: automations };
  }

  @Get('stats')
  async getStats(@Request() req) {
    const stats = await this.mailAutomationService.getStats(
      req.user.role,
      req.user.company_id,
    );
    return { data: stats };
  }

  @Get('logs')
  async getRecentLogs(@Request() req) {
    const logs = await this.mailAutomationService.getRecentLogs(
      req.user.role,
      req.user.company_id,
    );
    return { data: logs };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const automation = await this.mailAutomationService.findOne(
      id,
      req.user.role,
      req.user.company_id,
    );
    return { data: automation };
  }

  @Post()
  async create(@Body() createDto: CreateMailAutomationDto, @Request() req) {
    const automation = await this.mailAutomationService.create(
      createDto,
      req.user.id,
      req.user.role,
      req.user.company_id,
    );
    return { 
      data: automation, 
      message: 'Automatisation créée avec succès' 
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMailAutomationDto,
    @Request() req,
  ) {
    const automation = await this.mailAutomationService.update(
      id,
      updateDto,
      req.user.role,
      req.user.company_id,
    );
    return { 
      data: automation, 
      message: 'Automatisation mise à jour avec succès' 
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.mailAutomationService.remove(
      id,
      req.user.role,
      req.user.company_id,
    );
    return result;
  }

  @Patch(':id/toggle')
  async toggleStatus(@Param('id') id: string, @Request() req) {
    const automation = await this.mailAutomationService.toggleStatus(
      id,
      req.user.role,
      req.user.company_id,
    );
    return {
      data: automation,
      message: `Automatisation ${automation.is_active ? 'activée' : 'désactivée'} avec succès`,
    };
  }

  @Get('available-variables/:entityType')
  async getAvailableVariables(@Param('entityType') entityType: string, @Request() req) {
    const variables = await this.mailAutomationService.getAvailableVariables(entityType);
    return { data: variables };
  }
}

// Contrôleur pour les utilisateurs normaux (HR/Admin)
@Controller('mail-automations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.HR)
export class UserMailAutomationController {
  constructor(private readonly mailAutomationService: MailAutomationService) {}

  @Get()
  async findAll(@Request() req) {
    const automations = await this.mailAutomationService.findAll(
      req.user.role,
      req.user.company_id,
    );
    return { data: automations };
  }

  @Get('stats')
  async getStats(@Request() req) {
    const stats = await this.mailAutomationService.getStats(
      req.user.role,
      req.user.company_id,
    );
    return { data: stats };
  }

  @Get('logs')
  async getRecentLogs(@Request() req) {
    const logs = await this.mailAutomationService.getRecentLogs(
      req.user.role,
      req.user.company_id,
    );
    return { data: logs };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const automation = await this.mailAutomationService.findOne(
      id,
      req.user.role,
      req.user.company_id,
    );
    return { data: automation };
  }

  @Post()
  async create(@Body() createDto: CreateMailAutomationDto, @Request() req) {
    const automation = await this.mailAutomationService.create(
      createDto,
      req.user.id,
      req.user.role,
      req.user.company_id,
    );
    return { 
      data: automation, 
      message: 'Automatisation créée avec succès' 
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMailAutomationDto,
    @Request() req,
  ) {
    const automation = await this.mailAutomationService.update(
      id,
      updateDto,
      req.user.role,
      req.user.company_id,
    );
    return { 
      data: automation, 
      message: 'Automatisation mise à jour avec succès' 
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.mailAutomationService.remove(
      id,
      req.user.role,
      req.user.company_id,
    );
    return result;
  }

  @Patch(':id/toggle')
  async toggleStatus(@Param('id') id: string, @Request() req) {
    const automation = await this.mailAutomationService.toggleStatus(
      id,
      req.user.role,
      req.user.company_id,
    );
    return {
      data: automation,
      message: `Automatisation ${automation.is_active ? 'activée' : 'désactivée'} avec succès`,
    };
  }

  @Get('available-variables/:entityType')
  async getAvailableVariables(@Param('entityType') entityType: string, @Request() req) {
    const variables = await this.mailAutomationService.getAvailableVariables(entityType);
    return { data: variables };
  }
}