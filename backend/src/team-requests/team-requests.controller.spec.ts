import { Test, TestingModule } from '@nestjs/testing';
import { TeamRequestsController, PublicTeamRequestsController } from './team-requests.controller';
import { TeamRequestsService } from './team-requests.service';
import { CreateTeamRequestDto } from './dto/create-team-request.dto';
import { ProcessTeamRequestDto } from './dto/process-team-request.dto';
import { TeamRequestStatus } from './entities/team-request.entity';
import { UserRole } from '../auth/entities/user.entity';

describe('TeamRequestsController', () => {
  let controller: TeamRequestsController;
  let service: TeamRequestsService;

  const mockTeamRequestsService = {
    findAllForCompany: jest.fn(),
    getNotificationsCount: jest.fn(),
    findOne: jest.fn(),
    process: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
  };

  const mockTeamRequest = {
    id: 'uuid-1',
    requester_email: 'test@example.com',
    requester_name: 'John Doe',
    message: 'Test message',
    status: TeamRequestStatus.PENDING,
    project_share_token: 'token123',
    company_id: 'company-1',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamRequestsController],
      providers: [
        {
          provide: TeamRequestsService,
          useValue: mockTeamRequestsService,
        },
      ],
    }).compile();

    controller = module.get<TeamRequestsController>(TeamRequestsController);
    service = module.get<TeamRequestsService>(TeamRequestsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all team requests for company', async () => {
      const companyId = 'company-1';
      const mockResult = [mockTeamRequest];

      mockTeamRequestsService.findAllForCompany.mockResolvedValue(mockResult);

      const result = await controller.findAll(companyId);

      expect(service.findAllForCompany).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(mockResult);
    });

    it('should return empty array if no team requests found', async () => {
      const companyId = 'company-1';
      const mockResult = [];

      mockTeamRequestsService.findAllForCompany.mockResolvedValue(mockResult);

      const result = await controller.findAll(companyId);

      expect(service.findAllForCompany).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(mockResult);
    });

    it('should handle service errors', async () => {
      const companyId = 'company-1';
      const error = new Error('Service error');

      mockTeamRequestsService.findAllForCompany.mockRejectedValue(error);

      await expect(controller.findAll(companyId)).rejects.toThrow(error);
      expect(service.findAllForCompany).toHaveBeenCalledWith(companyId);
    });
  });

  describe('getNotificationsCount', () => {
    it('should return notifications count for company', async () => {
      const companyId = 'company-1';
      const mockResult = { count: 5 };

      mockTeamRequestsService.getNotificationsCount.mockResolvedValue(mockResult);

      const result = await controller.getNotificationsCount(companyId);

      expect(service.getNotificationsCount).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(mockResult);
    });

    it('should return zero count if no notifications', async () => {
      const companyId = 'company-1';
      const mockResult = { count: 0 };

      mockTeamRequestsService.getNotificationsCount.mockResolvedValue(mockResult);

      const result = await controller.getNotificationsCount(companyId);

      expect(service.getNotificationsCount).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(mockResult);
    });

    it('should handle service errors', async () => {
      const companyId = 'company-1';
      const error = new Error('Service error');

      mockTeamRequestsService.getNotificationsCount.mockRejectedValue(error);

      await expect(controller.getNotificationsCount(companyId)).rejects.toThrow(error);
      expect(service.getNotificationsCount).toHaveBeenCalledWith(companyId);
    });
  });

  describe('findOne', () => {
    it('should return a specific team request', async () => {
      const id = 'uuid-1';
      const companyId = 'company-1';

      mockTeamRequestsService.findOne.mockResolvedValue(mockTeamRequest);

      const result = await controller.findOne(id, companyId);

      expect(service.findOne).toHaveBeenCalledWith(id, companyId);
      expect(result).toEqual(mockTeamRequest);
    });

    it('should handle not found scenario', async () => {
      const id = 'uuid-nonexistent';
      const companyId = 'company-1';

      mockTeamRequestsService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(id, companyId);

      expect(service.findOne).toHaveBeenCalledWith(id, companyId);
      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      const id = 'uuid-1';
      const companyId = 'company-1';
      const error = new Error('Service error');

      mockTeamRequestsService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(id, companyId)).rejects.toThrow(error);
      expect(service.findOne).toHaveBeenCalledWith(id, companyId);
    });

    it('should handle invalid id format', async () => {
      const id = 'invalid-id';
      const companyId = 'company-1';
      const error = new Error('Invalid ID format');

      mockTeamRequestsService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(id, companyId)).rejects.toThrow(error);
      expect(service.findOne).toHaveBeenCalledWith(id, companyId);
    });
  });

  describe('process', () => {
    const processDto: ProcessTeamRequestDto = {
      status: TeamRequestStatus.APPROVED,
    };

    it('should process team request with approval', async () => {
      const id = 'uuid-1';
      const companyId = 'company-1';
      const mockResult = { ...mockTeamRequest, status: TeamRequestStatus.APPROVED };

      mockTeamRequestsService.process.mockResolvedValue(mockResult);

      const result = await controller.process(id, processDto, companyId, mockUser);

      expect(service.process).toHaveBeenCalledWith(id, processDto, companyId, mockUser.id);
      expect(result).toEqual(mockResult);
    });

    it('should process team request with rejection', async () => {
      const id = 'uuid-1';
      const companyId = 'company-1';
      const rejectDto: ProcessTeamRequestDto = {
        status: TeamRequestStatus.REJECTED,
        rejection_reason: 'Not qualified',
      };
      const mockResult = {
        ...mockTeamRequest,
        status: TeamRequestStatus.REJECTED,
        rejection_reason: 'Not qualified'
      };

      mockTeamRequestsService.process.mockResolvedValue(mockResult);

      const result = await controller.process(id, rejectDto, companyId, mockUser);

      expect(service.process).toHaveBeenCalledWith(id, rejectDto, companyId, mockUser.id);
      expect(result).toEqual(mockResult);
    });

    it('should handle service errors during processing', async () => {
      const id = 'uuid-1';
      const companyId = 'company-1';
      const error = new Error('Processing failed');

      mockTeamRequestsService.process.mockRejectedValue(error);

      await expect(controller.process(id, processDto, companyId, mockUser)).rejects.toThrow(error);
      expect(service.process).toHaveBeenCalledWith(id, processDto, companyId, mockUser.id);
    });

    it('should handle invalid status in process dto', async () => {
      const id = 'uuid-1';
      const companyId = 'company-1';
      const invalidDto = { status: 'invalid' as any };
      const error = new Error('Invalid status');

      mockTeamRequestsService.process.mockRejectedValue(error);

      await expect(controller.process(id, invalidDto, companyId, mockUser)).rejects.toThrow(error);
      expect(service.process).toHaveBeenCalledWith(id, invalidDto, companyId, mockUser.id);
    });

    it('should handle missing user id', async () => {
      const id = 'uuid-1';
      const companyId = 'company-1';
      const userWithoutId = { email: 'test@example.com' } as any;
      const error = new Error('User ID required');

      mockTeamRequestsService.process.mockRejectedValue(error);

      await expect(controller.process(id, processDto, companyId, userWithoutId)).rejects.toThrow(error);
      expect(service.process).toHaveBeenCalledWith(id, processDto, companyId, undefined);
    });
  });

  describe('remove', () => {
    it('should remove a team request', async () => {
      const id = 'uuid-1';
      const companyId = 'company-1';
      const mockResult = { affected: 1 };

      mockTeamRequestsService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove(id, companyId);

      expect(service.remove).toHaveBeenCalledWith(id, companyId);
      expect(result).toEqual(mockResult);
    });

    it('should handle not found during removal', async () => {
      const id = 'uuid-nonexistent';
      const companyId = 'company-1';
      const mockResult = { affected: 0 };

      mockTeamRequestsService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove(id, companyId);

      expect(service.remove).toHaveBeenCalledWith(id, companyId);
      expect(result).toEqual(mockResult);
    });

    it('should handle service errors during removal', async () => {
      const id = 'uuid-1';
      const companyId = 'company-1';
      const error = new Error('Removal failed');

      mockTeamRequestsService.remove.mockRejectedValue(error);

      await expect(controller.remove(id, companyId)).rejects.toThrow(error);
      expect(service.remove).toHaveBeenCalledWith(id, companyId);
    });

    it('should handle invalid id format during removal', async () => {
      const id = 'invalid-id';
      const companyId = 'company-1';
      const error = new Error('Invalid ID format');

      mockTeamRequestsService.remove.mockRejectedValue(error);

      await expect(controller.remove(id, companyId)).rejects.toThrow(error);
      expect(service.remove).toHaveBeenCalledWith(id, companyId);
    });
  });
});

