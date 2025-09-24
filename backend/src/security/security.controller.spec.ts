import { Test, TestingModule } from '@nestjs/testing';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../auth/entities/user.entity';
import { LoginStatus, DeviceType } from './entities/login-audit.entity';
import { CreateLoginAuditDto, LoginAuditQueryDto } from './dto/login-audit.dto';

describe('SecurityController', () => {
  let controller: SecurityController;
  let service: SecurityService;

  const mockSecurityService = {
    getLoginAuditLogs: jest.fn(),
    getLoginAuditStats: jest.fn(),
    logLoginAttempt: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      email: 'admin@company.com',
      company_id: 'company-123',
      role: UserRole.ADMIN,
    },
  };

  const mockSuperAdminRequest = {
    user: {
      id: 'super-admin-123',
      email: 'superadmin@platform.com',
      company_id: 'company-456',
      role: UserRole.SUPER_ADMIN,
    },
  };

  const mockLoginAuditLog = {
    id: 'audit-123',
    user_id: 'user-123',
    company_id: 'company-123',
    email_attempt: 'user@company.com',
    status: LoginStatus.SUCCESS,
    failure_reason: null,
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0',
    device_type: DeviceType.DESKTOP,
    browser: 'Chrome',
    operating_system: 'Windows 10',
    location_country: 'France',
    location_city: 'Paris',
    location_region: 'Île-de-France',
    location_latitude: 48.8566,
    location_longitude: 2.3522,
    session_duration_seconds: 3600,
    session_token: 'session-token-123',
    is_suspicious: false,
    suspicious_reasons: null,
    metadata: {},
    created_at: new Date('2024-01-15T10:00:00Z'),
  };

  const mockLoginAuditStats = {
    total_attempts: 1250,
    successful_logins: 1100,
    failed_attempts: 150,
    suspicious_activities: 25,
    unique_users: 45,
    unique_ips: 78,
    success_rate: 88.0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecurityController],
      providers: [
        {
          provide: SecurityService,
          useValue: mockSecurityService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SecurityController>(SecurityController);
    service = module.get<SecurityService>(SecurityService);

    jest.clearAllMocks();

    // Mock console.log to avoid noise during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLoginAuditLogs', () => {
    it('should return login audit logs without filters', async () => {
      const logsResponse = {
        data: [mockLoginAuditLog],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };
      mockSecurityService.getLoginAuditLogs.mockResolvedValue(logsResponse);

      const query: LoginAuditQueryDto = {};
      const result = await controller.getLoginAuditLogs(mockRequest, query);

      expect(service.getLoginAuditLogs).toHaveBeenCalledWith('company-123', query);
      expect(result).toEqual(logsResponse);
    });

    it('should return login audit logs with filters', async () => {
      const logsResponse = {
        data: [mockLoginAuditLog],
        total: 1,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
      const query: LoginAuditQueryDto = {
        status: LoginStatus.SUCCESS,
        email_attempt: 'user@company.com',
        ip_address: '192.168.1.100',
        device_type: DeviceType.DESKTOP,
        is_suspicious: false,
        date_from: '2024-01-01T00:00:00Z',
        date_to: '2024-01-31T23:59:59Z',
        page: 1,
        limit: 25,
        search: 'user@company.com',
      };
      mockSecurityService.getLoginAuditLogs.mockResolvedValue(logsResponse);

      const result = await controller.getLoginAuditLogs(mockRequest, query);

      expect(service.getLoginAuditLogs).toHaveBeenCalledWith('company-123', query);
      expect(result).toEqual(logsResponse);
    });

    it('should return filtered logs for specific user', async () => {
      const logsResponse = {
        data: [mockLoginAuditLog],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };
      const query: LoginAuditQueryDto = {
        user_id: 'user-456',
        status: LoginStatus.FAILED,
      };
      mockSecurityService.getLoginAuditLogs.mockResolvedValue(logsResponse);

      const result = await controller.getLoginAuditLogs(mockRequest, query);

      expect(service.getLoginAuditLogs).toHaveBeenCalledWith('company-123', query);
      expect(result).toEqual(logsResponse);
    });

    it('should return suspicious activity logs', async () => {
      const suspiciousLog = {
        ...mockLoginAuditLog,
        status: LoginStatus.SUSPICIOUS,
        is_suspicious: true,
        suspicious_reasons: 'Multiple failed attempts from same IP',
      };
      const logsResponse = {
        data: [suspiciousLog],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };
      const query: LoginAuditQueryDto = {
        is_suspicious: true,
        status: LoginStatus.SUSPICIOUS,
      };
      mockSecurityService.getLoginAuditLogs.mockResolvedValue(logsResponse);

      const result = await controller.getLoginAuditLogs(mockRequest, query);

      expect(service.getLoginAuditLogs).toHaveBeenCalledWith('company-123', query);
      expect(result).toEqual(logsResponse);
    });

    it('should handle empty results', async () => {
      const emptyResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      };
      mockSecurityService.getLoginAuditLogs.mockResolvedValue(emptyResponse);

      const query: LoginAuditQueryDto = {};
      const result = await controller.getLoginAuditLogs(mockRequest, query);

      expect(service.getLoginAuditLogs).toHaveBeenCalledWith('company-123', query);
      expect(result).toEqual(emptyResponse);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockSecurityService.getLoginAuditLogs.mockRejectedValue(error);

      const query: LoginAuditQueryDto = {};

      await expect(controller.getLoginAuditLogs(mockRequest, query)).rejects.toThrow(error);
      expect(service.getLoginAuditLogs).toHaveBeenCalledWith('company-123', query);
    });

    it('should work with super admin user', async () => {
      const logsResponse = {
        data: [mockLoginAuditLog],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };
      mockSecurityService.getLoginAuditLogs.mockResolvedValue(logsResponse);

      const query: LoginAuditQueryDto = {};
      const result = await controller.getLoginAuditLogs(mockSuperAdminRequest, query);

      expect(service.getLoginAuditLogs).toHaveBeenCalledWith('company-456', query);
      expect(result).toEqual(logsResponse);
    });
  });

  describe('getLoginAuditStats', () => {
    it('should return login audit stats without date filters', async () => {
      mockSecurityService.getLoginAuditStats.mockResolvedValue(mockLoginAuditStats);

      const result = await controller.getLoginAuditStats(mockRequest);

      expect(service.getLoginAuditStats).toHaveBeenCalledWith('company-123', undefined, undefined);
      expect(result).toEqual(mockLoginAuditStats);
    });

    it('should return login audit stats with date filters', async () => {
      const filteredStats = {
        ...mockLoginAuditStats,
        total_attempts: 500,
        successful_logins: 450,
        failed_attempts: 50,
      };
      mockSecurityService.getLoginAuditStats.mockResolvedValue(filteredStats);

      const result = await controller.getLoginAuditStats(
        mockRequest,
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z'
      );

      expect(service.getLoginAuditStats).toHaveBeenCalledWith(
        'company-123',
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-31T23:59:59Z')
      );
      expect(result).toEqual(filteredStats);
    });

    it('should handle only dateFrom parameter', async () => {
      mockSecurityService.getLoginAuditStats.mockResolvedValue(mockLoginAuditStats);

      const result = await controller.getLoginAuditStats(mockRequest, '2024-01-01T00:00:00Z');

      expect(service.getLoginAuditStats).toHaveBeenCalledWith(
        'company-123',
        new Date('2024-01-01T00:00:00Z'),
        undefined
      );
      expect(result).toEqual(mockLoginAuditStats);
    });

    it('should handle only dateTo parameter', async () => {
      mockSecurityService.getLoginAuditStats.mockResolvedValue(mockLoginAuditStats);

      const result = await controller.getLoginAuditStats(mockRequest, undefined, '2024-01-31T23:59:59Z');

      expect(service.getLoginAuditStats).toHaveBeenCalledWith(
        'company-123',
        undefined,
        new Date('2024-01-31T23:59:59Z')
      );
      expect(result).toEqual(mockLoginAuditStats);
    });

    it('should handle invalid date formats gracefully', async () => {
      mockSecurityService.getLoginAuditStats.mockResolvedValue(mockLoginAuditStats);

      const result = await controller.getLoginAuditStats(mockRequest, 'invalid-date', 'another-invalid');

      const [company, dateFrom, dateTo] = mockSecurityService.getLoginAuditStats.mock.calls[0];
      expect(company).toBe('company-123');
      expect(dateFrom).toBeInstanceOf(Date);
      expect(dateTo).toBeInstanceOf(Date);
      expect(isNaN(dateFrom.getTime())).toBe(true); // Invalid Date
      expect(isNaN(dateTo.getTime())).toBe(true); // Invalid Date
      expect(result).toEqual(mockLoginAuditStats);
    });

    it('should handle service errors', async () => {
      const error = new Error('Stats calculation failed');
      mockSecurityService.getLoginAuditStats.mockRejectedValue(error);

      await expect(controller.getLoginAuditStats(mockRequest)).rejects.toThrow(error);
      expect(service.getLoginAuditStats).toHaveBeenCalledWith('company-123', undefined, undefined);
    });

    it('should work with super admin user', async () => {
      mockSecurityService.getLoginAuditStats.mockResolvedValue(mockLoginAuditStats);

      const result = await controller.getLoginAuditStats(mockSuperAdminRequest);

      expect(service.getLoginAuditStats).toHaveBeenCalledWith('company-456', undefined, undefined);
      expect(result).toEqual(mockLoginAuditStats);
    });
  });

  describe('logLoginAttempt', () => {
    it('should log successful login attempt', async () => {
      const createDto: CreateLoginAuditDto = {
        company_id: 'original-company-id', // This will be overridden
        email_attempt: 'user@company.com',
        status: LoginStatus.SUCCESS,
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        device_type: DeviceType.DESKTOP,
        browser: 'Chrome',
        operating_system: 'Windows 10',
      };

      const expectedDto = {
        ...createDto,
        company_id: 'company-123', // Should be overridden with user's company_id
      };

      const loggedAudit = { ...mockLoginAuditLog, ...expectedDto };
      mockSecurityService.logLoginAttempt.mockResolvedValue(loggedAudit);

      const result = await controller.logLoginAttempt(mockRequest, createDto);

      expect(service.logLoginAttempt).toHaveBeenCalledWith(expectedDto);
      expect(result).toEqual(loggedAudit);
    });

    it('should log failed login attempt', async () => {
      const createDto: CreateLoginAuditDto = {
        company_id: 'any-company', // Will be overridden
        email_attempt: 'wrong@company.com',
        status: LoginStatus.FAILED,
        failure_reason: 'Invalid credentials',
        ip_address: '192.168.1.200',
        user_agent: 'Mozilla/5.0',
        device_type: DeviceType.MOBILE,
      };

      const expectedDto = {
        ...createDto,
        company_id: 'company-123',
      };

      const loggedAudit = { ...mockLoginAuditLog, status: LoginStatus.FAILED, failure_reason: 'Invalid credentials' };
      mockSecurityService.logLoginAttempt.mockResolvedValue(loggedAudit);

      const result = await controller.logLoginAttempt(mockRequest, createDto);

      expect(service.logLoginAttempt).toHaveBeenCalledWith(expectedDto);
      expect(result).toEqual(loggedAudit);
    });

    it('should log suspicious login attempt', async () => {
      const createDto: CreateLoginAuditDto = {
        company_id: 'ignored',
        email_attempt: 'suspicious@company.com',
        status: LoginStatus.SUSPICIOUS,
        ip_address: '192.168.1.300',
        is_suspicious: true,
        suspicious_reasons: 'Multiple failed attempts from different locations',
        location_country: 'Unknown',
        location_city: 'Unknown',
      };

      const expectedDto = {
        ...createDto,
        company_id: 'company-123',
      };

      const loggedAudit = {
        ...mockLoginAuditLog,
        status: LoginStatus.SUSPICIOUS,
        is_suspicious: true,
        suspicious_reasons: 'Multiple failed attempts from different locations',
      };
      mockSecurityService.logLoginAttempt.mockResolvedValue(loggedAudit);

      const result = await controller.logLoginAttempt(mockRequest, createDto);

      expect(service.logLoginAttempt).toHaveBeenCalledWith(expectedDto);
      expect(result).toEqual(loggedAudit);
    });

    it('should handle optional fields', async () => {
      const minimalDto: CreateLoginAuditDto = {
        company_id: 'will-be-overridden',
        email_attempt: 'minimal@company.com',
        status: LoginStatus.SUCCESS,
        ip_address: '192.168.1.1',
      };

      const expectedDto = {
        ...minimalDto,
        company_id: 'company-123',
      };

      const loggedAudit = { ...mockLoginAuditLog, email_attempt: 'minimal@company.com' };
      mockSecurityService.logLoginAttempt.mockResolvedValue(loggedAudit);

      const result = await controller.logLoginAttempt(mockRequest, minimalDto);

      expect(service.logLoginAttempt).toHaveBeenCalledWith(expectedDto);
      expect(result).toEqual(loggedAudit);
    });

    it('should include metadata when provided', async () => {
      const createDto: CreateLoginAuditDto = {
        company_id: 'test',
        email_attempt: 'test@company.com',
        status: LoginStatus.SUCCESS,
        ip_address: '192.168.1.100',
        metadata: {
          source: 'test',
          version: '1.0.0',
          additional_info: 'test login attempt',
        },
      };

      const expectedDto = {
        ...createDto,
        company_id: 'company-123',
      };

      const loggedAudit = { ...mockLoginAuditLog, metadata: expectedDto.metadata };
      mockSecurityService.logLoginAttempt.mockResolvedValue(loggedAudit);

      const result = await controller.logLoginAttempt(mockRequest, createDto);

      expect(service.logLoginAttempt).toHaveBeenCalledWith(expectedDto);
      expect(result).toEqual(loggedAudit);
    });

    it('should handle service errors', async () => {
      const createDto: CreateLoginAuditDto = {
        company_id: 'test',
        email_attempt: 'test@company.com',
        status: LoginStatus.SUCCESS,
        ip_address: '192.168.1.100',
      };

      const error = new Error('Audit logging failed');
      mockSecurityService.logLoginAttempt.mockRejectedValue(error);

      await expect(controller.logLoginAttempt(mockRequest, createDto)).rejects.toThrow(error);
      expect(service.logLoginAttempt).toHaveBeenCalledWith({
        ...createDto,
        company_id: 'company-123',
      });
    });

    it('should work with super admin user', async () => {
      const createDto: CreateLoginAuditDto = {
        company_id: 'original',
        email_attempt: 'superadmin@platform.com',
        status: LoginStatus.SUCCESS,
        ip_address: '10.0.0.1',
      };

      const expectedDto = {
        ...createDto,
        company_id: 'company-456',
      };

      const loggedAudit = { ...mockLoginAuditLog, email_attempt: 'superadmin@platform.com' };
      mockSecurityService.logLoginAttempt.mockResolvedValue(loggedAudit);

      const result = await controller.logLoginAttempt(mockSuperAdminRequest, createDto);

      expect(service.logLoginAttempt).toHaveBeenCalledWith(expectedDto);
      expect(result).toEqual(loggedAudit);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', SecurityController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should be protected by RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', SecurityController);
      expect(guards).toContain(RolesGuard);
    });

    it('should allow SUPER_ADMIN and ADMIN roles', () => {
      const roles = Reflect.getMetadata('roles', SecurityController);
      expect(roles).toContain(UserRole.SUPER_ADMIN);
      expect(roles).toContain(UserRole.ADMIN);
    });

    it('should protect getLoginAuditLogs endpoint', () => {
      const guards = Reflect.getMetadata('__guards__', controller.getLoginAuditLogs);
      expect(guards).toBeFalsy(); // Inherited from class level
    });

    it('should protect getLoginAuditStats endpoint', () => {
      const guards = Reflect.getMetadata('__guards__', controller.getLoginAuditStats);
      expect(guards).toBeFalsy(); // Inherited from class level
    });

    it('should protect logLoginAttempt endpoint', () => {
      const guards = Reflect.getMetadata('__guards__', controller.logLoginAttempt);
      expect(guards).toBeFalsy(); // Inherited from class level
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user in request', async () => {
      const invalidRequest = { user: undefined };

      await expect(controller.getLoginAuditLogs(invalidRequest as any, {})).rejects.toThrow();
    });

    it('should handle missing company_id in user', async () => {
      const invalidRequest = {
        user: {
          id: 'user-123',
          email: 'user@company.com',
          role: UserRole.ADMIN,
          // company_id is missing
        },
      };

      const query: LoginAuditQueryDto = {};
      mockSecurityService.getLoginAuditLogs.mockResolvedValue({ data: [], total: 0, page: 1, limit: 50, totalPages: 0 });

      const result = await controller.getLoginAuditLogs(invalidRequest as any, query);

      expect(service.getLoginAuditLogs).toHaveBeenCalledWith(undefined, query);
      expect(result.data).toEqual([]);
    });

    it('should handle null date parameters in stats', async () => {
      mockSecurityService.getLoginAuditStats.mockResolvedValue(mockLoginAuditStats);

      const result = await controller.getLoginAuditStats(mockRequest, null as any, null as any);

      expect(service.getLoginAuditStats).toHaveBeenCalledWith('company-123', undefined, undefined);
      expect(result).toEqual(mockLoginAuditStats);
    });

    it('should handle empty string date parameters', async () => {
      mockSecurityService.getLoginAuditStats.mockResolvedValue(mockLoginAuditStats);

      const result = await controller.getLoginAuditStats(mockRequest, '', '');

      expect(service.getLoginAuditStats).toHaveBeenCalledWith('company-123', undefined, undefined);
      expect(result).toEqual(mockLoginAuditStats);
    });

    it('should preserve additional properties in createDto', async () => {
      const createDto = {
        company_id: 'original',
        email_attempt: 'user@test.com',
        status: LoginStatus.SUCCESS,
        ip_address: '192.168.1.1',
        additional_property: 'should be preserved',
      } as any;

      const expectedDto = {
        ...createDto,
        company_id: 'company-123',
      };

      mockSecurityService.logLoginAttempt.mockResolvedValue(mockLoginAuditLog);

      const result = await controller.logLoginAttempt(mockRequest, createDto);

      expect(service.logLoginAttempt).toHaveBeenCalledWith(expectedDto);
      expect(result).toEqual(mockLoginAuditLog);
    });
  });

  describe('Console Logging', () => {
    it('should log debug information in getLoginAuditLogs', async () => {
      const logsResponse = { data: [mockLoginAuditLog], total: 1, page: 1, limit: 50, totalPages: 1 };
      mockSecurityService.getLoginAuditLogs.mockResolvedValue(logsResponse);

      await controller.getLoginAuditLogs(mockRequest, {});

      expect(console.log).toHaveBeenCalledWith('🔍 [SECURITY CONTROLLER] getLoginAuditLogs called');
      expect(console.log).toHaveBeenCalledWith('🔍 [SECURITY CONTROLLER] User:', {
        id: 'user-123',
        email: 'admin@company.com',
        company_id: 'company-123',
        role: UserRole.ADMIN,
      });
      expect(console.log).toHaveBeenCalledWith('🔍 [SECURITY CONTROLLER] Query:', {});
      expect(console.log).toHaveBeenCalledWith('🔍 [SECURITY CONTROLLER] Result:', { total: 1, dataLength: 1 });
    });

    it('should log debug information in getLoginAuditStats', async () => {
      mockSecurityService.getLoginAuditStats.mockResolvedValue(mockLoginAuditStats);

      await controller.getLoginAuditStats(mockRequest);

      expect(console.log).toHaveBeenCalledWith('🔍 [SECURITY CONTROLLER] getLoginAuditStats called');
      expect(console.log).toHaveBeenCalledWith('🔍 [SECURITY CONTROLLER] User company_id:', 'company-123');
      expect(console.log).toHaveBeenCalledWith('🔍 [SECURITY CONTROLLER] Stats result:', mockLoginAuditStats);
    });
  });
});