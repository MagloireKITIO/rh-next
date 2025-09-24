import { Test, TestingModule } from '@nestjs/testing';
import { MailAutomationController, UserMailAutomationController } from './mail-automation.controller';
import { MailAutomationService } from './mail-automation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../auth/entities/user.entity';
import { TriggerType, VisibilityType } from './entities/mail-automation.entity';
import { CreateMailAutomationDto, UpdateMailAutomationDto } from './dto/create-automation.dto';

describe('MailAutomationController', () => {
  let controller: MailAutomationController;
  let service: MailAutomationService;

  const mockMailAutomationService = {
    findAll: jest.fn(),
    getStats: jest.fn(),
    getRecentLogs: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggleStatus: jest.fn(),
    getAvailableVariables: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      role: UserRole.SUPER_ADMIN,
      company_id: 'company-123',
    },
  };

  const mockMailAutomation = {
    id: 'automation-123',
    title: 'Welcome Email',
    description: 'Send welcome email to new candidates',
    company_id: 'company-123',
    user_id: 'user-123',
    target_entity: 'candidate',
    trigger_type: TriggerType.ON_CREATE,
    conditions: '{}',
    conditions_querystring: '',
    mail_template_id: 'template-123',
    recipient_rules: 'candidate.email',
    cc_users: [],
    is_active: true,
    visibility: VisibilityType.COMPANY,
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailAutomationController],
      providers: [
        {
          provide: MailAutomationService,
          useValue: mockMailAutomationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MailAutomationController>(MailAutomationController);
    service = module.get<MailAutomationService>(MailAutomationService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all automations', async () => {
      const automations = [mockMailAutomation];
      mockMailAutomationService.findAll.mockResolvedValue(automations);

      const result = await controller.findAll(mockRequest);

      expect(service.findAll).toHaveBeenCalledWith(UserRole.SUPER_ADMIN, 'company-123');
      expect(result).toEqual({ data: automations });
    });

    it('should handle empty automations list', async () => {
      mockMailAutomationService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockRequest);

      expect(service.findAll).toHaveBeenCalledWith(UserRole.SUPER_ADMIN, 'company-123');
      expect(result).toEqual({ data: [] });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockMailAutomationService.findAll.mockRejectedValue(error);

      await expect(controller.findAll(mockRequest)).rejects.toThrow(error);
      expect(service.findAll).toHaveBeenCalledWith(UserRole.SUPER_ADMIN, 'company-123');
    });
  });

  describe('getStats', () => {
    it('should return automation stats', async () => {
      const stats = {
        total: 5,
        active: 3,
        inactive: 2,
        triggers: { ON_CREATE: 2, ON_UPDATE: 2, ON_DELETE: 1 },
      };
      mockMailAutomationService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats(mockRequest);

      expect(service.getStats).toHaveBeenCalledWith(UserRole.SUPER_ADMIN, 'company-123');
      expect(result).toEqual({ data: stats });
    });

    it('should handle stats errors', async () => {
      const error = new Error('Stats calculation failed');
      mockMailAutomationService.getStats.mockRejectedValue(error);

      await expect(controller.getStats(mockRequest)).rejects.toThrow(error);
      expect(service.getStats).toHaveBeenCalledWith(UserRole.SUPER_ADMIN, 'company-123');
    });
  });

  describe('getRecentLogs', () => {
    it('should return recent logs', async () => {
      const logs = [
        { id: 'log-1', message: 'Email sent successfully', timestamp: new Date() },
        { id: 'log-2', message: 'Automation triggered', timestamp: new Date() },
      ];
      mockMailAutomationService.getRecentLogs.mockResolvedValue(logs);

      const result = await controller.getRecentLogs(mockRequest);

      expect(service.getRecentLogs).toHaveBeenCalledWith(UserRole.SUPER_ADMIN, 'company-123');
      expect(result).toEqual({ data: logs });
    });

    it('should handle empty logs', async () => {
      mockMailAutomationService.getRecentLogs.mockResolvedValue([]);

      const result = await controller.getRecentLogs(mockRequest);

      expect(service.getRecentLogs).toHaveBeenCalledWith(UserRole.SUPER_ADMIN, 'company-123');
      expect(result).toEqual({ data: [] });
    });

    it('should handle logs errors', async () => {
      const error = new Error('Logs retrieval failed');
      mockMailAutomationService.getRecentLogs.mockRejectedValue(error);

      await expect(controller.getRecentLogs(mockRequest)).rejects.toThrow(error);
      expect(service.getRecentLogs).toHaveBeenCalledWith(UserRole.SUPER_ADMIN, 'company-123');
    });
  });

  describe('findOne', () => {
    it('should return single automation', async () => {
      mockMailAutomationService.findOne.mockResolvedValue(mockMailAutomation);

      const result = await controller.findOne('automation-123', mockRequest);

      expect(service.findOne).toHaveBeenCalledWith('automation-123', UserRole.SUPER_ADMIN, 'company-123');
      expect(result).toEqual({ data: mockMailAutomation });
    });

    it('should handle automation not found', async () => {
      const error = new Error('Automation not found');
      mockMailAutomationService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('non-existent', mockRequest)).rejects.toThrow(error);
      expect(service.findOne).toHaveBeenCalledWith('non-existent', UserRole.SUPER_ADMIN, 'company-123');
    });
  });

  describe('create', () => {
    it('should create new automation', async () => {
      const createDto: CreateMailAutomationDto = {
        title: 'New Automation',
        target_entity: 'candidate',
        trigger_type: TriggerType.ON_CREATE,
        mail_template_id: 'template-123',
        recipient_rules: 'candidate.email',
      };
      mockMailAutomationService.create.mockResolvedValue(mockMailAutomation);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(
        createDto,
        'user-123',
        UserRole.SUPER_ADMIN,
        'company-123'
      );
      expect(result).toEqual({
        data: mockMailAutomation,
        message: 'Automatisation créée avec succès',
      });
    });

    it('should handle creation errors', async () => {
      const createDto: CreateMailAutomationDto = {
        title: 'Invalid Automation',
        target_entity: 'candidate',
        trigger_type: TriggerType.ON_CREATE,
        mail_template_id: 'invalid-template',
        recipient_rules: 'candidate.email',
      };
      const error = new Error('Template not found');
      mockMailAutomationService.create.mockRejectedValue(error);

      await expect(controller.create(createDto, mockRequest)).rejects.toThrow(error);
      expect(service.create).toHaveBeenCalledWith(
        createDto,
        'user-123',
        UserRole.SUPER_ADMIN,
        'company-123'
      );
    });
  });

  describe('update', () => {
    it('should update automation', async () => {
      const updateDto: UpdateMailAutomationDto = {
        title: 'Updated Automation',
        is_active: false,
      };
      const updatedAutomation = { ...mockMailAutomation, title: 'Updated Automation', is_active: false };
      mockMailAutomationService.update.mockResolvedValue(updatedAutomation);

      const result = await controller.update('automation-123', updateDto, mockRequest);

      expect(service.update).toHaveBeenCalledWith(
        'automation-123',
        updateDto,
        UserRole.SUPER_ADMIN,
        'company-123'
      );
      expect(result).toEqual({
        data: updatedAutomation,
        message: 'Automatisation mise à jour avec succès',
      });
    });

    it('should handle update errors', async () => {
      const updateDto: UpdateMailAutomationDto = { title: 'Updated Name' };
      const error = new Error('Update failed');
      mockMailAutomationService.update.mockRejectedValue(error);

      await expect(controller.update('automation-123', updateDto, mockRequest)).rejects.toThrow(error);
      expect(service.update).toHaveBeenCalledWith(
        'automation-123',
        updateDto,
        UserRole.SUPER_ADMIN,
        'company-123'
      );
    });
  });

  describe('remove', () => {
    it('should remove automation', async () => {
      const removeResult = { message: 'Automation deleted successfully' };
      mockMailAutomationService.remove.mockResolvedValue(removeResult);

      const result = await controller.remove('automation-123', mockRequest);

      expect(service.remove).toHaveBeenCalledWith('automation-123', UserRole.SUPER_ADMIN, 'company-123');
      expect(result).toEqual(removeResult);
    });

    it('should handle removal errors', async () => {
      const error = new Error('Automation not found');
      mockMailAutomationService.remove.mockRejectedValue(error);

      await expect(controller.remove('automation-123', mockRequest)).rejects.toThrow(error);
      expect(service.remove).toHaveBeenCalledWith('automation-123', UserRole.SUPER_ADMIN, 'company-123');
    });
  });

  describe('toggleStatus', () => {
    it('should toggle automation to active', async () => {
      const toggledAutomation = { ...mockMailAutomation, is_active: true };
      mockMailAutomationService.toggleStatus.mockResolvedValue(toggledAutomation);

      const result = await controller.toggleStatus('automation-123', mockRequest);

      expect(service.toggleStatus).toHaveBeenCalledWith('automation-123', UserRole.SUPER_ADMIN, 'company-123');
      expect(result).toEqual({
        data: toggledAutomation,
        message: 'Automatisation activée avec succès',
      });
    });

    it('should toggle automation to inactive', async () => {
      const toggledAutomation = { ...mockMailAutomation, is_active: false };
      mockMailAutomationService.toggleStatus.mockResolvedValue(toggledAutomation);

      const result = await controller.toggleStatus('automation-123', mockRequest);

      expect(service.toggleStatus).toHaveBeenCalledWith('automation-123', UserRole.SUPER_ADMIN, 'company-123');
      expect(result).toEqual({
        data: toggledAutomation,
        message: 'Automatisation désactivée avec succès',
      });
    });

    it('should handle toggle errors', async () => {
      const error = new Error('Toggle failed');
      mockMailAutomationService.toggleStatus.mockRejectedValue(error);

      await expect(controller.toggleStatus('automation-123', mockRequest)).rejects.toThrow(error);
      expect(service.toggleStatus).toHaveBeenCalledWith('automation-123', UserRole.SUPER_ADMIN, 'company-123');
    });
  });

  describe('getAvailableVariables', () => {
    it('should return available variables for entity type', async () => {
      const variables = [
        { name: 'candidate.name', description: 'Candidate full name' },
        { name: 'candidate.email', description: 'Candidate email address' },
      ];
      mockMailAutomationService.getAvailableVariables.mockResolvedValue(variables);

      const result = await controller.getAvailableVariables('candidate', mockRequest);

      expect(service.getAvailableVariables).toHaveBeenCalledWith('candidate');
      expect(result).toEqual({ data: variables });
    });

    it('should handle invalid entity type', async () => {
      const error = new Error('Invalid entity type');
      mockMailAutomationService.getAvailableVariables.mockRejectedValue(error);

      await expect(controller.getAvailableVariables('invalid', mockRequest)).rejects.toThrow(error);
      expect(service.getAvailableVariables).toHaveBeenCalledWith('invalid');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MailAutomationController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should be protected by RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MailAutomationController);
      expect(guards).toContain(RolesGuard);
    });

    it('should allow SUPER_ADMIN, ADMIN, HR roles', () => {
      const roles = Reflect.getMetadata('roles', MailAutomationController);
      expect(roles).toContain(UserRole.SUPER_ADMIN);
      expect(roles).toContain(UserRole.ADMIN);
      expect(roles).toContain(UserRole.HR);
    });
  });
});

