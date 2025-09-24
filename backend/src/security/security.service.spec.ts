import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SecurityService } from './security.service';
import { LoginAudit, LoginStatus, DeviceType } from './entities/login-audit.entity';
import { User } from '../auth/entities/user.entity';
import { CreateLoginAuditDto, LoginAuditQueryDto } from './dto/login-audit.dto';

describe('SecurityService', () => {
  let service: SecurityService;
  let loginAuditRepository: jest.Mocked<Repository<LoginAudit>>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockLoginAuditRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const createMockQueryBuilder = () => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getCount: jest.fn().mockResolvedValue(0),
    clone: jest.fn(),
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({}),
  });

  let mockQueryBuilder = createMockQueryBuilder();

  beforeEach(async () => {
    // Create fresh mock queryBuilder for each test
    mockQueryBuilder = createMockQueryBuilder();

    // Setup clone to return a fresh mock queryBuilder
    mockQueryBuilder.clone.mockImplementation(() => {
      const clonedMock = createMockQueryBuilder();
      // Ensure clone also returns itself for chaining
      clonedMock.clone.mockReturnValue(clonedMock);
      return clonedMock;
    });

    // Setup the repository mock to return the fresh queryBuilder
    mockLoginAuditRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    // Setup default successful return values
    mockLoginAuditRepository.save.mockResolvedValue({} as any);
    mockLoginAuditRepository.count.mockResolvedValue(100);
    mockLoginAuditRepository.create.mockImplementation((data) => data as any);
    mockLoginAuditRepository.find.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        {
          provide: getRepositoryToken(LoginAudit),
          useValue: mockLoginAuditRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<SecurityService>(SecurityService);
    loginAuditRepository = module.get(getRepositoryToken(LoginAudit));
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logLoginAttempt', () => {
    const mockLoginAttemptDto: CreateLoginAuditDto = {
      user_id: 'user-123',
      company_id: 'company-123',
      email_attempt: 'test@example.com',
      status: LoginStatus.SUCCESS,
      ip_address: '134.195.101.26', // Use public IP to avoid suspicious activity detection
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      location_country: 'France',
      location_city: 'Paris',
      session_token: 'session-token-123',
    };

    it('should successfully log a login attempt', async () => {
      const mockSavedAudit = { id: 'audit-123', ...mockLoginAttemptDto };

      loginAuditRepository.create.mockReturnValue(mockSavedAudit as any);
      loginAuditRepository.save.mockResolvedValue(mockSavedAudit as any);
      loginAuditRepository.count.mockResolvedValue(0); // No recent failures
      loginAuditRepository.find.mockResolvedValue([]); // No recent locations

      const result = await service.logLoginAttempt(mockLoginAttemptDto);

      expect(loginAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockLoginAttemptDto,
          device_type: DeviceType.DESKTOP,
          browser: 'Chrome',
          operating_system: 'Windows',
          is_suspicious: false,
          suspicious_reasons: '',
        })
      );
      expect(loginAuditRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSavedAudit);
    });

    it('should parse user agent correctly for mobile device', async () => {
      const mobileDto = {
        ...mockLoginAttemptDto,
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      };

      const mockSavedAudit = { id: 'audit-123', ...mobileDto };
      loginAuditRepository.create.mockReturnValue(mockSavedAudit as any);
      loginAuditRepository.save.mockResolvedValue(mockSavedAudit as any);
      loginAuditRepository.count.mockResolvedValue(0);
      loginAuditRepository.find.mockResolvedValue([]);

      await service.logLoginAttempt(mobileDto);

      expect(loginAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          device_type: DeviceType.MOBILE,
          browser: 'Safari',
          operating_system: 'iOS',
        })
      );
    });

    it('should detect suspicious activity - multiple failed attempts', async () => {
      const failedDto = { ...mockLoginAttemptDto, status: LoginStatus.FAILED };

      loginAuditRepository.create.mockReturnValue(failedDto as any);
      loginAuditRepository.save.mockResolvedValue(failedDto as any);
      loginAuditRepository.count.mockResolvedValue(3); // 3 recent failures
      loginAuditRepository.find.mockResolvedValue([]);

      await service.logLoginAttempt(failedDto);

      expect(loginAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          is_suspicious: true,
          suspicious_reasons: expect.stringContaining('Tentatives multiples échouées depuis la même IP'),
        })
      );
    });

    it('should detect suspicious activity - new geolocation', async () => {
      const existingLocations = [
        { location_country: 'USA', location_city: 'New York' },
      ];

      loginAuditRepository.create.mockReturnValue(mockLoginAttemptDto as any);
      loginAuditRepository.save.mockResolvedValue(mockLoginAttemptDto as any);
      loginAuditRepository.count.mockResolvedValue(0);
      loginAuditRepository.find.mockResolvedValue(existingLocations as any);

      await service.logLoginAttempt(mockLoginAttemptDto);

      expect(loginAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          is_suspicious: true,
          suspicious_reasons: expect.stringContaining('Connexion depuis une nouvelle géolocalisation'),
        })
      );
    });

    it('should detect suspicious activity - off-hours login', async () => {
      // Mock current time to be 2 AM (suspicious hour)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(2);

      loginAuditRepository.create.mockReturnValue(mockLoginAttemptDto as any);
      loginAuditRepository.save.mockResolvedValue(mockLoginAttemptDto as any);
      loginAuditRepository.count.mockResolvedValue(0);
      loginAuditRepository.find.mockResolvedValue([]);

      await service.logLoginAttempt(mockLoginAttemptDto);

      expect(loginAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          is_suspicious: true,
          suspicious_reasons: expect.stringContaining('Connexion en dehors des heures habituelles'),
        })
      );

      jest.restoreAllMocks();
    });

    it('should detect IP geolocation inconsistency', async () => {
      const inconsistentDto = {
        ...mockLoginAttemptDto,
        ip_address: '192.168.1.1', // Private IP
        location_country: 'France', // But geolocated to France
      };

      loginAuditRepository.create.mockReturnValue(inconsistentDto as any);
      loginAuditRepository.save.mockResolvedValue(inconsistentDto as any);
      loginAuditRepository.count.mockResolvedValue(0);
      loginAuditRepository.find.mockResolvedValue([]);

      await service.logLoginAttempt(inconsistentDto);

      expect(loginAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          is_suspicious: true,
          suspicious_reasons: expect.stringContaining('Incohérence entre IP privée et géolocalisation'),
        })
      );
    });

    it('should handle missing user agent gracefully', async () => {
      const noUserAgentDto = { ...mockLoginAttemptDto, user_agent: undefined };

      loginAuditRepository.create.mockReturnValue(noUserAgentDto as any);
      loginAuditRepository.save.mockResolvedValue(noUserAgentDto as any);
      loginAuditRepository.count.mockResolvedValue(0);
      loginAuditRepository.find.mockResolvedValue([]);

      await service.logLoginAttempt(noUserAgentDto);

      expect(loginAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          device_type: DeviceType.UNKNOWN,
          browser: undefined,
          operating_system: undefined,
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      loginAuditRepository.save.mockRejectedValue(error);

      await expect(service.logLoginAttempt(mockLoginAttemptDto)).rejects.toThrow(error);
      expect(loginAuditRepository.create).toHaveBeenCalled();
    });
  });

  describe('getLoginAuditLogs', () => {
    const mockLogs = [
      {
        id: 'audit-1',
        email_attempt: 'user1@example.com',
        status: LoginStatus.SUCCESS,
        ip_address: '192.168.1.1',
        created_at: new Date(),
      },
      {
        id: 'audit-2',
        email_attempt: 'user2@example.com',
        status: LoginStatus.FAILED,
        ip_address: '192.168.1.2',
        created_at: new Date(),
      },
    ];

    beforeEach(() => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, mockLogs.length]);
    });

    it('should return paginated audit logs for a company', async () => {
      const companyId = 'company-123';
      const query: LoginAuditQueryDto = { page: 1, limit: 10 };

      loginAuditRepository.count.mockResolvedValue(100); // Total records
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, 2]);

      const result = await service.getLoginAuditLogs(companyId, query);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('audit.company_id = :companyId', { companyId });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('audit.created_at', 'DESC');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(0);

      expect(result).toEqual({
        data: mockLogs,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should handle super admin (null companyId) case', async () => {
      const query: LoginAuditQueryDto = { page: 1, limit: 10 };

      loginAuditRepository.count.mockResolvedValue(100);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, 2]);

      const result = await service.getLoginAuditLogs(null, query);

      // Should not add company filter for super admin
      expect(mockQueryBuilder.where).not.toHaveBeenCalledWith(
        expect.stringContaining('company_id'),
        expect.any(Object)
      );
      expect(result.data).toEqual(mockLogs);
    });

    it('should apply status filter', async () => {
      const query: LoginAuditQueryDto = { status: LoginStatus.FAILED };

      loginAuditRepository.count.mockResolvedValue(100);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, 1]);

      await service.getLoginAuditLogs('company-123', query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit.status = :status', {
        status: LoginStatus.FAILED,
      });
    });

    it('should apply email search filter', async () => {
      const query: LoginAuditQueryDto = { email_attempt: 'test@example.com' };

      loginAuditRepository.count.mockResolvedValue(100);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, 1]);

      await service.getLoginAuditLogs('company-123', query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.email_attempt ILIKE :email_attempt',
        { email_attempt: '%test@example.com%' }
      );
    });

    it('should apply IP address filter', async () => {
      const query: LoginAuditQueryDto = { ip_address: '192.168.1.1' };

      loginAuditRepository.count.mockResolvedValue(100);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, 1]);

      await service.getLoginAuditLogs('company-123', query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.ip_address ILIKE :ip_address',
        { ip_address: '%192.168.1.1%' }
      );
    });

    it('should apply date range filter', async () => {
      const dateFrom = '2024-01-01';
      const dateTo = '2024-01-31';
      const query: LoginAuditQueryDto = { date_from: dateFrom, date_to: dateTo };

      loginAuditRepository.count.mockResolvedValue(100);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, 1]);

      await service.getLoginAuditLogs('company-123', query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.created_at BETWEEN :date_from AND :date_to',
        {
          date_from: new Date(dateFrom),
          date_to: new Date(dateTo),
        }
      );
    });

    it('should apply suspicious activity filter', async () => {
      const query: LoginAuditQueryDto = { is_suspicious: true };

      loginAuditRepository.count.mockResolvedValue(100);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, 1]);

      await service.getLoginAuditLogs('company-123', query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.is_suspicious = :is_suspicious',
        { is_suspicious: true }
      );
    });

    it('should apply general search filter', async () => {
      const query: LoginAuditQueryDto = { search: 'test search' };

      loginAuditRepository.count.mockResolvedValue(100);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, 1]);

      await service.getLoginAuditLogs('company-123', query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(audit.email_attempt ILIKE :search OR audit.ip_address ILIKE :search OR user.name ILIKE :search)',
        { search: '%test search%' }
      );
    });

    it('should handle pagination correctly', async () => {
      const query: LoginAuditQueryDto = { page: 3, limit: 20 };

      loginAuditRepository.count.mockResolvedValue(100);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, 2]);

      const result = await service.getLoginAuditLogs('company-123', query);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(40); // (3-1) * 20
      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database query failed');
      mockQueryBuilder.getManyAndCount.mockRejectedValue(error);

      await expect(service.getLoginAuditLogs('company-123', {})).rejects.toThrow(error);
    });
  });

  describe('getLoginAuditStats', () => {

    it('should return login audit statistics for a company', async () => {
      const companyId = 'company-123';

      // Mock the main query builder and all its clones
      const mockClone1 = createMockQueryBuilder();
      const mockClone2 = createMockQueryBuilder();
      const mockClone3 = createMockQueryBuilder();
      const mockClone4 = createMockQueryBuilder();
      const mockClone5 = createMockQueryBuilder();

      let cloneCallCount = 0;
      mockQueryBuilder.clone.mockImplementation(() => {
        const clones = [mockClone1, mockClone2, mockClone3, mockClone4, mockClone5];
        return clones[cloneCallCount++] || createMockQueryBuilder();
      });

      // Setup return values for each query
      mockQueryBuilder.getCount.mockResolvedValue(100); // total
      mockClone1.getCount.mockResolvedValue(80);  // successful
      mockClone2.getCount.mockResolvedValue(20);  // failed
      mockClone3.getCount.mockResolvedValue(5);   // suspicious
      mockClone4.getRawOne.mockResolvedValue({ count: '15' }); // unique users
      mockClone5.getRawOne.mockResolvedValue({ count: '25' }); // unique IPs

      const result = await service.getLoginAuditStats(companyId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('audit.company_id = :companyId', { companyId });
      expect(result).toEqual({
        total_attempts: 100,
        successful_logins: 80,
        failed_attempts: 20,
        suspicious_activities: 5,
        unique_users: 15,
        unique_ips: 25,
        success_rate: 80,
      });
    });

    it('should handle super admin stats (null companyId)', async () => {
      mockQueryBuilder.getCount.mockResolvedValueOnce(200); // total
      mockQueryBuilder.getCount.mockResolvedValueOnce(160); // successful
      mockQueryBuilder.getCount.mockResolvedValueOnce(40);  // failed
      mockQueryBuilder.getCount.mockResolvedValueOnce(10);  // suspicious
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ count: '30' }); // unique users
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({ count: '50' }); // unique IPs

      const result = await service.getLoginAuditStats(null);

      // Should not add company filter for super admin
      expect(mockQueryBuilder.where).not.toHaveBeenCalledWith(
        expect.stringContaining('company_id'),
        expect.any(Object)
      );
      expect(result.total_attempts).toBe(200);
    });

    it('should apply date range filter when provided', async () => {
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-31');

      mockQueryBuilder.getCount.mockResolvedValue(50);
      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '10' });

      await service.getLoginAuditStats('company-123', dateFrom, dateTo);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit.created_at BETWEEN :dateFrom AND :dateTo',
        { dateFrom, dateTo }
      );
    });

    it('should calculate success rate correctly', async () => {
      // Mock the main query builder and all its clones
      const mockClone1 = createMockQueryBuilder();
      const mockClone2 = createMockQueryBuilder();
      const mockClone3 = createMockQueryBuilder();
      const mockClone4 = createMockQueryBuilder();
      const mockClone5 = createMockQueryBuilder();

      let cloneCallCount = 0;
      mockQueryBuilder.clone.mockImplementation(() => {
        const clones = [mockClone1, mockClone2, mockClone3, mockClone4, mockClone5];
        return clones[cloneCallCount++] || createMockQueryBuilder();
      });

      // Setup return values for each query
      mockQueryBuilder.getCount.mockResolvedValue(100); // total
      mockClone1.getCount.mockResolvedValue(75);  // successful
      mockClone2.getCount.mockResolvedValue(25);  // failed
      mockClone3.getCount.mockResolvedValue(0);   // suspicious
      mockClone4.getRawOne.mockResolvedValue({ count: '10' }); // unique users
      mockClone5.getRawOne.mockResolvedValue({ count: '10' }); // unique IPs

      const result = await service.getLoginAuditStats('company-123');

      expect(result.success_rate).toBe(75); // 75/100 * 100 = 75%
    });

    it('should handle zero attempts gracefully', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getRawOne.mockResolvedValue({ count: '0' });

      const result = await service.getLoginAuditStats('company-123');

      expect(result.success_rate).toBe(0);
      expect(result.total_attempts).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database statistics query failed');
      mockQueryBuilder.getCount.mockRejectedValue(error);

      await expect(service.getLoginAuditStats('company-123')).rejects.toThrow(error);
    });
  });

  describe('updateSessionDuration', () => {
    it('should update session duration successfully', async () => {
      const sessionToken = 'session-token-123';
      const durationSeconds = 3600;

      loginAuditRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.updateSessionDuration(sessionToken, durationSeconds);

      expect(loginAuditRepository.update).toHaveBeenCalledWith(
        { session_token: sessionToken, status: LoginStatus.SUCCESS },
        { session_duration_seconds: durationSeconds }
      );
    });

    it('should handle update errors gracefully', async () => {
      const sessionToken = 'session-token-123';
      const durationSeconds = 3600;
      const error = new Error('Update failed');

      loginAuditRepository.update.mockRejectedValue(error);

      // Should not throw, just log error
      await expect(service.updateSessionDuration(sessionToken, durationSeconds)).resolves.toBeUndefined();
    });
  });

  describe('User Agent Parsing', () => {
    const testCases = [
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        expected: { deviceType: DeviceType.DESKTOP, browser: 'Chrome', os: 'Windows' },
      },
      {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        expected: { deviceType: DeviceType.MOBILE, browser: 'Safari', os: 'iOS' },
      },
      {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        expected: { deviceType: DeviceType.MOBILE, browser: 'Safari', os: 'iOS' },
      },
      {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        expected: { deviceType: DeviceType.DESKTOP, browser: 'Chrome', os: 'macOS' },
      },
      {
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        expected: { deviceType: DeviceType.DESKTOP, browser: 'Chrome', os: 'Linux' },
      },
      {
        userAgent: 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0',
        expected: { deviceType: DeviceType.MOBILE, browser: 'Firefox', os: 'Android' },
      },
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        expected: { deviceType: DeviceType.DESKTOP, browser: 'Edge', os: 'Windows' },
      },
    ];

    testCases.forEach(({ userAgent, expected }) => {
      it(`should parse user agent correctly: ${expected.browser} on ${expected.os}`, async () => {
        const dto: CreateLoginAuditDto = {
          user_id: 'user-123',
          company_id: 'company-123',
          email_attempt: 'test@example.com',
          status: LoginStatus.SUCCESS,
          ip_address: '192.168.1.1',
          user_agent: userAgent,
        };

        loginAuditRepository.create.mockReturnValue(dto as any);
        loginAuditRepository.save.mockResolvedValue(dto as any);
        loginAuditRepository.count.mockResolvedValue(0);
        loginAuditRepository.find.mockResolvedValue([]);

        await service.logLoginAttempt(dto);

        expect(loginAuditRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            device_type: expected.deviceType,
            browser: expected.browser,
            operating_system: expected.os,
          })
        );
      });
    });
  });

  describe('Private IP Detection', () => {
    const testCases = [
      { ip: '10.0.0.1', isPrivate: true },
      { ip: '172.16.0.1', isPrivate: true },
      { ip: '172.31.255.255', isPrivate: true },
      { ip: '192.168.1.1', isPrivate: true },
      { ip: '127.0.0.1', isPrivate: true },
      { ip: '169.254.1.1', isPrivate: true },
      { ip: '8.8.8.8', isPrivate: false },
      { ip: '173.0.0.1', isPrivate: false },
      { ip: '192.167.1.1', isPrivate: false },
    ];

    testCases.forEach(({ ip, isPrivate }) => {
      it(`should correctly identify ${ip} as ${isPrivate ? 'private' : 'public'}`, async () => {
        const dto: CreateLoginAuditDto = {
          user_id: 'user-123',
          company_id: 'company-123',
          email_attempt: 'test@example.com',
          status: LoginStatus.SUCCESS,
          ip_address: ip,
          location_country: isPrivate ? 'France' : undefined, // Only test inconsistency for private IPs
        };

        loginAuditRepository.create.mockReturnValue(dto as any);
        loginAuditRepository.save.mockResolvedValue(dto as any);
        loginAuditRepository.count.mockResolvedValue(0);
        loginAuditRepository.find.mockResolvedValue([]);

        await service.logLoginAttempt(dto);

        if (isPrivate && dto.location_country) {
          expect(loginAuditRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
              is_suspicious: true,
              suspicious_reasons: expect.stringContaining('Incohérence entre IP privée et géolocalisation'),
            })
          );
        } else {
          expect(loginAuditRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
              is_suspicious: false,
            })
          );
        }
      });
    });
  });
});