import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService, PaginatedResponse } from './companies.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Company } from './entities/company.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateCompanyDto, InviteUserDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    admin: {
      inviteUserByEmail: jest.fn(),
      deleteUser: jest.fn(),
    },
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('CompaniesService', () => {
  let service: CompaniesService;
  let companiesRepository: Repository<Company>;
  let usersRepository: Repository<User>;
  let configService: ConfigService;

  const mockCompany = {
    id: 'company-uuid-1',
    name: 'Test Company',
    domain: 'test.com',
    description: 'Test company description',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    users: [],
    projects: [],
  };

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@test.com',
    name: 'Test User',
    role: UserRole.USER,
    company_id: 'company-uuid-1',
    is_active: true,
    is_invited: false,
    email_verified: true,
    created_at: new Date(),
    updated_at: new Date(),
    google_id: 'supabase-user-id',
    company: mockCompany,
  };

  const mockRepositoryBase = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const values = {
        SUPABASE_URL: 'https://testproject.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
        FRONTEND_URL: 'http://localhost:3000',
      };
      return values[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: getRepositoryToken(Company),
          useValue: { ...mockRepositoryBase },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { ...mockRepositoryBase },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    companiesRepository = module.get<Repository<Company>>(getRepositoryToken(Company));
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);

    // Mock the private supabase property
    (service as any).supabase = mockSupabaseClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCompanyDto: CreateCompanyDto = {
      name: 'New Company',
      domain: 'new.com',
      description: 'New company description',
    };

    const adminUser = {
      email: 'admin@new.com',
      name: 'Admin User',
    };

    it('should create company with admin user successfully', async () => {
      companiesRepository.findOne = jest.fn().mockResolvedValue(null); // No existing domain
      companiesRepository.create = jest.fn().mockReturnValue(mockCompany);
      companiesRepository.save = jest.fn().mockResolvedValue(mockCompany);
      usersRepository.create = jest.fn().mockReturnValue(mockUser);
      usersRepository.save = jest.fn().mockResolvedValue(mockUser);

      const result = await service.create(createCompanyDto, adminUser);

      expect(result).toEqual(mockCompany);
      expect(companiesRepository.findOne).toHaveBeenCalledWith({
        where: { domain: createCompanyDto.domain },
      });
      expect(companiesRepository.create).toHaveBeenCalledWith(createCompanyDto);
      expect(usersRepository.create).toHaveBeenCalledWith({
        ...adminUser,
        company_id: mockCompany.id,
        role: UserRole.ADMIN,
        is_active: true,
      });
    });

    it('should throw ConflictException when domain already exists', async () => {
      companiesRepository.findOne = jest.fn().mockResolvedValue(mockCompany);

      await expect(service.create(createCompanyDto, adminUser)).rejects.toThrow(
        new ConflictException('Une entreprise avec ce domaine existe déjà')
      );
    });
  });

  describe('findOne', () => {
    it('should return company when found', async () => {
      companiesRepository.findOne = jest.fn().mockResolvedValue(mockCompany);

      const result = await service.findOne('company-uuid-1');

      expect(result).toEqual(mockCompany);
      expect(companiesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'company-uuid-1' },
        relations: ['users', 'projects'],
      });
    });

    it('should throw NotFoundException when company not found', async () => {
      companiesRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.findOne('non-existing')).rejects.toThrow(
        new NotFoundException('Entreprise non trouvée')
      );
    });
  });

  describe('update', () => {
    const updateCompanyDto: UpdateCompanyDto = {
      name: 'Updated Company',
    };

    it('should update company successfully', async () => {
      const updatedCompany = { ...mockCompany, ...updateCompanyDto };
      companiesRepository.findOne = jest.fn().mockResolvedValue(mockCompany);
      companiesRepository.save = jest.fn().mockResolvedValue(updatedCompany);

      const result = await service.update('company-uuid-1', updateCompanyDto);

      expect(result).toEqual(updatedCompany);
      expect(companiesRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when company not found', async () => {
      companiesRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.update('non-existing', updateCompanyDto)).rejects.toThrow(
        new NotFoundException('Entreprise non trouvée')
      );
    });

    it('should validate unique domain when updating domain', async () => {
      const updateWithDomain = { domain: 'existing.com' };
      companiesRepository.findOne = jest.fn()
        .mockResolvedValueOnce(mockCompany) // Current company
        .mockResolvedValueOnce({ id: 'other-company' }); // Existing domain

      await expect(service.update('company-uuid-1', updateWithDomain)).rejects.toThrow(
        new ConflictException('Une entreprise avec ce domaine existe déjà')
      );
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const users = [mockUser];
      usersRepository.findAndCount = jest.fn().mockResolvedValue([users, 1]);

      const result = await service.getUsers('company-uuid-1', 1, 50);

      expect(result).toEqual({
        data: users,
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
      expect(usersRepository.findAndCount).toHaveBeenCalledWith({
        where: { company_id: 'company-uuid-1' },
        select: ['id', 'email', 'name', 'avatar_url', 'role', 'is_active', 'is_invited', 'created_at'],
        skip: 0,
        take: 50,
        order: { created_at: 'DESC' },
      });
    });

    it('should handle pagination correctly', async () => {
      const users = Array(10).fill(mockUser);
      usersRepository.findAndCount = jest.fn().mockResolvedValue([users, 25]);

      const result = await service.getUsers('company-uuid-1', 2, 10);

      expect(result).toEqual({
        data: users,
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
        hasNext: true,
        hasPrevious: true,
      });
      expect(usersRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('inviteUser', () => {
    const inviteUserDto: InviteUserDto = {
      email: 'newuser@test.com',
      name: 'New User',
      role: UserRole.USER,
    };

    beforeEach(() => {
      // Reset console.log and console.error mocks
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
    });

    it('should invite user successfully', async () => {
      companiesRepository.findOne = jest.fn().mockResolvedValue(mockCompany);
      usersRepository.findOne = jest.fn().mockResolvedValue(null); // No existing user
      usersRepository.create = jest.fn().mockReturnValue({ ...mockUser, ...inviteUserDto });
      usersRepository.save = jest.fn().mockResolvedValue({ ...mockUser, ...inviteUserDto });

      mockSupabaseClient.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: 'supabase-user-id', email: inviteUserDto.email } },
        error: null,
      });

      const result = await service.inviteUser('company-uuid-1', inviteUserDto);

      expect(result).toEqual({
        message: 'Invitation envoyée avec succès par email',
        invitation_sent: true,
      });
      expect(mockSupabaseClient.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
        inviteUserDto.email,
        expect.objectContaining({
          data: expect.objectContaining({
            name: inviteUserDto.name,
            role: inviteUserDto.role,
            company_id: 'company-uuid-1',
            company_name: mockCompany.name,
          }),
        })
      );
    });

    it('should throw NotFoundException when company not found', async () => {
      companiesRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.inviteUser('non-existing', inviteUserDto)).rejects.toThrow(
        new NotFoundException('Entreprise non trouvée')
      );
    });

    it('should throw ConflictException when user already exists', async () => {
      companiesRepository.findOne = jest.fn().mockResolvedValue(mockCompany);
      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);

      await expect(service.inviteUser('company-uuid-1', inviteUserDto)).rejects.toThrow(
        new ConflictException('Un utilisateur avec cet email existe déjà')
      );
    });

    it('should handle Supabase invitation errors', async () => {
      companiesRepository.findOne = jest.fn().mockResolvedValue(mockCompany);
      usersRepository.findOne = jest.fn().mockResolvedValue(null);

      mockSupabaseClient.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: null,
        error: { message: 'Supabase error' },
      });

      await expect(service.inviteUser('company-uuid-1', inviteUserDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const updatedUser = { ...mockUser, role: UserRole.ADMIN };
      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      usersRepository.save = jest.fn().mockResolvedValue(updatedUser);

      const result = await service.updateUserRole('company-uuid-1', 'user-uuid-1', UserRole.ADMIN);

      expect(result).toEqual(updatedUser);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1', company_id: 'company-uuid-1' },
      });
      expect(usersRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        role: UserRole.ADMIN,
      }));
    });

    it('should throw NotFoundException when user not found', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.updateUserRole('company-uuid-1', 'non-existing', UserRole.ADMIN)).rejects.toThrow(
        new NotFoundException('Utilisateur non trouvé dans cette entreprise')
      );
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const deactivatedUser = { ...mockUser, is_active: false };
      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      usersRepository.save = jest.fn().mockResolvedValue(deactivatedUser);

      const result = await service.deactivateUser('company-uuid-1', 'user-uuid-1');

      expect(result).toEqual(deactivatedUser);
      expect(usersRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        is_active: false,
      }));
    });

    it('should throw NotFoundException when user not found', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.deactivateUser('company-uuid-1', 'non-existing')).rejects.toThrow(
        new NotFoundException('Utilisateur non trouvé dans cette entreprise')
      );
    });
  });

  describe('reactivateUser', () => {
    it('should reactivate user successfully', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      const reactivatedUser = { ...mockUser, is_active: true };
      usersRepository.findOne = jest.fn().mockResolvedValue(inactiveUser);
      usersRepository.save = jest.fn().mockResolvedValue(reactivatedUser);

      const result = await service.reactivateUser('company-uuid-1', 'user-uuid-1');

      expect(result).toEqual(reactivatedUser);
      expect(usersRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        is_active: true,
      }));
    });

    it('should throw NotFoundException when user not found', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.reactivateUser('company-uuid-1', 'non-existing')).rejects.toThrow(
        new NotFoundException('Utilisateur non trouvé dans cette entreprise')
      );
    });
  });

  describe('resendInvitation', () => {
    const invitedUser = { ...mockUser, is_invited: true, google_id: 'supabase-user-id' };

    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(console, 'warn').mockImplementation();
    });

    it('should resend invitation successfully', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(invitedUser);
      usersRepository.save = jest.fn().mockResolvedValue(invitedUser);

      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({ error: null });
      mockSupabaseClient.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: 'new-supabase-user-id', email: invitedUser.email } },
        error: null,
      });

      const result = await service.resendInvitation('company-uuid-1', 'user-uuid-1');

      expect(result).toEqual({
        message: 'Invitation renvoyée avec succès par email',
        invitation_sent: true,
      });
      expect(mockSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith('supabase-user-id');
      expect(mockSupabaseClient.auth.admin.inviteUserByEmail).toHaveBeenCalled();
    });

    it('should throw NotFoundException when invited user not found', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.resendInvitation('company-uuid-1', 'non-existing')).rejects.toThrow(
        new NotFoundException('Utilisateur invité non trouvé dans cette entreprise')
      );
    });

    it('should throw BadRequestException when user already accepted invitation', async () => {
      const acceptedUser = { ...mockUser, is_invited: false };
      usersRepository.findOne = jest.fn().mockResolvedValue(acceptedUser);

      await expect(service.resendInvitation('company-uuid-1', 'user-uuid-1')).rejects.toThrow(
        new BadRequestException('Cet utilisateur a déjà accepté son invitation')
      );
    });

    it('should handle Supabase errors gracefully', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(invitedUser);
      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({ error: null });
      mockSupabaseClient.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: null,
        error: { message: 'Supabase error' },
      });

      await expect(service.resendInvitation('company-uuid-1', 'user-uuid-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should update Google ID when Supabase returns new user ID', async () => {
      // Use a different google_id initially so the condition triggers
      const oldUserId = 'old-supabase-user-id';
      const newUserId = 'new-supabase-user-id';
      const userWithOldId = { ...invitedUser, google_id: oldUserId };
      const updatedUser = { ...userWithOldId, google_id: newUserId };

      usersRepository.findOne = jest.fn().mockResolvedValue(userWithOldId);
      usersRepository.save = jest.fn().mockResolvedValue(updatedUser);

      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({ error: null });
      mockSupabaseClient.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: newUserId, email: userWithOldId.email } },
        error: null,
      });

      await service.resendInvitation('company-uuid-1', 'user-uuid-1');

      // Verify that the user object had its google_id updated
      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ google_id: newUserId })
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      usersRepository.remove = jest.fn().mockResolvedValue(mockUser);

      const result = await service.deleteUser('company-uuid-1', 'user-uuid-1');

      expect(result).toEqual({ message: 'Utilisateur supprimé avec succès' });
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1', company_id: 'company-uuid-1' },
      });
      expect(usersRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      usersRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.deleteUser('company-uuid-1', 'non-existing')).rejects.toThrow(
        new NotFoundException('Utilisateur non trouvé dans cette entreprise')
      );
    });
  });
});