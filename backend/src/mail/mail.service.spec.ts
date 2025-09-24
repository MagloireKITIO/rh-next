import { Test, TestingModule } from '@nestjs/testing';
import { MailService, CreateMailConfigDto, UpdateMailConfigDto } from './mail.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { MailConfiguration } from './entities/mail-configuration.entity';
import { MailConfigurationCompany } from './entities/mail-configuration-company.entity';
import { EmailHistory, EmailStatus } from './entities/email-history.entity';
import { Company } from '../companies/entities/company.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MailService', () => {
  let service: MailService;
  let mailConfigRepository: Repository<MailConfiguration>;
  let mailConfigCompanyRepository: Repository<MailConfigurationCompany>;
  let emailHistoryRepository: Repository<EmailHistory>;
  let companyRepository: Repository<Company>;
  let configService: ConfigService;

  const mockMailConfig = {
    id: 'config-uuid-1',
    provider_type: 'smtp',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: 'test@example.com',
    smtp_password: 'encrypted-password',
    smtp_secure: false,
    smtp_require_tls: true,
    from_email: 'test@example.com',
    from_name: 'Test Company',
    is_active: true,
    is_default: false,
    company_id: 'company-uuid-1',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockCompany = {
    id: 'company-uuid-1',
    name: 'Test Company',
    domain: 'test.com',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockEmailHistory = {
    id: 'email-uuid-1',
    to_email: 'candidate@example.com',
    subject: 'Interview Invitation',
    body: 'You are invited for an interview',
    status: EmailStatus.SENT,
    sent_at: new Date(),
    candidate_id: 'candidate-uuid-1',
    mail_configuration_id: 'config-uuid-1',
    created_at: new Date(),
  };

  const mockMailConfigRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  };

  const mockMailConfigCompanyRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockEmailHistoryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCompanyRepository = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        MAIL_HOST: 'localhost',
        MAIL_PORT: 1025,
        MAIL_USER: 'test',
        MAIL_PASSWORD: 'test',
        MAIL_FROM: 'noreply@example.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: getRepositoryToken(MailConfiguration),
          useValue: mockMailConfigRepository,
        },
        {
          provide: getRepositoryToken(MailConfigurationCompany),
          useValue: mockMailConfigCompanyRepository,
        },
        {
          provide: getRepositoryToken(EmailHistory),
          useValue: mockEmailHistoryRepository,
        },
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailConfigRepository = module.get<Repository<MailConfiguration>>(getRepositoryToken(MailConfiguration));
    mailConfigCompanyRepository = module.get<Repository<MailConfigurationCompany>>(getRepositoryToken(MailConfigurationCompany));
    emailHistoryRepository = module.get<Repository<EmailHistory>>(getRepositoryToken(EmailHistory));
    companyRepository = module.get<Repository<Company>>(getRepositoryToken(Company));
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllConfigurations', () => {
    it('should return all mail configurations', async () => {
      const configurations = [mockMailConfig];

      mockMailConfigRepository.find.mockResolvedValue(configurations);

      const result = await service.getAllConfigurations();

      expect(mockMailConfigRepository.find).toHaveBeenCalledWith({
        relations: ['company', 'configurationCompanies', 'configurationCompanies.company'],
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(configurations);
    });

    it('should return empty array when no configurations exist', async () => {
      mockMailConfigRepository.find.mockResolvedValue([]);

      const result = await service.getAllConfigurations();

      expect(result).toEqual([]);
    });
  });

  describe('getConfigurationById', () => {
    it('should return configuration when found', async () => {
      mockMailConfigRepository.findOne.mockResolvedValue(mockMailConfig);

      const result = await service.getConfigurationById('config-uuid-1');

      expect(mockMailConfigRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'config-uuid-1' },
        relations: ['company', 'configurationCompanies', 'configurationCompanies.company'],
      });
      expect(result).toEqual(mockMailConfig);
    });

    it('should throw NotFoundException when configuration not found', async () => {
      mockMailConfigRepository.findOne.mockResolvedValue(null);

      await expect(service.getConfigurationById('invalid-id')).rejects.toThrow(
        new NotFoundException('Configuration mail introuvable')
      );
    });
  });

  describe('createConfiguration', () => {
    const createDto: CreateMailConfigDto = {
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_user: 'test@example.com',
      smtp_password: 'password123',
      smtp_secure: false,
      smtp_require_tls: true,
      from_email: 'test@example.com',
      from_name: 'Test Company',
      is_active: true,
      is_default: false,
    };

    it('should create configuration successfully', async () => {
      mockMailConfigRepository.findOne.mockResolvedValue(null); // No existing default
      mockMailConfigRepository.create.mockReturnValue(mockMailConfig);
      mockMailConfigRepository.save.mockResolvedValue(mockMailConfig);

      const result = await service.createConfiguration(createDto);

      expect(mockMailConfigRepository.create).toHaveBeenCalledWith({
        ...createDto,
        provider_type: 'smtp'
      });
      expect(mockMailConfigRepository.save).toHaveBeenCalledWith(mockMailConfig);
      expect(result).toEqual(mockMailConfig);
    });

    it('should handle setting new default configuration', async () => {
      const existingDefault = { ...mockMailConfig, id: 'existing-default', is_default: true };
      const createDtoWithDefault = { ...createDto, is_default: true };

      mockMailConfigRepository.findOne.mockResolvedValue(existingDefault);
      mockMailConfigRepository.create.mockReturnValue({ ...mockMailConfig, is_default: true });
      mockMailConfigRepository.save
        .mockResolvedValueOnce({ ...existingDefault, is_default: false }) // Update existing default
        .mockResolvedValueOnce({ ...mockMailConfig, is_default: true }); // Save new config

      const result = await service.createConfiguration(createDtoWithDefault);

      expect(mockMailConfigRepository.findOne).toHaveBeenCalledWith({
        where: { is_default: true }
      });
      expect(mockMailConfigRepository.save).toHaveBeenCalledTimes(2);
      expect(result).toEqual(expect.objectContaining({ is_default: true }));
    });

    it('should create configuration without affecting others when not default', async () => {
      mockMailConfigRepository.create.mockReturnValue(mockMailConfig);
      mockMailConfigRepository.save.mockResolvedValue(mockMailConfig);

      const result = await service.createConfiguration(createDto);

      expect(mockMailConfigRepository.findOne).not.toHaveBeenCalled();
      expect(mockMailConfigRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMailConfig);
    });
  });

  describe('updateConfiguration', () => {
    const updateDto: UpdateMailConfigDto = {
      smtp_host: 'smtp.updated.com',
      smtp_port: 465,
      is_active: false,
    };

    it('should update configuration successfully', async () => {
      const updatedConfig = { ...mockMailConfig, ...updateDto };

      mockMailConfigRepository.findOne.mockResolvedValue(mockMailConfig);
      mockMailConfigRepository.save.mockResolvedValue(updatedConfig);

      const result = await service.updateConfiguration('config-uuid-1', updateDto);

      expect(mockMailConfigRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'config-uuid-1' },
        relations: ['company', 'configurationCompanies', 'configurationCompanies.company'],
      });
      expect(mockMailConfigRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto)
      );
      expect(result).toEqual(updatedConfig);
    });

    it('should handle setting configuration as default', async () => {
      const updateDtoWithDefault = { ...updateDto, is_default: true };
      const updatedConfig = { ...mockMailConfig, ...updateDtoWithDefault };

      mockMailConfigRepository.findOne.mockResolvedValue(mockMailConfig);
      mockMailConfigRepository.update.mockResolvedValue({ affected: 1 });
      mockMailConfigRepository.save.mockResolvedValue(updatedConfig);

      const result = await service.updateConfiguration('config-uuid-1', updateDtoWithDefault);

      expect(mockMailConfigRepository.update).toHaveBeenCalledWith(
        { is_default: true },
        { is_default: false }
      );
      expect(result).toEqual(updatedConfig);
    });

    it('should not update other defaults when config is already default', async () => {
      const defaultConfig = { ...mockMailConfig, is_default: true };
      const updateDtoWithDefault = { ...updateDto, is_default: true };

      mockMailConfigRepository.findOne.mockResolvedValue(defaultConfig);
      mockMailConfigRepository.save.mockResolvedValue(defaultConfig);

      await service.updateConfiguration('config-uuid-1', updateDtoWithDefault);

      expect(mockMailConfigRepository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when configuration not found', async () => {
      mockMailConfigRepository.findOne.mockResolvedValue(null);

      await expect(service.updateConfiguration('invalid-id', updateDto)).rejects.toThrow(
        new NotFoundException('Configuration mail introuvable')
      );
    });
  });

  describe('deleteConfiguration', () => {
    it('should delete configuration successfully', async () => {
      const nonDefaultConfig = { ...mockMailConfig, is_default: false };
      mockMailConfigRepository.findOne.mockResolvedValue(nonDefaultConfig);
      mockMailConfigRepository.remove = jest.fn().mockResolvedValue(undefined);

      await service.deleteConfiguration('config-uuid-1');

      expect(mockMailConfigRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'config-uuid-1' },
        relations: ['company', 'configurationCompanies', 'configurationCompanies.company'],
      });
      expect(mockMailConfigRepository.remove).toHaveBeenCalledWith(nonDefaultConfig);
    });

    it('should throw NotFoundException when configuration not found', async () => {
      mockMailConfigRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteConfiguration('invalid-id')).rejects.toThrow(
        new NotFoundException('Configuration mail introuvable')
      );
    });
  });
});