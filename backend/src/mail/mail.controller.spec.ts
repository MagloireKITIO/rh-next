import { Test, TestingModule } from '@nestjs/testing';
import { MailController, MailTestController } from './mail.controller';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../auth/entities/user.entity';

describe('MailController', () => {
  let controller: MailController;
  let service: MailService;

  const mockMailService = {
    getAllConfigurations: jest.fn(),
    getConfigurationById: jest.fn(),
    createConfiguration: jest.fn(),
    updateConfiguration: jest.fn(),
    deleteConfiguration: jest.fn(),
    toggleConfigurationStatus: jest.fn(),
    assignCompaniesToConfiguration: jest.fn(),
    getConfigurationCompanies: jest.fn(),
    sendTestEmail: jest.fn(),
  };

  const mockMailConfig = {
    id: 'config-123',
    provider_type: 'smtp',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: 'test@example.com',
    smtp_password: 'password',
    smtp_secure: false,
    smtp_require_tls: true,
    from_email: 'noreply@example.com',
    from_name: 'Test Company',
    is_active: true,
    is_default: false,
    company_id: 'company-123',
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MailController>(MailController);
    service = module.get<MailService>(MailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllConfigurations', () => {
    it('should return all configurations', async () => {
      const configs = [mockMailConfig];
      mockMailService.getAllConfigurations.mockResolvedValue(configs);

      const result = await controller.getAllConfigurations();

      expect(service.getAllConfigurations).toHaveBeenCalled();
      expect(result).toEqual({ data: configs });
    });

    it('should return empty array when no configurations exist', async () => {
      mockMailService.getAllConfigurations.mockResolvedValue([]);

      const result = await controller.getAllConfigurations();

      expect(service.getAllConfigurations).toHaveBeenCalled();
      expect(result).toEqual({ data: [] });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockMailService.getAllConfigurations.mockRejectedValue(error);

      await expect(controller.getAllConfigurations()).rejects.toThrow(error);
      expect(service.getAllConfigurations).toHaveBeenCalled();
    });
  });

  describe('getConfigurationById', () => {
    it('should return configuration by id', async () => {
      mockMailService.getConfigurationById.mockResolvedValue(mockMailConfig);

      const result = await controller.getConfigurationById('config-123');

      expect(service.getConfigurationById).toHaveBeenCalledWith('config-123');
      expect(result).toEqual({ data: mockMailConfig });
    });

    it('should handle non-existent configuration', async () => {
      const error = new Error('Configuration not found');
      mockMailService.getConfigurationById.mockRejectedValue(error);

      await expect(controller.getConfigurationById('non-existent')).rejects.toThrow(error);
      expect(service.getConfigurationById).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('createConfiguration', () => {
    it('should create a new configuration', async () => {
      const createDto = {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'test@example.com',
        smtp_password: 'password',
        from_email: 'noreply@example.com',
        from_name: 'Test Company',
      };
      mockMailService.createConfiguration.mockResolvedValue(mockMailConfig);

      const result = await controller.createConfiguration(createDto);

      expect(service.createConfiguration).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({
        data: mockMailConfig,
        message: 'Configuration créée avec succès',
      });
    });

    it('should handle validation errors', async () => {
      const createDto = {
        smtp_host: '',
        smtp_port: 587,
        smtp_user: 'test@example.com',
        smtp_password: 'password',
        from_email: 'invalid-email',
        from_name: 'Test Company',
      };
      const error = new Error('Validation failed');
      mockMailService.createConfiguration.mockRejectedValue(error);

      await expect(controller.createConfiguration(createDto)).rejects.toThrow(error);
      expect(service.createConfiguration).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateConfiguration', () => {
    it('should update an existing configuration', async () => {
      const updateDto = {
        from_name: 'Updated Company Name',
        is_active: false,
      };
      const updatedConfig = { ...mockMailConfig, from_name: 'Updated Company Name', is_active: false };
      mockMailService.updateConfiguration.mockResolvedValue(updatedConfig);

      const result = await controller.updateConfiguration('config-123', updateDto);

      expect(service.updateConfiguration).toHaveBeenCalledWith('config-123', updateDto);
      expect(result).toEqual({
        data: updatedConfig,
        message: 'Configuration mise à jour avec succès',
      });
    });

    it('should handle update errors', async () => {
      const updateDto = { from_name: 'Updated Name' };
      const error = new Error('Update failed');
      mockMailService.updateConfiguration.mockRejectedValue(error);

      await expect(controller.updateConfiguration('config-123', updateDto)).rejects.toThrow(error);
      expect(service.updateConfiguration).toHaveBeenCalledWith('config-123', updateDto);
    });
  });

  describe('deleteConfiguration', () => {
    it('should delete a configuration', async () => {
      mockMailService.deleteConfiguration.mockResolvedValue(undefined);

      const result = await controller.deleteConfiguration('config-123');

      expect(service.deleteConfiguration).toHaveBeenCalledWith('config-123');
      expect(result).toEqual({ message: 'Configuration supprimée avec succès' });
    });

    it('should handle delete errors', async () => {
      const error = new Error('Configuration not found');
      mockMailService.deleteConfiguration.mockRejectedValue(error);

      await expect(controller.deleteConfiguration('config-123')).rejects.toThrow(error);
      expect(service.deleteConfiguration).toHaveBeenCalledWith('config-123');
    });
  });

  describe('toggleConfigurationStatus', () => {
    it('should toggle configuration to active', async () => {
      const toggledConfig = { ...mockMailConfig, is_active: true };
      mockMailService.toggleConfigurationStatus.mockResolvedValue(toggledConfig);

      const result = await controller.toggleConfigurationStatus('config-123');

      expect(service.toggleConfigurationStatus).toHaveBeenCalledWith('config-123');
      expect(result).toEqual({
        data: toggledConfig,
        message: 'Configuration activée avec succès',
      });
    });

    it('should toggle configuration to inactive', async () => {
      const toggledConfig = { ...mockMailConfig, is_active: false };
      mockMailService.toggleConfigurationStatus.mockResolvedValue(toggledConfig);

      const result = await controller.toggleConfigurationStatus('config-123');

      expect(service.toggleConfigurationStatus).toHaveBeenCalledWith('config-123');
      expect(result).toEqual({
        data: toggledConfig,
        message: 'Configuration désactivée avec succès',
      });
    });

    it('should handle toggle errors', async () => {
      const error = new Error('Toggle failed');
      mockMailService.toggleConfigurationStatus.mockRejectedValue(error);

      await expect(controller.toggleConfigurationStatus('config-123')).rejects.toThrow(error);
      expect(service.toggleConfigurationStatus).toHaveBeenCalledWith('config-123');
    });
  });

  describe('assignCompaniesToConfiguration', () => {
    it('should assign companies to configuration', async () => {
      const companyIds = ['company-1', 'company-2', 'company-3'];
      mockMailService.assignCompaniesToConfiguration.mockResolvedValue(undefined);

      const result = await controller.assignCompaniesToConfiguration('config-123', { companyIds });

      expect(service.assignCompaniesToConfiguration).toHaveBeenCalledWith('config-123', companyIds);
      expect(result).toEqual({ message: 'Entreprises assignées avec succès' });
    });

    it('should handle assignment errors', async () => {
      const companyIds = ['company-1'];
      const error = new Error('Assignment failed');
      mockMailService.assignCompaniesToConfiguration.mockRejectedValue(error);

      await expect(
        controller.assignCompaniesToConfiguration('config-123', { companyIds })
      ).rejects.toThrow(error);
      expect(service.assignCompaniesToConfiguration).toHaveBeenCalledWith('config-123', companyIds);
    });

    it('should handle empty company ids array', async () => {
      const companyIds = [];
      mockMailService.assignCompaniesToConfiguration.mockResolvedValue(undefined);

      const result = await controller.assignCompaniesToConfiguration('config-123', { companyIds });

      expect(service.assignCompaniesToConfiguration).toHaveBeenCalledWith('config-123', companyIds);
      expect(result).toEqual({ message: 'Entreprises assignées avec succès' });
    });
  });

  describe('getConfigurationCompanies', () => {
    it('should return companies for configuration', async () => {
      const companies = [
        { id: 'company-1', name: 'Company 1' },
        { id: 'company-2', name: 'Company 2' },
      ];
      mockMailService.getConfigurationCompanies.mockResolvedValue(companies);

      const result = await controller.getConfigurationCompanies('config-123');

      expect(service.getConfigurationCompanies).toHaveBeenCalledWith('config-123');
      expect(result).toEqual({ data: companies });
    });

    it('should return empty array when no companies assigned', async () => {
      mockMailService.getConfigurationCompanies.mockResolvedValue([]);

      const result = await controller.getConfigurationCompanies('config-123');

      expect(service.getConfigurationCompanies).toHaveBeenCalledWith('config-123');
      expect(result).toEqual({ data: [] });
    });

    it('should handle service errors', async () => {
      const error = new Error('Configuration not found');
      mockMailService.getConfigurationCompanies.mockRejectedValue(error);

      await expect(controller.getConfigurationCompanies('config-123')).rejects.toThrow(error);
      expect(service.getConfigurationCompanies).toHaveBeenCalledWith('config-123');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MailController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should be protected by RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MailController);
      expect(guards).toContain(RolesGuard);
    });

    it('should require SUPER_ADMIN role', () => {
      const roles = Reflect.getMetadata('roles', MailController);
      expect(roles).toContain(UserRole.SUPER_ADMIN);
    });
  });
});

describe('MailTestController', () => {
  let controller: MailTestController;
  let service: MailService;

  const mockMailService = {
    sendTestEmail: jest.fn(),
    getAllConfigurations: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailTestController],
      providers: [
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MailTestController>(MailTestController);
    service = module.get<MailService>(MailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('testMailConfiguration', () => {
    it('should send test email with company_id', async () => {
      const testData = { email: 'test@example.com', company_id: 'company-123' };
      mockMailService.sendTestEmail.mockResolvedValue(undefined);

      const result = await controller.testMailConfiguration(testData);

      expect(service.sendTestEmail).toHaveBeenCalledWith('test@example.com', 'company-123');
      expect(result).toEqual({ message: 'Email de test envoyé avec succès' });
    });

    it('should send test email without company_id', async () => {
      const testData = { email: 'test@example.com' };
      mockMailService.sendTestEmail.mockResolvedValue(undefined);

      const result = await controller.testMailConfiguration(testData);

      expect(service.sendTestEmail).toHaveBeenCalledWith('test@example.com', undefined);
      expect(result).toEqual({ message: 'Email de test envoyé avec succès' });
    });

    it('should handle test email errors', async () => {
      const testData = { email: 'invalid-email' };
      const error = new Error('Invalid email address');
      mockMailService.sendTestEmail.mockRejectedValue(error);

      await expect(controller.testMailConfiguration(testData)).rejects.toThrow(error);
      expect(service.sendTestEmail).toHaveBeenCalledWith('invalid-email', undefined);
    });
  });

  describe('getMailConfigurationStatus', () => {
    it('should return mail configuration status with default config', async () => {
      const configs = [
        { id: '1', is_active: true, is_default: true, name: 'Default Config' },
        { id: '2', is_active: true, is_default: false, name: 'Active Config' },
        { id: '3', is_active: false, is_default: false, name: 'Inactive Config' },
      ];
      mockMailService.getAllConfigurations.mockResolvedValue(configs as any);

      const result = await controller.getMailConfigurationStatus();

      expect(service.getAllConfigurations).toHaveBeenCalled();
      expect(result).toEqual({
        data: {
          totalConfigs: 3,
          activeConfigs: 2,
          hasDefault: true,
          defaultConfig: configs[0],
        },
      });
    });

    it('should return status without default config', async () => {
      const configs = [
        { id: '1', is_active: true, is_default: false, name: 'Config 1' },
        { id: '2', is_active: false, is_default: false, name: 'Config 2' },
      ];
      mockMailService.getAllConfigurations.mockResolvedValue(configs as any);

      const result = await controller.getMailConfigurationStatus();

      expect(service.getAllConfigurations).toHaveBeenCalled();
      expect(result).toEqual({
        data: {
          totalConfigs: 2,
          activeConfigs: 1,
          hasDefault: false,
          defaultConfig: null,
        },
      });
    });

    it('should return status for empty configurations', async () => {
      mockMailService.getAllConfigurations.mockResolvedValue([]);

      const result = await controller.getMailConfigurationStatus();

      expect(service.getAllConfigurations).toHaveBeenCalled();
      expect(result).toEqual({
        data: {
          totalConfigs: 0,
          activeConfigs: 0,
          hasDefault: false,
          defaultConfig: null,
        },
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockMailService.getAllConfigurations.mockRejectedValue(error);

      await expect(controller.getMailConfigurationStatus()).rejects.toThrow(error);
      expect(service.getAllConfigurations).toHaveBeenCalled();
    });
  });

  describe('Authentication and Authorization', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MailTestController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should be protected by RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MailTestController);
      expect(guards).toContain(RolesGuard);
    });

    it('should require SUPER_ADMIN role', () => {
      const roles = Reflect.getMetadata('roles', MailTestController);
      expect(roles).toContain(UserRole.SUPER_ADMIN);
    });
  });
});