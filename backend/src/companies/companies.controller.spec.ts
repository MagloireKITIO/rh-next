import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, InviteUserDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CompanyGuard } from '../auth/guards/company.guard';
import { UserRole } from '../auth/entities/user.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('CompaniesController', () => {
  let controller: CompaniesController;
  let companiesService: CompaniesService;

  const mockCompaniesService = {
    findOne: jest.fn(),
    update: jest.fn(),
    getUsers: jest.fn(),
    inviteUser: jest.fn(),
    updateUserRole: jest.fn(),
    deactivateUser: jest.fn(),
    reactivateUser: jest.fn(),
    resendInvitation: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockGuards = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockCompanyId = 'company-uuid-1';
  const mockUserId = 'user-uuid-1';

  const mockCompany = {
    id: mockCompanyId,
    name: 'Tech Corp',
    description: 'Leading technology company',
    website: 'https://techcorp.com',
    industry: 'Technology',
    size: '100-500',
    address: '123 Tech Street',
    phone: '+1234567890',
    email: 'contact@techcorp.com',
    logoUrl: 'https://techcorp.com/logo.png',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: mockUserId,
    email: 'user@techcorp.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER,
    isActive: true,
    company_id: mockCompanyId,
  };

  const mockPaginatedUsers = {
    data: [mockUser],
    total: 1,
    page: 1,
    limit: 50,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        {
          provide: CompaniesService,
          useValue: mockCompaniesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuards)
      .overrideGuard(RolesGuard)
      .useValue(mockGuards)
      .overrideGuard(CompanyGuard)
      .useValue(mockGuards)
      .compile();

    controller = module.get<CompaniesController>(CompaniesController);
    companiesService = module.get<CompaniesService>(CompaniesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findCurrent', () => {
    it('should return current company', async () => {
      mockCompaniesService.findOne.mockResolvedValue(mockCompany);

      const result = await controller.findCurrent(mockCompanyId);

      expect(mockCompaniesService.findOne).toHaveBeenCalledWith(mockCompanyId);
      expect(result).toEqual(mockCompany);
    });

    it('should handle company not found', async () => {
      const error = new NotFoundException('Company not found');
      mockCompaniesService.findOne.mockRejectedValue(error);

      await expect(controller.findCurrent(mockCompanyId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCurrent', () => {
    const updateCompanyDto: UpdateCompanyDto = {
      name: 'Updated Tech Corp',
      description: 'Updated description',
      logo_url: 'https://updated-techcorp.com/logo.png',
    };

    it('should update current company', async () => {
      const updatedCompany = { ...mockCompany, ...updateCompanyDto };
      mockCompaniesService.update.mockResolvedValue(updatedCompany);

      const result = await controller.updateCurrent(mockCompanyId, updateCompanyDto);

      expect(mockCompaniesService.update).toHaveBeenCalledWith(mockCompanyId, updateCompanyDto);
      expect(result).toEqual(updatedCompany);
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      mockCompaniesService.update.mockRejectedValue(error);

      await expect(controller.updateCurrent(mockCompanyId, updateCompanyDto)).rejects.toThrow('Update failed');
    });
  });

  describe('getUsers', () => {
    it('should return paginated users with default parameters', async () => {
      mockCompaniesService.getUsers.mockResolvedValue(mockPaginatedUsers);

      const result = await controller.getUsers(mockCompanyId);

      expect(mockCompaniesService.getUsers).toHaveBeenCalledWith(mockCompanyId, 1, 50);
      expect(result).toEqual(mockPaginatedUsers);
    });

    it('should return paginated users with custom parameters', async () => {
      mockCompaniesService.getUsers.mockResolvedValue(mockPaginatedUsers);

      const result = await controller.getUsers(mockCompanyId, '2', '25');

      expect(mockCompaniesService.getUsers).toHaveBeenCalledWith(mockCompanyId, 2, 25);
      expect(result).toEqual(mockPaginatedUsers);
    });

    it('should handle invalid pagination parameters', async () => {
      mockCompaniesService.getUsers.mockResolvedValue(mockPaginatedUsers);

      const result = await controller.getUsers(mockCompanyId, 'invalid', 'invalid');

      expect(mockCompaniesService.getUsers).toHaveBeenCalledWith(mockCompanyId, 1, 50);
      expect(result).toEqual(mockPaginatedUsers);
    });

    it('should return empty result when no users found', async () => {
      const emptyResult = { ...mockPaginatedUsers, data: [], total: 0 };
      mockCompaniesService.getUsers.mockResolvedValue(emptyResult);

      const result = await controller.getUsers(mockCompanyId);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('inviteUser', () => {
    const inviteUserDto: InviteUserDto = {
      email: 'newuser@techcorp.com',
      name: 'Jane Smith',
      role: UserRole.USER,
    };

    it('should invite a new user', async () => {
      const invitationResult = {
        success: true,
        invitationToken: 'invitation-token-123',
        user: { id: 'new-user-id', email: inviteUserDto.email }
      };
      mockCompaniesService.inviteUser.mockResolvedValue(invitationResult);

      const result = await controller.inviteUser(mockCompanyId, inviteUserDto);

      expect(mockCompaniesService.inviteUser).toHaveBeenCalledWith(mockCompanyId, inviteUserDto);
      expect(result).toEqual(invitationResult);
    });

    it('should handle invitation errors', async () => {
      const error = new Error('Email already exists');
      mockCompaniesService.inviteUser.mockRejectedValue(error);

      await expect(controller.inviteUser(mockCompanyId, inviteUserDto)).rejects.toThrow('Email already exists');
    });
  });

  describe('updateUserRole', () => {
    const newRole = UserRole.HR;

    it('should update user role successfully', async () => {
      const updatedUser = { ...mockUser, role: newRole };
      mockCompaniesService.updateUserRole.mockResolvedValue(updatedUser);

      const result = await controller.updateUserRole(mockCompanyId, mockUserId, newRole);

      expect(mockCompaniesService.updateUserRole).toHaveBeenCalledWith(mockCompanyId, mockUserId, newRole);
      expect(result).toEqual(updatedUser);
    });

    it('should handle user not found', async () => {
      const error = new NotFoundException('User not found in this company');
      mockCompaniesService.updateUserRole.mockRejectedValue(error);

      await expect(controller.updateUserRole(mockCompanyId, mockUserId, newRole)).rejects.toThrow(NotFoundException);
    });

    it('should handle invalid role assignment', async () => {
      const error = new ForbiddenException('Cannot assign this role');
      mockCompaniesService.updateUserRole.mockRejectedValue(error);

      await expect(controller.updateUserRole(mockCompanyId, mockUserId, UserRole.SUPER_ADMIN)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      mockCompaniesService.deactivateUser.mockResolvedValue(deactivatedUser);

      const result = await controller.deactivateUser(mockCompanyId, mockUserId);

      expect(mockCompaniesService.deactivateUser).toHaveBeenCalledWith(mockCompanyId, mockUserId);
      expect(result).toEqual(deactivatedUser);
    });

    it('should handle user not found during deactivation', async () => {
      const error = new NotFoundException('User not found');
      mockCompaniesService.deactivateUser.mockRejectedValue(error);

      await expect(controller.deactivateUser(mockCompanyId, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reactivateUser', () => {
    it('should reactivate user successfully', async () => {
      const reactivatedUser = { ...mockUser, isActive: true };
      mockCompaniesService.reactivateUser.mockResolvedValue(reactivatedUser);

      const result = await controller.reactivateUser(mockCompanyId, mockUserId);

      expect(mockCompaniesService.reactivateUser).toHaveBeenCalledWith(mockCompanyId, mockUserId);
      expect(result).toEqual(reactivatedUser);
    });

    it('should handle user not found during reactivation', async () => {
      const error = new NotFoundException('User not found');
      mockCompaniesService.reactivateUser.mockRejectedValue(error);

      await expect(controller.reactivateUser(mockCompanyId, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('resendInvitation', () => {
    it('should resend invitation successfully', async () => {
      const resendResult = {
        success: true,
        message: 'Invitation resent successfully',
        newToken: 'new-invitation-token-456'
      };
      mockCompaniesService.resendInvitation.mockResolvedValue(resendResult);

      const result = await controller.resendInvitation(mockCompanyId, mockUserId);

      expect(mockCompaniesService.resendInvitation).toHaveBeenCalledWith(mockCompanyId, mockUserId);
      expect(result).toEqual(resendResult);
    });

    it('should handle user not found during invitation resend', async () => {
      const error = new NotFoundException('User not found or already activated');
      mockCompaniesService.resendInvitation.mockRejectedValue(error);

      await expect(controller.resendInvitation(mockCompanyId, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const deleteResult = { success: true, message: 'User deleted successfully' };
      mockCompaniesService.deleteUser.mockResolvedValue(deleteResult);

      const result = await controller.deleteUser(mockCompanyId, mockUserId);

      expect(mockCompaniesService.deleteUser).toHaveBeenCalledWith(mockCompanyId, mockUserId);
      expect(result).toEqual(deleteResult);
    });

    it('should handle user not found during deletion', async () => {
      const error = new NotFoundException('User not found');
      mockCompaniesService.deleteUser.mockRejectedValue(error);

      await expect(controller.deleteUser(mockCompanyId, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should handle forbidden deletion attempts', async () => {
      const error = new ForbiddenException('Cannot delete admin user');
      mockCompaniesService.deleteUser.mockRejectedValue(error);

      await expect(controller.deleteUser(mockCompanyId, 'admin-user-id')).rejects.toThrow(ForbiddenException);
    });
  });
});