import { Test, TestingModule } from '@nestjs/testing';
import { MailAutomationService } from './mail-automation.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailAutomation, VisibilityType, TriggerType } from './entities/mail-automation.entity';
import { AutomationLog, AutomationLogStatus } from './entities/automation-log.entity';
import { CreateMailAutomationDto, UpdateMailAutomationDto } from './dto/create-automation.dto';
import { UserRole } from '../auth/entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('MailAutomationService', () => {
  let service: MailAutomationService;
  let mailAutomationRepository: Repository<MailAutomation>;
  let automationLogRepository: Repository<AutomationLog>;
  let eventEmitter: EventEmitter2;

  const mockMailAutomation = {
    id: 'automation-uuid-1',
    title: 'Test Automation',
    target_entity: 'candidates',
    trigger_type: TriggerType.ON_UPDATE,
    visibility: VisibilityType.COMPANY,
    is_active: true,
    company_id: 'company-uuid-1',
    user_id: 'user-uuid-1',
    mail_template_id: 'template-uuid-1',
    conditions: '{}',
    recipient_rules: 'all',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockAutomationLog = {
    id: 'log-uuid-1',
    automation_id: 'automation-uuid-1',
    entity_id: 'entity-uuid-1',
    entity_type: 'candidates',
    status: AutomationLogStatus.SUCCESS,
    email_sent_to: 'test@example.com',
    created_at: new Date(),
  };

  const mockCreateDto: CreateMailAutomationDto = {
    title: 'New Automation',
    target_entity: 'candidates',
    trigger_type: TriggerType.ON_UPDATE,
    mail_template_id: 'template-uuid-1',
    recipient_rules: 'all',
    visibility: VisibilityType.COMPANY,
    conditions: '{}',
    company_id: 'company-uuid-1',
  };

  const mockRepositoryBase = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailAutomationService,
        {
          provide: getRepositoryToken(MailAutomation),
          useValue: { ...mockRepositoryBase },
        },
        {
          provide: getRepositoryToken(AutomationLog),
          useValue: { ...mockRepositoryBase },
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<MailAutomationService>(MailAutomationService);
    mailAutomationRepository = module.get<Repository<MailAutomation>>(getRepositoryToken(MailAutomation));
    automationLogRepository = module.get<Repository<AutomationLog>>(getRepositoryToken(AutomationLog));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Setup QueryBuilder mocks
    mailAutomationRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
    automationLogRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

    // Ensure QueryBuilder methods return 'this' for chaining
    mockQueryBuilder.leftJoinAndSelect.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.leftJoin.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.where.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.andWhere.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.orderBy.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.limit.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create automation for regular user with company ID', async () => {
      mailAutomationRepository.create = jest.fn().mockReturnValue(mockMailAutomation);
      mailAutomationRepository.save = jest.fn().mockResolvedValue(mockMailAutomation);

      const result = await service.create(mockCreateDto, 'user-uuid-1', UserRole.ADMIN, 'company-uuid-1');

      expect(result).toEqual(mockMailAutomation);
      expect(mailAutomationRepository.create).toHaveBeenCalledWith({
        ...mockCreateDto,
        user_id: 'user-uuid-1',
        company_id: 'company-uuid-1',
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('automation.created', { automation: mockMailAutomation });
    });

    it('should create automation for super admin with custom company ID', async () => {
      const createDtoWithCompany = { ...mockCreateDto, company_id: 'custom-company-id' };
      mailAutomationRepository.create = jest.fn().mockReturnValue(mockMailAutomation);
      mailAutomationRepository.save = jest.fn().mockResolvedValue(mockMailAutomation);

      const result = await service.create(createDtoWithCompany, 'user-uuid-1', UserRole.SUPER_ADMIN, 'company-uuid-1');

      expect(result).toEqual(mockMailAutomation);
      expect(mailAutomationRepository.create).toHaveBeenCalledWith({
        ...createDtoWithCompany,
        user_id: 'user-uuid-1',
        company_id: 'custom-company-id',
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('automation.created', { automation: mockMailAutomation });
    });
  });

  describe('findAll', () => {
    it('should return all automations for super admin', async () => {
      const automations = [mockMailAutomation];
      mockQueryBuilder.getMany.mockResolvedValue(automations);

      const result = await service.findAll(UserRole.SUPER_ADMIN);

      expect(result).toEqual(automations);
      expect(mailAutomationRepository.createQueryBuilder).toHaveBeenCalledWith('automation');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('automation.mail_template', 'template');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('automation.user', 'user');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('automation.company', 'company');
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should return company automations for regular user', async () => {
      const automations = [mockMailAutomation];
      mockQueryBuilder.getMany.mockResolvedValue(automations);

      const result = await service.findAll(UserRole.ADMIN, 'company-uuid-1');

      expect(result).toEqual(automations);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('automation.company_id = :companyId', { companyId: 'company-uuid-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('automation.visibility = :visibility', { visibility: VisibilityType.COMPANY });
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return automation for super admin', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockMailAutomation);

      const result = await service.findOne('automation-uuid-1', UserRole.SUPER_ADMIN);

      expect(result).toEqual(mockMailAutomation);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('automation.id = :id', { id: 'automation-uuid-1' });
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });

    it('should return automation for regular user in same company', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockMailAutomation);

      const result = await service.findOne('automation-uuid-1', UserRole.ADMIN, 'company-uuid-1');

      expect(result).toEqual(mockMailAutomation);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('automation.id = :id', { id: 'automation-uuid-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('automation.company_id = :companyId', { companyId: 'company-uuid-1' });
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException when automation not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne('non-existing', UserRole.ADMIN, 'company-uuid-1')).rejects.toThrow(
        new NotFoundException('Automatisation non trouvée')
      );
    });
  });

  describe('update', () => {
    it('should update automation successfully', async () => {
      const updateDto: UpdateMailAutomationDto = { title: 'Updated Automation' };
      const updatedAutomation = { ...mockMailAutomation, ...updateDto };

      mockQueryBuilder.getOne.mockResolvedValue(mockMailAutomation);
      mailAutomationRepository.save = jest.fn().mockResolvedValue(updatedAutomation);

      const result = await service.update('automation-uuid-1', updateDto, UserRole.ADMIN, 'company-uuid-1');

      expect(result).toEqual(updatedAutomation);
      expect(mailAutomationRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('automation.updated', { automation: updatedAutomation });
    });

    it('should throw NotFoundException when automation not found', async () => {
      const updateDto: UpdateMailAutomationDto = { title: 'Updated Automation' };
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.update('non-existing', updateDto, UserRole.ADMIN, 'company-uuid-1')).rejects.toThrow(
        new NotFoundException('Automatisation non trouvée')
      );
    });
  });

  describe('remove', () => {
    it('should remove automation successfully', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockMailAutomation);
      mailAutomationRepository.remove = jest.fn().mockResolvedValue(mockMailAutomation);

      const result = await service.remove('automation-uuid-1', UserRole.ADMIN, 'company-uuid-1');

      expect(result).toEqual({ message: 'Automatisation supprimée avec succès' });
      expect(eventEmitter.emit).toHaveBeenCalledWith('automation.deleted', { automation: mockMailAutomation });
      expect(mailAutomationRepository.remove).toHaveBeenCalledWith(mockMailAutomation);
    });

    it('should throw NotFoundException when automation not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.remove('non-existing', UserRole.ADMIN, 'company-uuid-1')).rejects.toThrow(
        new NotFoundException('Automatisation non trouvée')
      );
    });
  });

  describe('toggleStatus', () => {
    it('should toggle automation status from active to inactive', async () => {
      const activeAutomation = { ...mockMailAutomation, is_active: true };
      const inactiveAutomation = { ...mockMailAutomation, is_active: false };

      mockQueryBuilder.getOne.mockResolvedValue(activeAutomation);
      mailAutomationRepository.save = jest.fn().mockResolvedValue(inactiveAutomation);

      const result = await service.toggleStatus('automation-uuid-1', UserRole.ADMIN, 'company-uuid-1');

      expect(result).toEqual(inactiveAutomation);
      expect(eventEmitter.emit).toHaveBeenCalledWith('automation.toggled', { automation: inactiveAutomation });
    });

    it('should toggle automation status from inactive to active', async () => {
      const inactiveAutomation = { ...mockMailAutomation, is_active: false };
      const activeAutomation = { ...mockMailAutomation, is_active: true };

      mockQueryBuilder.getOne.mockResolvedValue(inactiveAutomation);
      mailAutomationRepository.save = jest.fn().mockResolvedValue(activeAutomation);

      const result = await service.toggleStatus('automation-uuid-1', UserRole.ADMIN, 'company-uuid-1');

      expect(result).toEqual(activeAutomation);
      expect(eventEmitter.emit).toHaveBeenCalledWith('automation.toggled', { automation: activeAutomation });
    });

    it('should throw NotFoundException when automation not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.toggleStatus('non-existing', UserRole.ADMIN, 'company-uuid-1')).rejects.toThrow(
        new NotFoundException('Automatisation non trouvée')
      );
    });
  });

  describe('getStats', () => {
    it('should return stats for super admin', async () => {
      mockQueryBuilder.getCount
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8) // active
        .mockResolvedValueOnce(25) // thisWeek
        .mockResolvedValueOnce(2); // errors

      const result = await service.getStats(UserRole.SUPER_ADMIN);

      expect(result).toEqual({
        total: 10,
        active: 8,
        thisWeek: 25,
        errors: 2,
      });

      expect(mailAutomationRepository.createQueryBuilder).toHaveBeenCalledWith('automation');
      expect(automationLogRepository.createQueryBuilder).toHaveBeenCalledWith('log');
    });

    it('should return stats for company user', async () => {
      mockQueryBuilder.getCount
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(4) // active
        .mockResolvedValueOnce(12) // thisWeek
        .mockResolvedValueOnce(1); // errors

      const result = await service.getStats(UserRole.ADMIN, 'company-uuid-1');

      expect(result).toEqual({
        total: 5,
        active: 4,
        thisWeek: 12,
        errors: 1,
      });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(automation.company_id = :companyId OR automation.visibility = :systemVisibility)',
        { companyId: 'company-uuid-1', systemVisibility: VisibilityType.SYSTEM }
      );
    });
  });

  describe('getRecentLogs', () => {
    it('should return recent logs for super admin', async () => {
      const logs = [mockAutomationLog];
      mockQueryBuilder.getMany.mockResolvedValue(logs);

      const result = await service.getRecentLogs(UserRole.SUPER_ADMIN);

      expect(result).toEqual(logs);
      expect(automationLogRepository.createQueryBuilder).toHaveBeenCalledWith('log');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('log.automation', 'automation');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('log.created_at', 'DESC');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it('should return recent logs for company user with custom limit', async () => {
      const logs = [mockAutomationLog];
      mockQueryBuilder.getMany.mockResolvedValue(logs);

      const result = await service.getRecentLogs(UserRole.ADMIN, 'company-uuid-1', 20);

      expect(result).toEqual(logs);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(automation.company_id = :companyId OR automation.visibility = :systemVisibility)',
        { companyId: 'company-uuid-1', systemVisibility: VisibilityType.SYSTEM }
      );
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
    });
  });

  describe('logExecution', () => {
    it('should create and save execution log', async () => {
      automationLogRepository.create = jest.fn().mockReturnValue(mockAutomationLog);
      automationLogRepository.save = jest.fn().mockResolvedValue(mockAutomationLog);

      const result = await service.logExecution(
        'automation-uuid-1',
        'entity-uuid-1',
        'candidates',
        AutomationLogStatus.SUCCESS,
        undefined,
        'test@example.com',
        { key: 'value' }
      );

      expect(result).toEqual(mockAutomationLog);
      expect(automationLogRepository.create).toHaveBeenCalledWith({
        automation_id: 'automation-uuid-1',
        entity_id: 'entity-uuid-1',
        entity_type: 'candidates',
        status: AutomationLogStatus.SUCCESS,
        error_message: undefined,
        email_sent_to: 'test@example.com',
        context_data: { key: 'value' },
      });
      expect(automationLogRepository.save).toHaveBeenCalledWith(mockAutomationLog);
    });

    it('should create error log with error message', async () => {
      const errorLog = { ...mockAutomationLog, status: AutomationLogStatus.ERROR, error_message: 'Test error' };
      automationLogRepository.create = jest.fn().mockReturnValue(errorLog);
      automationLogRepository.save = jest.fn().mockResolvedValue(errorLog);

      const result = await service.logExecution(
        'automation-uuid-1',
        'entity-uuid-1',
        'candidates',
        AutomationLogStatus.ERROR,
        'Test error'
      );

      expect(result).toEqual(errorLog);
      expect(automationLogRepository.create).toHaveBeenCalledWith({
        automation_id: 'automation-uuid-1',
        entity_id: 'entity-uuid-1',
        entity_type: 'candidates',
        status: AutomationLogStatus.ERROR,
        error_message: 'Test error',
        email_sent_to: undefined,
        context_data: undefined,
      });
    });
  });

  describe('getActiveAutomationsForTrigger', () => {
    it('should return active automations for company with trigger', async () => {
      const automations = [mockMailAutomation];
      mockQueryBuilder.getMany.mockResolvedValue(automations);

      const result = await service.getActiveAutomationsForTrigger('candidates', TriggerType.ON_UPDATE, 'company-uuid-1');

      expect(result).toEqual(automations);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('automation.mail_template', 'template');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('automation.target_entity = :entityType', { entityType: 'candidates' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('automation.trigger_type = :triggerType', { triggerType: TriggerType.ON_UPDATE });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('automation.is_active = true');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(automation.company_id = :companyId OR automation.visibility = :systemVisibility)',
        { companyId: 'company-uuid-1', systemVisibility: VisibilityType.SYSTEM }
      );
    });

    it('should return only system automations when no company ID provided', async () => {
      const automations = [mockMailAutomation];
      mockQueryBuilder.getMany.mockResolvedValue(automations);

      const result = await service.getActiveAutomationsForTrigger('candidates', TriggerType.ON_UPDATE);

      expect(result).toEqual(automations);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('automation.visibility = :systemVisibility', {
        systemVisibility: VisibilityType.SYSTEM
      });
    });
  });

  describe('getAvailableVariables', () => {
    it('should return common and candidate-specific variables', async () => {
      const result = await service.getAvailableVariables('candidates');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      // Check for common variables
      expect(result.some(v => v.name === '{{recipient}}')).toBe(true);
      expect(result.some(v => v.name === '{{current_date}}')).toBe(true);

      // Check for candidate-specific variables
      expect(result.some(v => v.name === '{{name}}')).toBe(true);
      expect(result.some(v => v.name === '{{candidate_name}}')).toBe(true);
      expect(result.some(v => v.name === '{{email}}')).toBe(true);
      expect(result.some(v => v.name === '{{score}}')).toBe(true);

      // Check for company variables
      expect(result.some(v => v.name === '{{company_name}}')).toBe(true);
      expect(result.some(v => v.name === '{{companyName}}')).toBe(true);
    });

    it('should return common and project-specific variables', async () => {
      const result = await service.getAvailableVariables('projects');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      // Check for common variables
      expect(result.some(v => v.name === '{{recipient}}')).toBe(true);
      expect(result.some(v => v.name === '{{current_time}}')).toBe(true);

      // Check for project-specific variables
      expect(result.some(v => v.name === '{{name}}')).toBe(true);
      expect(result.some(v => v.name === '{{project_name}}')).toBe(true);
      expect(result.some(v => v.name === '{{description}}')).toBe(true);
      expect(result.some(v => v.name === '{{budget}}')).toBe(true);

      // Check for company variables
      expect(result.some(v => v.name === '{{company_name}}')).toBe(true);
      expect(result.some(v => v.name === '{{companyEmail}}')).toBe(true);
    });

    it('should return common and company-specific variables', async () => {
      const result = await service.getAvailableVariables('companies');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      // Check for company-specific variables
      expect(result.some(v => v.name === '{{name}}')).toBe(true);
      expect(result.some(v => v.name === '{{company_name}}')).toBe(true);
      expect(result.some(v => v.name === '{{email}}')).toBe(true);
      expect(result.some(v => v.name === '{{address}}')).toBe(true);
    });

    it('should return common and user-specific variables', async () => {
      const result = await service.getAvailableVariables('users');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      // Check for user-specific variables
      expect(result.some(v => v.name === '{{name}}')).toBe(true);
      expect(result.some(v => v.name === '{{user_name}}')).toBe(true);
      expect(result.some(v => v.name === '{{email}}')).toBe(true);
      expect(result.some(v => v.name === '{{role}}')).toBe(true);
    });

    it('should return only common and company variables for unknown entity type', async () => {
      const result = await service.getAvailableVariables('unknown_entity');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      // Check for common variables
      expect(result.some(v => v.name === '{{recipient}}')).toBe(true);
      expect(result.some(v => v.name === '{{current_datetime}}')).toBe(true);

      // Check for company variables
      expect(result.some(v => v.name === '{{company_name}}')).toBe(true);

      // Should not have entity-specific variables
      expect(result.some(v => v.name === '{{candidate_name}}')).toBe(false);
      expect(result.some(v => v.name === '{{project_name}}')).toBe(false);
    });

    it('should return variables with proper structure', async () => {
      const result = await service.getAvailableVariables('candidates');

      result.forEach(variable => {
        expect(variable).toHaveProperty('name');
        expect(variable).toHaveProperty('description');
        expect(variable).toHaveProperty('example');
        expect(typeof variable.name).toBe('string');
        expect(typeof variable.description).toBe('string');
        expect(typeof variable.example).toBe('string');
        expect(variable.name).toMatch(/^\{\{.+\}\}$/); // Should be wrapped in double curly braces
      });
    });
  });
});