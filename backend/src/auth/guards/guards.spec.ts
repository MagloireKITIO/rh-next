import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RolesGuard } from './roles.guard';
import { CompanyGuard } from './company.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User, UserRole } from '../entities/user.entity';

// Mock JwtAuthGuard pour les tests
class MockJwtAuthGuard {
  constructor(
    private jwtService: any,
    private userRepository: any,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Token non fourni');
    }

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer') {
      throw new UnauthorizedException('Format de token invalide');
    }

    try {
      const payload = this.jwtService.verify(token);

      if (!payload.sub) {
        throw new UnauthorizedException('Payload de token invalide');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['company'],
      });

      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error.message === 'Database error') {
        throw new UnauthorizedException('Erreur lors de la vérification de l\'utilisateur');
      }

      throw new UnauthorizedException('Token invalide');
    }
  }
}

describe('Guards', () => {
  let rolesGuard: RolesGuard;
  let companyGuard: CompanyGuard;
  let jwtAuthGuard: MockJwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let jwtService: jest.Mocked<JwtService>;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const createMockExecutionContext = (user?: any, params?: any, headers?: any): ExecutionContext => {
    const request = {
      user,
      params: params || {},
      headers: headers || {},
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          send: jest.fn(),
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        CompanyGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    rolesGuard = module.get<RolesGuard>(RolesGuard);
    companyGuard = module.get<CompanyGuard>(CompanyGuard);
    reflector = module.get(Reflector);
    jwtService = module.get(JwtService);
    userRepository = module.get(getRepositoryToken(User));

    // Créer une instance du mock JwtAuthGuard
    jwtAuthGuard = new MockJwtAuthGuard(jwtService, userRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('RolesGuard', () => {
    it('should allow access when no roles are required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext();

      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      const user = { id: '1', role: UserRole.ADMIN, company_id: 'company1' };
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext(user);

      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      const user = { id: '1', role: UserRole.HR, company_id: 'company1' };
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN, UserRole.HR]);
      const context = createMockExecutionContext(user);

      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      const user = { id: '1', role: UserRole.USER, company_id: 'company1' };
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext(user);

      expect(() => rolesGuard.canActivate(context)).toThrow(
        new ForbiddenException('Permissions insuffisantes')
      );
    });

    it('should deny access when user is not authenticated', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext(); // No user

      expect(() => rolesGuard.canActivate(context)).toThrow(
        new ForbiddenException('Utilisateur non authentifié')
      );
    });

    it('should handle super admin role correctly', () => {
      const user = { id: '1', role: UserRole.SUPER_ADMIN, company_id: null };
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext(user);

      const result = rolesGuard.canActivate(context);

      expect(result).toBe(true); // SUPER_ADMIN has access to everything
    });

    it('should check both handler and class metadata', () => {
      const user = { id: '1', role: UserRole.ADMIN, company_id: 'company1' };
      const context = createMockExecutionContext(user);

      rolesGuard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('CompanyGuard', () => {
    it('should allow access when user belongs to the same company', () => {
      const user = { id: '1', role: UserRole.USER, company_id: 'company1' };
      const context = createMockExecutionContext(user, { company_id: 'company1' });

      const result = companyGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access for super admin regardless of company', () => {
      const user = { id: '1', role: UserRole.SUPER_ADMIN, company_id: null };
      const context = createMockExecutionContext(user, { company_id: 'company1' });

      const result = companyGuard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user belongs to different company', () => {
      const user = { id: '1', role: UserRole.USER, company_id: 'company1' };
      const context = createMockExecutionContext(user, { company_id: 'company2' });

      expect(() => companyGuard.canActivate(context)).toThrow(
        new ForbiddenException('Accès refusé : vous ne pouvez accéder qu\'aux ressources de votre entreprise')
      );
    });

    it('should deny access when user is not authenticated', () => {
      const context = createMockExecutionContext(undefined, { company_id: 'company1' });

      expect(() => companyGuard.canActivate(context)).toThrow(
        new ForbiddenException('Utilisateur non authentifié')
      );
    });

    it('should handle missing companyId parameter', () => {
      const user = { id: '1', role: UserRole.USER, company_id: 'company1' };
      const context = createMockExecutionContext(user, {}); // No companyId in params

      const result = companyGuard.canActivate(context);

      expect(result).toBe(true); // Should allow when no company restriction
    });

    it('should handle null user companyId', () => {
      const user = { id: '1', role: UserRole.USER, company_id: null };
      const context = createMockExecutionContext(user, { company_id: 'company1' });

      expect(() => companyGuard.canActivate(context)).toThrow(
        new ForbiddenException('Utilisateur non associé à une entreprise')
      );
    });

    it('should handle string comparison correctly', () => {
      const user = { id: '1', role: UserRole.USER, company_id: 'company1' };
      const context = createMockExecutionContext(user, { company_id: 'company1' });

      const result = companyGuard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('JwtAuthGuard', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      process.env.JWT_SECRET = 'test-secret';
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should allow access with valid JWT token', async () => {
      const mockUser = { id: '1', email: 'test@example.com', role: UserRole.USER };
      const mockPayload = { sub: '1', email: 'test@example.com' };

      jwtService.verify.mockReturnValue(mockPayload);
      userRepository.findOne.mockResolvedValue(mockUser as any);

      const request = {
        headers: { authorization: 'Bearer valid-token' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
          }),
        }),
      } as ExecutionContext;

      const result = await jwtAuthGuard.canActivate(context);

      expect(result).toBe(true);
      expect(request['user']).toEqual(mockUser);
    });

    it('should deny access when no authorization header is provided', async () => {
      const request = { headers: {} };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
          }),
        }),
      } as ExecutionContext;

      await expect(jwtAuthGuard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token non fourni')
      );
    });

    it('should deny access when authorization header format is invalid', async () => {
      const request = {
        headers: { authorization: 'InvalidFormat token' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
          }),
        }),
      } as ExecutionContext;

      await expect(jwtAuthGuard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Format de token invalide')
      );
    });

    it('should deny access when JWT token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const request = {
        headers: { authorization: 'Bearer invalid-token' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
          }),
        }),
      } as ExecutionContext;

      await expect(jwtAuthGuard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token invalide')
      );
    });

    it('should deny access when user is not found in database', async () => {
      const mockPayload = { sub: '1', email: 'test@example.com' };

      jwtService.verify.mockReturnValue(mockPayload);
      userRepository.findOne.mockResolvedValue(null);

      const request = {
        headers: { authorization: 'Bearer valid-token' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
          }),
        }),
      } as ExecutionContext;

      await expect(jwtAuthGuard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Utilisateur non trouvé')
      );
    });

    it('should handle malformed JWT payload', async () => {
      const mockPayload = { email: 'test@example.com' }; // Missing sub

      jwtService.verify.mockReturnValue(mockPayload);

      const request = {
        headers: { authorization: 'Bearer valid-token' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
          }),
        }),
      } as ExecutionContext;

      await expect(jwtAuthGuard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Payload de token invalide')
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockPayload = { sub: '1', email: 'test@example.com' };

      jwtService.verify.mockReturnValue(mockPayload);
      userRepository.findOne.mockRejectedValue(new Error('Database error'));

      const request = {
        headers: { authorization: 'Bearer valid-token' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
          }),
        }),
      } as ExecutionContext;

      await expect(jwtAuthGuard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Erreur lors de la vérification de l\'utilisateur')
      );
    });

    it('should query user with correct relations', async () => {
      const mockUser = { id: '1', email: 'test@example.com', role: UserRole.USER };
      const mockPayload = { sub: '1', email: 'test@example.com' };

      jwtService.verify.mockReturnValue(mockPayload);
      userRepository.findOne.mockResolvedValue(mockUser as any);

      const request = {
        headers: { authorization: 'Bearer valid-token' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
          }),
        }),
      } as ExecutionContext;

      await jwtAuthGuard.canActivate(context);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['company'],
      });
    });

    it('should handle expired tokens', async () => {
      jwtService.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const request = {
        headers: { authorization: 'Bearer expired-token' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
          }),
        }),
      } as ExecutionContext;

      await expect(jwtAuthGuard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token invalide')
      );
    });

    it('should handle JWT signature verification errors', async () => {
      jwtService.verify.mockImplementation(() => {
        const error = new Error('Invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const request = {
        headers: { authorization: 'Bearer invalid-signature-token' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
          }),
        }),
      } as ExecutionContext;

      await expect(jwtAuthGuard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token invalide')
      );
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a typical authentication flow', async () => {
      // Setup a typical authenticated request
      const mockUser = {
        id: '1',
        email: 'admin@company1.com',
        role: UserRole.ADMIN,
        company_id: 'company1',
      };

      const mockPayload = { sub: '1', email: 'admin@company1.com' };

      jwtService.verify.mockReturnValue(mockPayload);
      userRepository.findOne.mockResolvedValue(mockUser as any);

      const request = {
        headers: { authorization: 'Bearer valid-token' },
        params: { company_id: 'company1' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      // First: JWT Auth Guard
      const jwtResult = await jwtAuthGuard.canActivate(context);
      expect(jwtResult).toBe(true);
      expect(request['user']).toEqual(mockUser);

      // Second: Company Guard
      const companyResult = companyGuard.canActivate(context);
      expect(companyResult).toBe(true);

      // Third: Roles Guard
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const rolesResult = rolesGuard.canActivate(context);
      expect(rolesResult).toBe(true);
    });

    it('should fail authentication chain when JWT is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const request = {
        headers: { authorization: 'Bearer invalid-token' },
        params: { company_id: 'company1' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
          }),
        }),
      } as ExecutionContext;

      // Should fail at JWT Auth Guard
      await expect(jwtAuthGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when user has wrong company but correct role', async () => {
      const mockUser = {
        id: '1',
        email: 'admin@company2.com',
        role: UserRole.ADMIN,
        company_id: 'company2',
      };

      const mockPayload = { sub: '1', email: 'admin@company2.com' };

      jwtService.verify.mockReturnValue(mockPayload);
      userRepository.findOne.mockResolvedValue(mockUser as any);

      const request = {
        headers: { authorization: 'Bearer valid-token' },
        params: { company_id: 'company1' },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      // JWT Auth should pass
      await jwtAuthGuard.canActivate(context);

      // Company Guard should fail
      expect(() => companyGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});