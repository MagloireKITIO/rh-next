import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { SecurityService } from './security.service';
import { CreateLoginAuditDto, LoginAuditQueryDto } from './dto/login-audit.dto';

@Controller('admin/security')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  /**
   * Récupère les logs d'audit des connexions
   */
  @Get('login-audit')
  async getLoginAuditLogs(
    @Request() req,
    @Query() query: LoginAuditQueryDto
  ) {
    const user = req.user as any;
    console.log('🔍 [SECURITY CONTROLLER] getLoginAuditLogs called');
    console.log('🔍 [SECURITY CONTROLLER] User:', { id: user.id, email: user.email, company_id: user.company_id, role: user.role });
    console.log('🔍 [SECURITY CONTROLLER] Query:', query);

    const result = await this.securityService.getLoginAuditLogs(user.company_id, query);
    console.log('🔍 [SECURITY CONTROLLER] Result:', { total: result.total, dataLength: result.data?.length });

    return result;
  }

  /**
   * Récupère les statistiques d'audit des connexions
   */
  @Get('login-audit/stats')
  async getLoginAuditStats(
    @Request() req,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string
  ) {
    const user = req.user as any;
    console.log('🔍 [SECURITY CONTROLLER] getLoginAuditStats called');
    console.log('🔍 [SECURITY CONTROLLER] User company_id:', user.company_id);

    const parsedDateFrom = dateFrom ? new Date(dateFrom) : undefined;
    const parsedDateTo = dateTo ? new Date(dateTo) : undefined;

    const result = await this.securityService.getLoginAuditStats(user.company_id, parsedDateFrom, parsedDateTo);
    console.log('🔍 [SECURITY CONTROLLER] Stats result:', result);

    return result;
  }

  /**
   * Enregistre manuellement une tentative de connexion (pour tests)
   */
  @Post('login-audit')
  async logLoginAttempt(
    @Request() req,
    @Body() createLoginAuditDto: CreateLoginAuditDto
  ) {
    const user = req.user as any;

    // S'assurer que le company_id correspond à celui de l'utilisateur
    const dto = {
      ...createLoginAuditDto,
      company_id: user.company_id
    };

    return this.securityService.logLoginAttempt(dto);
  }
}