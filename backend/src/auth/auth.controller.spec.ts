import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto, GoogleAuthDto, SignUpDto, CompanySignUpDto, AcceptInvitationDto, CompleteCompanyGoogleDto, UpdateProfileDto, ChangePasswordDto, DeleteAccountDto } from './dto/login.dto';
import { UserRole } from './entities/user.entity';
import { BadRequestException, UnauthorizedException, ExecutionContext } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    googleAuth: jest.fn(),
    companySignUp: jest.fn(),
    acceptInvitation: jest.fn(),
    finalizeInvitation: jest.fn(),
    completeCompanyGoogle: jest.fn(),
    getProfile: jest.fn(),
    markAsOnboarded: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    adminSignIn: jest.fn(),
    debugUser: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    deleteAccount: jest.fn(),
    uploadAvatar: jest.fn(),
    validateUser: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockRequest = {
    user: { id: 'user-uuid-1', role: UserRole.USER },
    ip: '192.168.1.1',
    connection: { remoteAddress: '192.168.1.1' },
    headers: { 'user-agent': 'test-browser', 'x-forwarded-for': '192.168.1.1' },
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'avatar',
    originalname: 'avatar.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    destination: './uploads/avatars',
    filename: 'user-uuid-1-1234567890.jpg',
    path: './uploads/avatars/user-uuid-1-1234567890.jpg',
    buffer: Buffer.from('test'),
    stream: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'John Doe',
    };

    it('should create a new user account', async () => {
      const expectedResult = { user: { id: 'user-1', email: 'test@example.com' } };
      mockAuthService.signUp.mockResolvedValue(expectedResult);

      const result = await controller.signUp(signUpDto);

      expect(mockAuthService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle signup errors', async () => {
      const error = new BadRequestException('Email already exists');
      mockAuthService.signUp.mockRejectedValue(error);

      await expect(controller.signUp(signUpDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('signIn', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should authenticate user with valid credentials', async () => {
      const expectedResult = { access_token: 'jwt-token', user: { id: 'user-1' } };
      mockAuthService.signIn.mockResolvedValue(expectedResult);

      const result = await controller.signIn(loginDto, mockRequest);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        loginDto,
        mockRequest.ip,
        mockRequest.headers['user-agent']
      );
      expect(result).toEqual(expectedResult);
    });

    it('should extract IP address from different sources', async () => {
      const requestWithXForwarded = {
        ...mockRequest,
        ip: undefined,
        connection: undefined,
        headers: { 'x-forwarded-for': '203.0.113.1', 'user-agent': 'test' },
      };

      await controller.signIn(loginDto, requestWithXForwarded);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(
        loginDto,
        '203.0.113.1',
        'test'
      );
    });

    it('should handle authentication errors', async () => {
      const error = new UnauthorizedException('Invalid credentials');
      mockAuthService.signIn.mockRejectedValue(error);

      await expect(controller.signIn(loginDto, mockRequest)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('googleAuth', () => {
    const googleAuthDto: GoogleAuthDto = {
      access_token: 'google-oauth-token',
    };

    it('should authenticate user with Google OAuth', async () => {
      const expectedResult = { access_token: 'jwt-token', user: { id: 'user-1' } };
      mockAuthService.googleAuth.mockResolvedValue(expectedResult);

      const result = await controller.googleAuth(googleAuthDto, mockRequest);

      expect(mockAuthService.googleAuth).toHaveBeenCalledWith(
        googleAuthDto,
        mockRequest.ip,
        mockRequest.headers['user-agent']
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('companySignUp', () => {
    const companySignUpDto: CompanySignUpDto = {
      companyName: 'Test Company',
      companyDomain: 'testcompany.com',
      email: 'admin@testcompany.com',
      password: 'password123',
      name: 'Jane Doe',
    };

    it('should create company and admin user', async () => {
      const expectedResult = { company: { id: 'company-1' }, user: { id: 'user-1' } };
      mockAuthService.companySignUp.mockResolvedValue(expectedResult);

      const result = await controller.companySignUp(companySignUpDto);

      expect(mockAuthService.companySignUp).toHaveBeenCalledWith(companySignUpDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('acceptInvitation', () => {
    const acceptInvitationDto: AcceptInvitationDto = {
      invitation_token: 'invitation-token-123',
      password: 'password123',
    };

    it('should accept team invitation', async () => {
      const expectedResult = { access_token: 'jwt-token', user: { id: 'user-1' } };
      mockAuthService.acceptInvitation.mockResolvedValue(expectedResult);

      const result = await controller.acceptInvitation(acceptInvitationDto, mockRequest);

      expect(mockAuthService.acceptInvitation).toHaveBeenCalledWith(
        acceptInvitationDto,
        mockRequest.ip,
        mockRequest.headers['user-agent']
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('finalizeInvitation', () => {
    const body = { email: 'test@example.com', supabaseUserId: 'supabase-123' };

    it('should finalize invitation process', async () => {
      const expectedResult = { success: true };
      mockAuthService.finalizeInvitation.mockResolvedValue(expectedResult);

      const result = await controller.finalizeInvitation(body);

      expect(mockAuthService.finalizeInvitation).toHaveBeenCalledWith(body.email, body.supabaseUserId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('completeCompanyGoogle', () => {
    const completeCompanyDto: CompleteCompanyGoogleDto = {
      companyName: 'Tech Corp',
      companyDomain: 'techcorp.com',
    };

    it('should complete company setup after Google auth', async () => {
      const expectedResult = { company: { id: 'company-1' } };
      mockAuthService.completeCompanyGoogle.mockResolvedValue(expectedResult);

      const result = await controller.completeCompanyGoogle(mockRequest, completeCompanyDto);

      expect(mockAuthService.completeCompanyGoogle).toHaveBeenCalledWith(
        mockRequest.user.id,
        completeCompanyDto
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const expectedResult = { id: 'user-1', email: 'test@example.com', firstName: 'John' };
      mockAuthService.getProfile.mockResolvedValue(expectedResult);

      const result = await controller.getProfile(mockRequest);

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('markAsOnboarded', () => {
    it('should mark user as onboarded', async () => {
      const expectedResult = { success: true };
      mockAuthService.markAsOnboarded.mockResolvedValue(expectedResult);

      const result = await controller.markAsOnboarded(mockRequest);

      expect(mockAuthService.markAsOnboarded).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyEmail', () => {
    const body = { token: 'verification-token-123' };

    it('should verify email with valid token', async () => {
      const expectedResult = { success: true };
      mockAuthService.verifyEmail.mockResolvedValue(expectedResult);

      const result = await controller.verifyEmail(body);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(body.token);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('resendVerification', () => {
    const body = { email: 'test@example.com' };

    it('should resend verification email', async () => {
      const expectedResult = { success: true };
      mockAuthService.resendVerificationEmail.mockResolvedValue(expectedResult);

      const result = await controller.resendVerification(body);

      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith(body.email);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('adminLogin', () => {
    const loginDto: LoginDto = {
      email: 'admin@example.com',
      password: 'admin123',
    };

    it('should authenticate super admin successfully', async () => {
      const adminResult = { access_token: 'admin-jwt', user: { id: 'admin-1', role: UserRole.SUPER_ADMIN } };
      const validatedUser = { id: 'admin-1', role: UserRole.SUPER_ADMIN };

      mockAuthService.adminSignIn.mockResolvedValue(adminResult);
      mockAuthService.validateUser.mockResolvedValue(validatedUser);

      const result = await controller.adminLogin(loginDto, mockRequest);

      expect(mockAuthService.adminSignIn).toHaveBeenCalledWith(
        loginDto,
        mockRequest.ip,
        mockRequest.headers['user-agent']
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith({ sub: adminResult.user.id });
      expect(result).toEqual(adminResult);
    });

    it('should reject non-super-admin users', async () => {
      const userResult = { access_token: 'user-jwt', user: { id: 'user-1', role: UserRole.USER } };
      const validatedUser = { id: 'user-1', role: UserRole.USER };

      mockAuthService.adminSignIn.mockResolvedValue(userResult);
      mockAuthService.validateUser.mockResolvedValue(validatedUser);

      await expect(controller.adminLogin(loginDto, mockRequest)).rejects.toThrow(
        new UnauthorizedException('Accès refusé : Vous devez être super administrateur')
      );
    });
  });

  describe('debugUser', () => {
    const body = { email: 'test@example.com' };

    it('should return debug information for user', async () => {
      const expectedResult = { user: { id: 'user-1', email: 'test@example.com' } };
      mockAuthService.debugUser.mockResolvedValue(expectedResult);

      const result = await controller.debugUser(body);

      expect(mockAuthService.debugUser).toHaveBeenCalledWith(body.email);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateProfile', () => {
    const updateProfileDto: UpdateProfileDto = {
      name: 'John Updated',
      email: 'johnupdated@example.com',
    };

    it('should update user profile', async () => {
      const expectedResult = { id: 'user-1', firstName: 'John Updated' };
      mockAuthService.updateProfile.mockResolvedValue(expectedResult);

      const result = await controller.updateProfile(mockRequest, updateProfileDto);

      expect(mockAuthService.updateProfile).toHaveBeenCalledWith(mockRequest.user.id, updateProfileDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
    };

    it('should change user password', async () => {
      const expectedResult = { success: true };
      mockAuthService.changePassword.mockResolvedValue(expectedResult);

      const result = await controller.changePassword(mockRequest, changePasswordDto);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(mockRequest.user.id, changePasswordDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteAccount', () => {
    const deleteAccountDto: DeleteAccountDto = {
      password: 'password123',
      reason: 'Not using anymore',
    };

    it('should delete user account', async () => {
      const expectedResult = { success: true };
      mockAuthService.deleteAccount.mockResolvedValue(expectedResult);

      const result = await controller.deleteAccount(mockRequest, deleteAccountDto);

      expect(mockAuthService.deleteAccount).toHaveBeenCalledWith(mockRequest.user.id, deleteAccountDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar file successfully', async () => {
      const expectedResult = { avatarUrl: '/uploads/avatars/user-uuid-1-1234567890.jpg' };
      mockAuthService.uploadAvatar.mockResolvedValue(expectedResult);

      const result = await controller.uploadAvatar(mockRequest, mockFile);

      expect(mockAuthService.uploadAvatar).toHaveBeenCalledWith(mockRequest.user.id, mockFile);
      expect(result).toEqual(expectedResult);
    });

    it('should throw error when no file provided', async () => {
      await expect(controller.uploadAvatar(mockRequest, undefined)).rejects.toThrow(
        new BadRequestException('Aucun fichier fourni')
      );

      expect(mockAuthService.uploadAvatar).not.toHaveBeenCalled();
    });
  });
});