describe('UserMailAutomationController', () => {
  let controller: UserMailAutomationController;
  let service: MailAutomationService;

  const mockMailAutomationService = {
    findAll: jest.fn(),
    getStats: jest.fn(),
    getRecentLogs: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggleStatus: jest.fn(),
    getAvailableVariables: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-456',
      role: UserRole.HR,
      company_id: 'company-456',
    },
  };

  const mockMailAutomation = {
    id: 'automation-456',
    title: 'HR Automation',
    description: 'HR specific automation',
    company_id: 'company-456',
    user_id: 'user-456',
    target_entity: 'candidate',
    trigger_type: TriggerType.ON_UPDATE,
    conditions: '{}',
    mail_template_id: 'template-456',
    recipient_rules: 'hr.email',
    cc_users: [],
    is_active: true,
    visibility: VisibilityType.COMPANY,
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserMailAutomationController],
      providers: [
        {
          provide: MailAutomationService,
          useValue: mockMailAutomationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserMailAutomationController>(UserMailAutomationController);
    service = module.get<MailAutomationService>(MailAutomationService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all automations for HR user', async () => {
      const automations = [mockMailAutomation];
      mockMailAutomationService.findAll.mockResolvedValue(automations);

      const result = await controller.findAll(mockRequest);

      expect(service.findAll).toHaveBeenCalledWith(UserRole.HR, 'company-456');
      expect(result).toEqual({ data: automations });
    });
  });

  describe('getStats', () => {
    it('should return stats for HR user', async () => {
      const stats = { total: 2, active: 1, inactive: 1 };
      mockMailAutomationService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats(mockRequest);

      expect(service.getStats).toHaveBeenCalledWith(UserRole.HR, 'company-456');
      expect(result).toEqual({ data: stats });
    });
  });

  describe('getRecentLogs', () => {
    it('should return recent logs for HR user', async () => {
      const logs = [{ id: 'log-hr-1', message: 'HR automation executed' }];
      mockMailAutomationService.getRecentLogs.mockResolvedValue(logs);

      const result = await controller.getRecentLogs(mockRequest);

      expect(service.getRecentLogs).toHaveBeenCalledWith(UserRole.HR, 'company-456');
      expect(result).toEqual({ data: logs });
    });
  });

  describe('findOne', () => {
    it('should return single automation for HR user', async () => {
      mockMailAutomationService.findOne.mockResolvedValue(mockMailAutomation);

      const result = await controller.findOne('automation-456', mockRequest);

      expect(service.findOne).toHaveBeenCalledWith('automation-456', UserRole.HR, 'company-456');
      expect(result).toEqual({ data: mockMailAutomation });
    });
  });

  describe('create', () => {
    it('should create automation as HR user', async () => {
      const createDto: CreateMailAutomationDto = {
        title: 'HR Automation',
        target_entity: 'candidate',
        trigger_type: TriggerType.ON_UPDATE,
        mail_template_id: 'template-456',
        recipient_rules: 'hr.email',
      };
      mockMailAutomationService.create.mockResolvedValue(mockMailAutomation);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, 'user-456', UserRole.HR, 'company-456');
      expect(result).toEqual({
        data: mockMailAutomation,
        message: 'Automatisation créée avec succès',
      });
    });
  });

  describe('update', () => {
    it('should update automation as HR user', async () => {
      const updateDto: UpdateMailAutomationDto = { title: 'Updated HR Automation' };
      const updatedAutomation = { ...mockMailAutomation, title: 'Updated HR Automation' };
      mockMailAutomationService.update.mockResolvedValue(updatedAutomation);

      const result = await controller.update('automation-456', updateDto, mockRequest);

      expect(service.update).toHaveBeenCalledWith('automation-456', updateDto, UserRole.HR, 'company-456');
      expect(result).toEqual({
        data: updatedAutomation,
        message: 'Automatisation mise à jour avec succès',
      });
    });
  });

  describe('remove', () => {
    it('should remove automation as HR user', async () => {
      const removeResult = { message: 'Automation removed' };
      mockMailAutomationService.remove.mockResolvedValue(removeResult);

      const result = await controller.remove('automation-456', mockRequest);

      expect(service.remove).toHaveBeenCalledWith('automation-456', UserRole.HR, 'company-456');
      expect(result).toEqual(removeResult);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle automation status as HR user', async () => {
      const toggledAutomation = { ...mockMailAutomation, is_active: false };
      mockMailAutomationService.toggleStatus.mockResolvedValue(toggledAutomation);

      const result = await controller.toggleStatus('automation-456', mockRequest);

      expect(service.toggleStatus).toHaveBeenCalledWith('automation-456', UserRole.HR, 'company-456');
      expect(result).toEqual({
        data: toggledAutomation,
        message: 'Automatisation désactivée avec succès',
      });
    });
  });

  describe('getAvailableVariables', () => {
    it('should return available variables as HR user', async () => {
      const variables = [{ name: 'hr.name', description: 'HR manager name' }];
      mockMailAutomationService.getAvailableVariables.mockResolvedValue(variables);

      const result = await controller.getAvailableVariables('hr', mockRequest);

      expect(service.getAvailableVariables).toHaveBeenCalledWith('hr');
      expect(result).toEqual({ data: variables });
    });
  });

  describe('Authentication and Authorization', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', UserMailAutomationController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should be protected by RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', UserMailAutomationController);
      expect(guards).toContain(RolesGuard);
    });

    it('should allow ADMIN and HR roles', () => {
      const roles = Reflect.getMetadata('roles', UserMailAutomationController);
      expect(roles).toContain(UserRole.ADMIN);
      expect(roles).toContain(UserRole.HR);
      expect(roles).not.toContain(UserRole.SUPER_ADMIN);
    });
  });
});