import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { LoginAudit, LoginStatus, DeviceType } from './entities/login-audit.entity';
import { CreateLoginAuditDto, LoginAuditQueryDto, LoginAuditStatsDto } from './dto/login-audit.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    @InjectRepository(LoginAudit)
    private loginAuditRepository: Repository<LoginAudit>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Enregistre une tentative de connexion dans le journal d'audit
   */
  async logLoginAttempt(dto: CreateLoginAuditDto): Promise<LoginAudit> {
    try {
      // Parse User Agent pour extraire des informations
      const deviceInfo = this.parseUserAgent(dto.user_agent);

      // Détecter les activités suspectes
      const suspiciousAnalysis = await this.analyzeSuspiciousActivity(dto);

      const loginAudit = this.loginAuditRepository.create({
        ...dto,
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        operating_system: deviceInfo.os,
        is_suspicious: suspiciousAnalysis.isSuspicious,
        suspicious_reasons: suspiciousAnalysis.reasons,
      });

      const savedAudit = await this.loginAuditRepository.save(loginAudit);

      this.logger.log(`Login attempt logged: ${dto.email_attempt} from ${dto.ip_address} - Status: ${dto.status}`);

      if (suspiciousAnalysis.isSuspicious) {
        this.logger.warn(`Suspicious login detected: ${dto.email_attempt} from ${dto.ip_address} - Reasons: ${suspiciousAnalysis.reasons}`);
      }

      return savedAudit;
    } catch (error) {
      this.logger.error(`Failed to log login attempt: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupère les logs d'audit avec filtres et pagination
   */
  async getLoginAuditLogs(companyId: string, query: LoginAuditQueryDto) {
    try {
      console.log('🔍 [SECURITY SERVICE] getLoginAuditLogs called with companyId:', companyId);
      console.log('🔍 [SECURITY SERVICE] Query:', query);

      const {
        page = 1,
        limit = 50,
        status,
        user_id,
        email_attempt,
        ip_address,
        device_type,
        is_suspicious,
        date_from,
        date_to,
        search
      } = query;

      // First, let's check how many records exist total
      const totalRecords = await this.loginAuditRepository.count();
      console.log('🔍 [SECURITY SERVICE] Total records in login_audit table:', totalRecords);

      // Check records for this company
      let companyRecords;
      if (companyId === null || companyId === undefined) {
        companyRecords = totalRecords; // Super admin voit tout
      } else {
        companyRecords = await this.loginAuditRepository.count({
          where: { company_id: companyId }
        });
      }
      console.log('🔍 [SECURITY SERVICE] Records for company', companyId, ':', companyRecords);

      const queryBuilder = this.loginAuditRepository
        .createQueryBuilder('audit')
        .leftJoinAndSelect('audit.user', 'user')
        .leftJoinAndSelect('audit.company', 'company');

      // Gérer le cas où companyId est null (super admin)
      if (companyId === null || companyId === undefined) {
        // Pour un super admin, on veut voir TOUS les logs de toutes les entreprises
        console.log('🔍 [SECURITY SERVICE] Super admin detected - showing ALL logs');
        // Pas de filtre par company_id pour les super admins
      } else {
        queryBuilder.where('audit.company_id = :companyId', { companyId });
      }

      // Filtres
      if (status) {
        queryBuilder.andWhere('audit.status = :status', { status });
      }

      if (user_id) {
        queryBuilder.andWhere('audit.user_id = :user_id', { user_id });
      }

      if (email_attempt) {
        queryBuilder.andWhere('audit.email_attempt ILIKE :email_attempt', {
          email_attempt: `%${email_attempt}%`
        });
      }

      if (ip_address) {
        queryBuilder.andWhere('audit.ip_address ILIKE :ip_address', {
          ip_address: `%${ip_address}%`
        });
      }

      if (device_type) {
        queryBuilder.andWhere('audit.device_type = :device_type', { device_type });
      }

      if (is_suspicious !== undefined) {
        queryBuilder.andWhere('audit.is_suspicious = :is_suspicious', { is_suspicious });
      }

      if (date_from && date_to) {
        queryBuilder.andWhere('audit.created_at BETWEEN :date_from AND :date_to', {
          date_from: new Date(date_from),
          date_to: new Date(date_to)
        });
      }

      if (search) {
        queryBuilder.andWhere(
          '(audit.email_attempt ILIKE :search OR audit.ip_address ILIKE :search OR user.name ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Pagination et tri
      queryBuilder
        .orderBy('audit.created_at', 'DESC')
        .limit(limit)
        .offset((page - 1) * limit);

      const [logs, total] = await queryBuilder.getManyAndCount();

      console.log('🔍 [SECURITY SERVICE] Query result - total:', total, 'logs length:', logs.length);
      console.log('🔍 [SECURITY SERVICE] First log sample:', logs[0] ? {
        id: logs[0].id,
        email_attempt: logs[0].email_attempt,
        status: logs[0].status,
        ip_address: logs[0].ip_address,
        company_id: logs[0].company_id,
        created_at: logs[0].created_at
      } : 'No logs');

      return {
        data: logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to get login audit logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupère les statistiques d'audit pour une entreprise
   */
  async getLoginAuditStats(companyId: string, dateFrom?: Date, dateTo?: Date): Promise<LoginAuditStatsDto> {
    try {
      console.log('🔍 [SECURITY SERVICE] getLoginAuditStats called with companyId:', companyId);

      const queryBuilder = this.loginAuditRepository
        .createQueryBuilder('audit');

      // Gérer le cas où companyId est null (super admin)
      if (companyId === null || companyId === undefined) {
        console.log('🔍 [SECURITY SERVICE] Super admin stats - showing ALL stats');
        // Pas de filtre par company_id pour les super admins
      } else {
        queryBuilder.where('audit.company_id = :companyId', { companyId });
      }

      if (dateFrom && dateTo) {
        queryBuilder.andWhere('audit.created_at BETWEEN :dateFrom AND :dateTo', {
          dateFrom,
          dateTo
        });
      }

      const [
        totalAttempts,
        successfulLogins,
        failedAttempts,
        suspiciousActivities,
        uniqueUsers,
        uniqueIps
      ] = await Promise.all([
        queryBuilder.getCount(),
        queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.SUCCESS }).getCount(),
        queryBuilder.clone().andWhere('audit.status = :status', { status: LoginStatus.FAILED }).getCount(),
        queryBuilder.clone().andWhere('audit.is_suspicious = true').getCount(),
        queryBuilder.clone().select('COUNT(DISTINCT audit.user_id)').getRawOne().then(r => parseInt(r.count)),
        queryBuilder.clone().select('COUNT(DISTINCT audit.ip_address)').getRawOne().then(r => parseInt(r.count))
      ]);

      console.log('🔍 [SECURITY SERVICE] Stats breakdown:', {
        totalAttempts,
        successfulLogins,
        failedAttempts,
        suspiciousActivities,
        uniqueUsers,
        uniqueIps
      });

      const successRate = totalAttempts > 0 ? (successfulLogins / totalAttempts) * 100 : 0;

      return {
        total_attempts: totalAttempts,
        successful_logins: successfulLogins,
        failed_attempts: failedAttempts,
        suspicious_activities: suspiciousActivities,
        unique_users: uniqueUsers,
        unique_ips: uniqueIps,
        success_rate: Math.round(successRate * 100) / 100
      };
    } catch (error) {
      this.logger.error(`Failed to get login audit stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Met à jour la durée de session lors de la déconnexion
   */
  async updateSessionDuration(sessionToken: string, durationSeconds: number): Promise<void> {
    try {
      await this.loginAuditRepository.update(
        { session_token: sessionToken, status: LoginStatus.SUCCESS },
        { session_duration_seconds: durationSeconds }
      );
    } catch (error) {
      this.logger.error(`Failed to update session duration: ${error.message}`, error.stack);
    }
  }

  /**
   * Parse le User Agent pour extraire des informations sur l'appareil
   */
  private parseUserAgent(userAgent?: string): { deviceType: DeviceType; browser?: string; os?: string } {
    if (!userAgent) {
      return { deviceType: DeviceType.UNKNOWN };
    }

    const ua = userAgent.toLowerCase();
    let deviceType = DeviceType.UNKNOWN;
    let browser: string | undefined;
    let os: string | undefined;

    // Détection du type d'appareil
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      deviceType = DeviceType.MOBILE;
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = DeviceType.TABLET;
    } else {
      deviceType = DeviceType.DESKTOP;
    }

    // Détection du navigateur
    if (ua.includes('chrome') && !ua.includes('edg')) {
      browser = 'Chrome';
    } else if (ua.includes('firefox')) {
      browser = 'Firefox';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'Safari';
    } else if (ua.includes('edg')) {
      browser = 'Edge';
    } else if (ua.includes('opera')) {
      browser = 'Opera';
    }

    // Détection du système d'exploitation
    if (ua.includes('windows')) {
      os = 'Windows';
    } else if (ua.includes('mac os') || ua.includes('macos')) {
      os = 'macOS';
    } else if (ua.includes('linux')) {
      os = 'Linux';
    } else if (ua.includes('android')) {
      os = 'Android';
    } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
      os = 'iOS';
    }

    return { deviceType, browser, os };
  }

  /**
   * Analyse les activités suspectes
   */
  private async analyzeSuspiciousActivity(dto: CreateLoginAuditDto): Promise<{ isSuspicious: boolean; reasons: string }> {
    const suspiciousReasons: string[] = [];

    try {
      // Vérifier les tentatives de connexion en dehors des heures normales (20h - 6h)
      const hour = new Date().getHours();
      if (hour >= 22 || hour <= 6) {
        suspiciousReasons.push('Connexion en dehors des heures habituelles');
      }

      // Vérifier les tentatives multiples depuis la même IP
      if (dto.status === LoginStatus.FAILED) {
        const recentFailures = await this.loginAuditRepository.count({
          where: {
            ip_address: dto.ip_address,
            status: LoginStatus.FAILED,
            created_at: Between(new Date(Date.now() - 15 * 60 * 1000), new Date()) // 15 minutes
          }
        });

        if (recentFailures >= 3) {
          suspiciousReasons.push('Tentatives multiples échouées depuis la même IP');
        }
      }

      // Vérifier les nouvelles géolocalisations pour un utilisateur existant
      if (dto.user_id && dto.status === LoginStatus.SUCCESS) {
        const recentLocations = await this.loginAuditRepository.find({
          where: {
            user_id: dto.user_id,
            status: LoginStatus.SUCCESS,
            created_at: Between(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()) // 30 jours
          },
          select: ['location_country', 'location_city']
        });

        const hasBeenInThisLocation = recentLocations.some(
          location => location.location_country === dto.location_country &&
                     location.location_city === dto.location_city
        );

        if (recentLocations.length > 0 && !hasBeenInThisLocation && dto.location_country) {
          suspiciousReasons.push('Connexion depuis une nouvelle géolocalisation');
        }
      }

      // Vérifier les adresses IP inhabituelles
      if (this.isPrivateIP(dto.ip_address) && dto.location_country && dto.location_country !== 'Unknown') {
        suspiciousReasons.push('Incohérence entre IP privée et géolocalisation');
      }

    } catch (error) {
      this.logger.error(`Error analyzing suspicious activity: ${error.message}`);
    }

    return {
      isSuspicious: suspiciousReasons.length > 0,
      reasons: suspiciousReasons.join('; ')
    };
  }

  /**
   * Vérifie si une IP est privée
   */
  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./
    ];

    return privateRanges.some(range => range.test(ip));
  }
}