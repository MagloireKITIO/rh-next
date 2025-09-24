import { Test, TestingModule } from '@nestjs/testing';
import { MailTemplateController } from './mail-template.controller';
import { MailTemplateService } from './mail-template.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole, User } from '../auth/entities/user.entity';
import { TemplateType } from './entities/mail-template.entity';
import { CreateMailTemplateDto, UpdateMailTemplateDto } from './mail-template.service';

describe('MailTemplateController', () => {
  let controller: MailTemplateController;
  let service: MailTemplateService;

  const mockMailTemplateService = {
    getAllTemplates: jest.fn(),
    getTemplateById: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    duplicateTemplate: jest.fn(),
    renderTemplate: jest.fn(),
    createDefaultTemplates: jest.fn(),
  };

  const mockSuperAdmin: User = {
    id: 'super-admin-123',
    email: 'superadmin@example.com',
    role: UserRole.SUPER_ADMIN,
    company_id: null,
  } as User;

  const mockAdmin: User = {
    id: 'admin-123',
    email: 'admin@company.com',
    role: UserRole.ADMIN,
    company_id: 'company-123',
  } as User;

  const mockMailTemplate = {
    id: 'template-123',
    template_type: TemplateType.CONFIRM_SIGNUP,
    subject: 'Welcome to our platform!',
    html_body: '<p>Welcome {{user_name}}!</p>',
    text_body: 'Welcome {{user_name}}!',
    is_active: true,
    is_default: false,
    company_id: 'company-123',
    description: 'Welcome email template',
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailTemplateController],
      providers: [
        {
          provide: MailTemplateService,
          useValue: mockMailTemplateService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MailTemplateController>(MailTemplateController);
    service = module.get<MailTemplateService>(MailTemplateService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllTemplates', () => {
    it('should return all templates for super admin without company filter', async () => {
      const templates = [mockMailTemplate];
      mockMailTemplateService.getAllTemplates.mockResolvedValue(templates);

      const result = await controller.getAllTemplates(mockSuperAdmin);

      expect(service.getAllTemplates).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({ data: templates });
    });

    it('should return templates for super admin with company filter', async () => {
      const templates = [mockMailTemplate];
      mockMailTemplateService.getAllTemplates.mockResolvedValue(templates);

      const result = await controller.getAllTemplates(mockSuperAdmin, 'company-456');

      expect(service.getAllTemplates).toHaveBeenCalledWith('company-456');
      expect(result).toEqual({ data: templates });
    });

    it('should return templates for admin with their company filter', async () => {
      const templates = [mockMailTemplate];
      mockMailTemplateService.getAllTemplates.mockResolvedValue(templates);

      const result = await controller.getAllTemplates(mockAdmin);

      expect(service.getAllTemplates).toHaveBeenCalledWith('company-123');
      expect(result).toEqual({ data: templates });
    });

    it('should ignore companyId parameter for non-super admin users', async () => {
      const templates = [mockMailTemplate];
      mockMailTemplateService.getAllTemplates.mockResolvedValue(templates);

      const result = await controller.getAllTemplates(mockAdmin, 'other-company');

      expect(service.getAllTemplates).toHaveBeenCalledWith('company-123');
      expect(result).toEqual({ data: templates });
    });

    it('should handle empty templates list', async () => {
      mockMailTemplateService.getAllTemplates.mockResolvedValue([]);

      const result = await controller.getAllTemplates(mockAdmin);

      expect(service.getAllTemplates).toHaveBeenCalledWith('company-123');
      expect(result).toEqual({ data: [] });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockMailTemplateService.getAllTemplates.mockRejectedValue(error);

      await expect(controller.getAllTemplates(mockAdmin)).rejects.toThrow(error);
      expect(service.getAllTemplates).toHaveBeenCalledWith('company-123');
    });
  });

  describe('getTemplateTypes', () => {
    it('should return all template types with labels and descriptions', async () => {
      const result = await controller.getTemplateTypes();

      expect(result.data).toHaveLength(Object.keys(TemplateType).length);
      expect(result.data[0]).toHaveProperty('value');
      expect(result.data[0]).toHaveProperty('label');
      expect(result.data[0]).toHaveProperty('description');

      const confirmSignupType = result.data.find(type => type.value === TemplateType.CONFIRM_SIGNUP);
      expect(confirmSignupType).toEqual({
        value: TemplateType.CONFIRM_SIGNUP,
        label: "Confirmation d'inscription",
        description: "Email envoyé pour confirmer l'inscription d'un nouvel utilisateur",
      });
    });

    it('should include all template types', async () => {
      const result = await controller.getTemplateTypes();
      const values = result.data.map(type => type.value);

      Object.values(TemplateType).forEach(templateType => {
        expect(values).toContain(templateType);
      });
    });
  });

  describe('getTemplateById', () => {
    it('should return template by id', async () => {
      mockMailTemplateService.getTemplateById.mockResolvedValue(mockMailTemplate);

      const result = await controller.getTemplateById('template-123');

      expect(service.getTemplateById).toHaveBeenCalledWith('template-123');
      expect(result).toEqual({ data: mockMailTemplate });
    });

    it('should handle template not found', async () => {
      const error = new Error('Template not found');
      mockMailTemplateService.getTemplateById.mockRejectedValue(error);

      await expect(controller.getTemplateById('non-existent')).rejects.toThrow(error);
      expect(service.getTemplateById).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('createTemplate', () => {
    it('should create template with explicit company_id', async () => {
      const createDto: CreateMailTemplateDto = {
        template_type: TemplateType.INVITE_USER,
        subject: 'Join our team!',
        html_body: '<p>You are invited!</p>',
        company_id: 'explicit-company',
      };
      mockMailTemplateService.createTemplate.mockResolvedValue(mockMailTemplate);

      const result = await controller.createTemplate(createDto, mockAdmin);

      expect(service.createTemplate).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({
        data: mockMailTemplate,
        message: 'Template créé avec succès',
      });
    });

    it('should create template for admin without company_id (auto-assign)', async () => {
      const createDto: CreateMailTemplateDto = {
        template_type: TemplateType.INVITE_USER,
        subject: 'Join our team!',
        html_body: '<p>You are invited!</p>',
      };
      const expectedDto = { ...createDto, company_id: 'company-123' };
      mockMailTemplateService.createTemplate.mockResolvedValue(mockMailTemplate);

      const result = await controller.createTemplate(createDto, mockAdmin);

      expect(service.createTemplate).toHaveBeenCalledWith(expectedDto);
      expect(result).toEqual({
        data: mockMailTemplate,
        message: 'Template créé avec succès',
      });
    });

    it('should create template for super admin without auto-assigning company', async () => {
      const createDto: CreateMailTemplateDto = {
        template_type: TemplateType.INVITE_USER,
        subject: 'Join our team!',
        html_body: '<p>You are invited!</p>',
      };
      mockMailTemplateService.createTemplate.mockResolvedValue(mockMailTemplate);

      const result = await controller.createTemplate(createDto, mockSuperAdmin);

      expect(service.createTemplate).toHaveBeenCalledWith(createDto);
      expect(createDto.company_id).toBeUndefined();
      expect(result).toEqual({
        data: mockMailTemplate,
        message: 'Template créé avec succès',
      });
    });

    it('should handle creation errors', async () => {
      const createDto: CreateMailTemplateDto = {
        template_type: TemplateType.INVITE_USER,
        subject: '',
        html_body: '<p>Invalid template</p>',
      };
      const error = new Error('Validation failed');
      mockMailTemplateService.createTemplate.mockRejectedValue(error);

      await expect(controller.createTemplate(createDto, mockAdmin)).rejects.toThrow(error);
    });
  });

  describe('updateTemplate', () => {
    it('should update template', async () => {
      const updateDto: UpdateMailTemplateDto = {
        subject: 'Updated subject',
        is_active: false,
      };
      const updatedTemplate = { ...mockMailTemplate, subject: 'Updated subject', is_active: false };
      mockMailTemplateService.updateTemplate.mockResolvedValue(updatedTemplate);

      const result = await controller.updateTemplate('template-123', updateDto);

      expect(service.updateTemplate).toHaveBeenCalledWith('template-123', updateDto);
      expect(result).toEqual({
        data: updatedTemplate,
        message: 'Template mis à jour avec succès',
      });
    });

    it('should handle update errors', async () => {
      const updateDto: UpdateMailTemplateDto = { subject: 'Updated' };
      const error = new Error('Update failed');
      mockMailTemplateService.updateTemplate.mockRejectedValue(error);

      await expect(controller.updateTemplate('template-123', updateDto)).rejects.toThrow(error);
      expect(service.updateTemplate).toHaveBeenCalledWith('template-123', updateDto);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template', async () => {
      mockMailTemplateService.deleteTemplate.mockResolvedValue(undefined);

      const result = await controller.deleteTemplate('template-123');

      expect(service.deleteTemplate).toHaveBeenCalledWith('template-123');
      expect(result).toEqual({ message: 'Template supprimé avec succès' });
    });

    it('should handle delete errors', async () => {
      const error = new Error('Template not found');
      mockMailTemplateService.deleteTemplate.mockRejectedValue(error);

      await expect(controller.deleteTemplate('template-123')).rejects.toThrow(error);
      expect(service.deleteTemplate).toHaveBeenCalledWith('template-123');
    });
  });

  describe('duplicateTemplate', () => {
    it('should duplicate template with custom subject', async () => {
      const duplicatedTemplate = { ...mockMailTemplate, id: 'template-456', subject: 'Copy of Welcome' };
      mockMailTemplateService.duplicateTemplate.mockResolvedValue(duplicatedTemplate);

      const result = await controller.duplicateTemplate('template-123', { subject: 'Copy of Welcome' });

      expect(service.duplicateTemplate).toHaveBeenCalledWith('template-123', 'Copy of Welcome');
      expect(result).toEqual({
        data: duplicatedTemplate,
        message: 'Template dupliqué avec succès',
      });
    });

    it('should duplicate template without custom subject', async () => {
      const duplicatedTemplate = { ...mockMailTemplate, id: 'template-456' };
      mockMailTemplateService.duplicateTemplate.mockResolvedValue(duplicatedTemplate);

      const result = await controller.duplicateTemplate('template-123', {});

      expect(service.duplicateTemplate).toHaveBeenCalledWith('template-123', undefined);
      expect(result).toEqual({
        data: duplicatedTemplate,
        message: 'Template dupliqué avec succès',
      });
    });

    it('should handle duplication errors', async () => {
      const error = new Error('Original template not found');
      mockMailTemplateService.duplicateTemplate.mockRejectedValue(error);

      await expect(controller.duplicateTemplate('template-123', {})).rejects.toThrow(error);
      expect(service.duplicateTemplate).toHaveBeenCalledWith('template-123', undefined);
    });
  });

  describe('renderTemplate', () => {
    it('should render template with variables', async () => {
      const renderData = {
        template_type: TemplateType.CONFIRM_SIGNUP,
        variables: { user_name: 'John Doe', email: 'john@example.com' },
        company_id: 'company-123',
      };
      const renderedResult = {
        subject: 'Welcome John Doe!',
        html_body: '<p>Welcome John Doe!</p>',
        text_body: 'Welcome John Doe!',
      };
      mockMailTemplateService.renderTemplate.mockResolvedValue(renderedResult);

      const result = await controller.renderTemplate(renderData);

      expect(service.renderTemplate).toHaveBeenCalledWith(
        TemplateType.CONFIRM_SIGNUP,
        { user_name: 'John Doe', email: 'john@example.com' },
        'company-123'
      );
      expect(result).toEqual({ data: renderedResult });
    });

    it('should render template without company_id', async () => {
      const renderData = {
        template_type: TemplateType.MAGIC_LINK,
        variables: { magic_link: 'https://example.com/login?token=abc' },
      };
      const renderedResult = {
        subject: 'Login Link',
        html_body: '<a href="https://example.com/login?token=abc">Login</a>',
        text_body: 'Login: https://example.com/login?token=abc',
      };
      mockMailTemplateService.renderTemplate.mockResolvedValue(renderedResult);

      const result = await controller.renderTemplate(renderData);

      expect(service.renderTemplate).toHaveBeenCalledWith(
        TemplateType.MAGIC_LINK,
        { magic_link: 'https://example.com/login?token=abc' },
        undefined
      );
      expect(result).toEqual({ data: renderedResult });
    });

    it('should handle render errors', async () => {
      const renderData = {
        template_type: TemplateType.CONFIRM_SIGNUP,
        variables: {},
      };
      const error = new Error('Template not found');
      mockMailTemplateService.renderTemplate.mockRejectedValue(error);

      await expect(controller.renderTemplate(renderData)).rejects.toThrow(error);
      expect(service.renderTemplate).toHaveBeenCalledWith(TemplateType.CONFIRM_SIGNUP, {}, undefined);
    });
  });

  describe('createDefaultTemplates', () => {
    it('should create default templates (super admin only)', async () => {
      mockMailTemplateService.createDefaultTemplates.mockResolvedValue(undefined);

      const result = await controller.createDefaultTemplates();

      expect(service.createDefaultTemplates).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Templates par défaut créés avec succès' });
    });

    it('should handle creation errors', async () => {
      const error = new Error('Default template creation failed');
      mockMailTemplateService.createDefaultTemplates.mockRejectedValue(error);

      await expect(controller.createDefaultTemplates()).rejects.toThrow(error);
      expect(service.createDefaultTemplates).toHaveBeenCalled();
    });
  });

  describe('Authentication and Authorization', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MailTemplateController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should be protected by RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MailTemplateController);
      expect(guards).toContain(RolesGuard);
    });

    it('should allow SUPER_ADMIN and ADMIN roles', () => {
      const roles = Reflect.getMetadata('roles', MailTemplateController);
      expect(roles).toContain(UserRole.SUPER_ADMIN);
      expect(roles).toContain(UserRole.ADMIN);
    });

    it('should require SUPER_ADMIN role for createDefaultTemplates', () => {
      const roles = Reflect.getMetadata('roles', controller.createDefaultTemplates);
      expect(roles).toContain(UserRole.SUPER_ADMIN);
    });
  });

  describe('Private Helper Methods', () => {
    it('should return correct type labels', () => {
      expect(controller['getTypeLabel'](TemplateType.CONFIRM_SIGNUP)).toBe("Confirmation d'inscription");
      expect(controller['getTypeLabel'](TemplateType.INVITE_USER)).toBe('Invitation utilisateur');
      expect(controller['getTypeLabel'](TemplateType.MAGIC_LINK)).toBe('Lien magique');
      expect(controller['getTypeLabel'](TemplateType.RESET_PASSWORD)).toBe('Réinitialisation mot de passe');
    });

    it('should return correct type descriptions', () => {
      expect(controller['getTypeDescription'](TemplateType.CONFIRM_SIGNUP)).toBe(
        "Email envoyé pour confirmer l'inscription d'un nouvel utilisateur"
      );
      expect(controller['getTypeDescription'](TemplateType.INVITE_USER)).toBe(
        "Email d'invitation pour rejoindre une équipe"
      );
      expect(controller['getTypeDescription'](TemplateType.MAGIC_LINK)).toBe(
        'Email avec lien de connexion sans mot de passe'
      );
    });

    it('should handle unknown template types', () => {
      const unknownType = 'unknown_type' as TemplateType;
      expect(controller['getTypeLabel'](unknownType)).toBe('unknown_type');
      expect(controller['getTypeDescription'](unknownType)).toBe('');
    });
  });
});