describe('PublicTeamRequestsController', () => {
  let controller: PublicTeamRequestsController;
  let service: TeamRequestsService;

  const mockTeamRequestsService = {
    create: jest.fn(),
  };

  const mockTeamRequest = {
    id: 'uuid-1',
    requester_email: 'test@example.com',
    requester_name: 'John Doe',
    message: 'Test message',
    status: TeamRequestStatus.PENDING,
    project_share_token: 'token123',
    company_id: 'company-1',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicTeamRequestsController],
      providers: [
        {
          provide: TeamRequestsService,
          useValue: mockTeamRequestsService,
        },
      ],
    }).compile();

    controller = module.get<PublicTeamRequestsController>(PublicTeamRequestsController);
    service = module.get<TeamRequestsService>(TeamRequestsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateTeamRequestDto = {
      requester_email: 'test@example.com',
      requester_name: 'John Doe',
      message: 'Test message',
      project_share_token: 'token123',
    };

    it('should create a new team request', async () => {
      mockTeamRequestsService.create.mockResolvedValue(mockTeamRequest);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockTeamRequest);
    });

    it('should create team request without message', async () => {
      const dtoWithoutMessage: CreateTeamRequestDto = {
        requester_email: 'test@example.com',
        requester_name: 'John Doe',
        project_share_token: 'token123',
      };
      const mockResult = { ...mockTeamRequest, message: null };

      mockTeamRequestsService.create.mockResolvedValue(mockResult);

      const result = await controller.create(dtoWithoutMessage);

      expect(service.create).toHaveBeenCalledWith(dtoWithoutMessage);
      expect(result).toEqual(mockResult);
    });

    it('should handle service errors during creation', async () => {
      const error = new Error('Creation failed');

      mockTeamRequestsService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should handle invalid email format', async () => {
      const invalidDto: CreateTeamRequestDto = {
        requester_email: 'invalid-email',
        requester_name: 'John Doe',
        project_share_token: 'token123',
      };
      const error = new Error('Invalid email format');

      mockTeamRequestsService.create.mockRejectedValue(error);

      await expect(controller.create(invalidDto)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(invalidDto);
    });

    it('should handle empty requester name', async () => {
      const invalidDto: CreateTeamRequestDto = {
        requester_email: 'test@example.com',
        requester_name: '',
        project_share_token: 'token123',
      };
      const error = new Error('Requester name is required');

      mockTeamRequestsService.create.mockRejectedValue(error);

      await expect(controller.create(invalidDto)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(invalidDto);
    });

    it('should handle empty project share token', async () => {
      const invalidDto: CreateTeamRequestDto = {
        requester_email: 'test@example.com',
        requester_name: 'John Doe',
        project_share_token: '',
      };
      const error = new Error('Project share token is required');

      mockTeamRequestsService.create.mockRejectedValue(error);

      await expect(controller.create(invalidDto)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(invalidDto);
    });

    it('should handle long message', async () => {
      const longMessage = 'a'.repeat(501);
      const invalidDto: CreateTeamRequestDto = {
        requester_email: 'test@example.com',
        requester_name: 'John Doe',
        message: longMessage,
        project_share_token: 'token123',
      };
      const error = new Error('Message too long');

      mockTeamRequestsService.create.mockRejectedValue(error);

      await expect(controller.create(invalidDto)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(invalidDto);
    });

    it('should handle long requester name', async () => {
      const longName = 'a'.repeat(101);
      const invalidDto: CreateTeamRequestDto = {
        requester_email: 'test@example.com',
        requester_name: longName,
        project_share_token: 'token123',
      };
      const error = new Error('Name too long');

      mockTeamRequestsService.create.mockRejectedValue(error);

      await expect(controller.create(invalidDto)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(invalidDto);
    });

    it('should handle database constraint violation', async () => {
      const error = new Error('Database constraint violation');

      mockTeamRequestsService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should handle network timeouts', async () => {
      const error = new Error('Network timeout');

      mockTeamRequestsService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should create team request with maximum valid message length', async () => {
      const maxMessage = 'a'.repeat(500);
      const validDto: CreateTeamRequestDto = {
        requester_email: 'test@example.com',
        requester_name: 'John Doe',
        message: maxMessage,
        project_share_token: 'token123',
      };
      const mockResult = { ...mockTeamRequest, message: maxMessage };

      mockTeamRequestsService.create.mockResolvedValue(mockResult);

      const result = await controller.create(validDto);

      expect(service.create).toHaveBeenCalledWith(validDto);
      expect(result).toEqual(mockResult);
    });

    it('should create team request with maximum valid name length', async () => {
      const maxName = 'a'.repeat(100);
      const validDto: CreateTeamRequestDto = {
        requester_email: 'test@example.com',
        requester_name: maxName,
        project_share_token: 'token123',
      };
      const mockResult = { ...mockTeamRequest, requester_name: maxName };

      mockTeamRequestsService.create.mockResolvedValue(mockResult);

      const result = await controller.create(validDto);

      expect(service.create).toHaveBeenCalledWith(validDto);
      expect(result).toEqual(mockResult);
    });
  });
});