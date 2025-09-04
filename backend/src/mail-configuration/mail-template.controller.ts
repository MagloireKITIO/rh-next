import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe
} from '@nestjs/common';
import { MailTemplateService } from './mail-template.service';
import { CreateMailTemplateDto } from './dto/create-mail-template.dto';
import { UpdateMailTemplateDto } from './dto/update-mail-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { MailTemplateType, MailTemplateContext } from './entities/mail-template.entity';

@Controller('mail-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MailTemplateController {
  constructor(private readonly mailTemplateService: MailTemplateService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR)
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('context') context?: MailTemplateContext
  ) {
    return await this.mailTemplateService.findAll(companyId, context);
  }

  @Get('types')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR)
  async getTemplateTypes() {
    return await this.mailTemplateService.getTemplateTypes();
  }

  @Get('by-type/:type')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR)
  async findByType(
    @Param('type') type: MailTemplateType,
    @Query('companyId') companyId?: string
  ) {
    return await this.mailTemplateService.findByType(type, companyId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.mailTemplateService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR)
  async create(@Body() createDto: CreateMailTemplateDto) {
    return await this.mailTemplateService.create(createDto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMailTemplateDto
  ) {
    return await this.mailTemplateService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.mailTemplateService.remove(id);
    return { message: 'Template supprimé avec succès' };
  }

  @Post(':id/duplicate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('name') name?: string
  ) {
    return await this.mailTemplateService.duplicate(id, name);
  }

  @Post(':id/set-default')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async setAsDefault(@Param('id', ParseUUIDPipe) id: string) {
    return await this.mailTemplateService.setAsDefault(id);
  }

  @Post(':id/preview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async previewTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('variables') variables: Record<string, any> = {}
  ) {
    return await this.mailTemplateService.previewTemplate(id, variables);
  }
}