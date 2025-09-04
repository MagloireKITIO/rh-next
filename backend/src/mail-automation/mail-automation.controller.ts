import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MailAutomationService } from './services/mail-automation.service';
import { CreateMailAutomationDto } from './dto/create-mail-automation.dto';
import { UpdateMailAutomationDto } from './dto/update-mail-automation.dto';

@Controller('mail-automations')
@UseGuards(JwtAuthGuard)
export class MailAutomationController {
  constructor(private readonly mailAutomationService: MailAutomationService) {}

  @Post()
  async create(@Body() createDto: CreateMailAutomationDto, @Request() req) {
    const userId = req.user.id;
    const userCompanyId = req.user.company_id;

    // Vérifier que l'utilisateur crée l'automatisation pour sa propre entreprise
    if (createDto.company_id !== userCompanyId) {
      throw new BadRequestException('Vous ne pouvez créer des automatisations que pour votre entreprise');
    }

    return this.mailAutomationService.create(createDto, userId);
  }

  @Get()
  async findAll(@Query('include_inactive') includeInactive: string, @Request() req) {
    const companyId = req.user.company_id;
    const includeInactiveFlag = includeInactive === 'true';
    
    return this.mailAutomationService.findAll(companyId, includeInactiveFlag);
  }

  @Get('stats')
  async getStats(@Request() req) {
    const companyId = req.user.company_id;
    return this.mailAutomationService.getCompanyStats(companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const automation = await this.mailAutomationService.findOne(id);
    
    // Vérifier que l'automatisation appartient à la même entreprise
    if (automation.company_id !== req.user.company_id) {
      throw new BadRequestException('Automatisation non accessible');
    }

    return automation;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateMailAutomationDto, @Request() req) {
    const userId = req.user.id;
    
    // Vérifier l'accès à l'automatisation
    const automation = await this.mailAutomationService.findOne(id);
    if (automation.company_id !== req.user.company_id) {
      throw new BadRequestException('Automatisation non accessible');
    }

    return this.mailAutomationService.update(id, updateDto, userId);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    
    // Vérifier l'accès à l'automatisation
    const automation = await this.mailAutomationService.findOne(id);
    if (automation.company_id !== req.user.company_id) {
      throw new BadRequestException('Automatisation non accessible');
    }

    return this.mailAutomationService.toggleStatus(id, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    
    // Vérifier l'accès à l'automatisation
    const automation = await this.mailAutomationService.findOne(id);
    if (automation.company_id !== req.user.company_id) {
      throw new BadRequestException('Automatisation non accessible');
    }

    await this.mailAutomationService.remove(id, userId);
    return { message: 'Automatisation supprimée avec succès' };
  }
}