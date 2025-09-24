import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController, PublicProjectsController, PublicJobOffersController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyGuard } from '../auth/guards/company.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../auth/entities/user.entity';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let projectsService: ProjectsService;

  const mockProjectsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getProjectStats: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    generateShareLink: jest.fn(),
    revokeShare: jest.fn(),
    uploadOfferDocument: jest.fn(),
    uploadOfferImage: jest.fn(),
    getSharedProject: jest.fn(),
    getSharedProjectCandidates: jest.fn(),
  };

  const mockGuards = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    role: UserRole.ADMIN,
  };

  const mockCompanyId = 'company-uuid-1';

  const mockProject = {
    id: 'project-uuid-1',
    name: 'Test Project',
    jobDescription: 'Test job description',
    company_id: mockCompanyId,
    created_by: mockUser.id,
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'document',
    originalname: 'offer.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    destination: './uploads/offers',
    filename: 'offer-123.pdf',
    path: './uploads/offers/offer-123.pdf',
    buffer: Buffer.from('test'),
    stream: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuards)
      .overrideGuard(CompanyGuard)
      .useValue(mockGuards)
      .overrideGuard(RolesGuard)
      .useValue(mockGuards)
      .compile();

    controller = module.get<ProjectsController>(ProjectsController);
    projectsService = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createProjectDto: CreateProjectDto = {
      name: 'New Project',
      jobDescription: 'Looking for a developer',
      status: 'active',
    };

    it('should create a new project', async () => {
      mockProjectsService.create.mockResolvedValue(mockProject);

      const result = await controller.create(createProjectDto, mockCompanyId, mockUser);

      expect(mockProjectsService.create).toHaveBeenCalledWith(createProjectDto, mockCompanyId, mockUser.id);
      expect(result).toEqual(mockProject);
    });

    it('should handle service errors', async () => {
      const error = new Error('Creation failed');
      mockProjectsService.create.mockRejectedValue(error);

      await expect(controller.create(createProjectDto, mockCompanyId, mockUser)).rejects.toThrow('Creation failed');
    });
  });

  describe('findAll', () => {
    it('should return all projects for company', async () => {
      const projects = [mockProject];
      mockProjectsService.findAll.mockResolvedValue(projects);

      const result = await controller.findAll(mockCompanyId);

      expect(mockProjectsService.findAll).toHaveBeenCalledWith(mockCompanyId);
      expect(result).toEqual(projects);
    });

    it('should return empty array when no projects found', async () => {
      mockProjectsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockCompanyId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const projectId = 'project-uuid-1';

    it('should return specific project', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne(projectId, mockCompanyId);

      expect(mockProjectsService.findOne).toHaveBeenCalledWith(projectId, mockCompanyId);
      expect(result).toEqual(mockProject);
    });

    it('should handle project not found', async () => {
      const error = new Error('Project not found');
      mockProjectsService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(projectId, mockCompanyId)).rejects.toThrow('Project not found');
    });
  });

  describe('getStats', () => {
    const projectId = 'project-uuid-1';

    it('should return project statistics', async () => {
      const stats = {
        totalCandidates: 10,
        analyzedCandidates: 8,
        averageScore: 75,
        scoreDistribution: { excellent: 2, good: 4, average: 2, poor: 2 },
      };
      mockProjectsService.getProjectStats.mockResolvedValue(stats);

      const result = await controller.getStats(projectId, mockCompanyId);

      expect(mockProjectsService.getProjectStats).toHaveBeenCalledWith(projectId, mockCompanyId);
      expect(result).toEqual(stats);
    });
  });

  describe('update', () => {
    const projectId = 'project-uuid-1';
    const updateProjectDto: UpdateProjectDto = {
      name: 'Updated Project Name',
      status: 'closed',
    };

    it('should update project', async () => {
      const updatedProject = { ...mockProject, ...updateProjectDto };
      mockProjectsService.update.mockResolvedValue(updatedProject);

      const result = await controller.update(projectId, updateProjectDto, mockCompanyId);

      expect(mockProjectsService.update).toHaveBeenCalledWith(projectId, updateProjectDto, mockCompanyId);
      expect(result).toEqual(updatedProject);
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      mockProjectsService.update.mockRejectedValue(error);

      await expect(controller.update(projectId, updateProjectDto, mockCompanyId)).rejects.toThrow('Update failed');
    });
  });

  describe('remove', () => {
    const projectId = 'project-uuid-1';

    it('should delete project', async () => {
      mockProjectsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(projectId, mockCompanyId);

      expect(mockProjectsService.remove).toHaveBeenCalledWith(projectId, mockCompanyId);
      expect(result).toBeUndefined();
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Deletion failed');
      mockProjectsService.remove.mockRejectedValue(error);

      await expect(controller.remove(projectId, mockCompanyId)).rejects.toThrow('Deletion failed');
    });
  });

  describe('generateShareLink', () => {
    const projectId = 'project-uuid-1';
    const expirationDays = 7;

    it('should generate share link with expiration', async () => {
      const shareLink = { token: 'share-token-123', expiresAt: new Date() };
      mockProjectsService.generateShareLink.mockResolvedValue(shareLink);

      const result = await controller.generateShareLink(projectId, mockCompanyId, expirationDays);

      expect(mockProjectsService.generateShareLink).toHaveBeenCalledWith(projectId, mockCompanyId, expirationDays);
      expect(result).toEqual(shareLink);
    });

    it('should generate share link without expiration', async () => {
      const shareLink = { token: 'share-token-123', expiresAt: null };
      mockProjectsService.generateShareLink.mockResolvedValue(shareLink);

      const result = await controller.generateShareLink(projectId, mockCompanyId);

      expect(mockProjectsService.generateShareLink).toHaveBeenCalledWith(projectId, mockCompanyId, undefined);
      expect(result).toEqual(shareLink);
    });
  });

  describe('revokeShare', () => {
    const projectId = 'project-uuid-1';

    it('should revoke share access', async () => {
      const result_response = { success: true };
      mockProjectsService.revokeShare.mockResolvedValue(result_response);

      const result = await controller.revokeShare(projectId, mockCompanyId);

      expect(mockProjectsService.revokeShare).toHaveBeenCalledWith(projectId, mockCompanyId);
      expect(result).toEqual(result_response);
    });
  });

  describe('uploadOfferDocument', () => {
    const projectId = 'project-uuid-1';

    it('should upload offer document', async () => {
      const uploadResult = { documentUrl: '/uploads/offers/offer-123.pdf' };
      mockProjectsService.uploadOfferDocument.mockResolvedValue(uploadResult);

      const result = await controller.uploadOfferDocument(projectId, mockCompanyId, mockFile);

      expect(mockProjectsService.uploadOfferDocument).toHaveBeenCalledWith(projectId, mockCompanyId, mockFile);
      expect(result).toEqual(uploadResult);
    });

    it('should handle upload errors', async () => {
      const error = new Error('Upload failed');
      mockProjectsService.uploadOfferDocument.mockRejectedValue(error);

      await expect(controller.uploadOfferDocument(projectId, mockCompanyId, mockFile)).rejects.toThrow('Upload failed');
    });
  });

  describe('uploadOfferImage', () => {
    const projectId = 'project-uuid-1';
    const imageFile: Express.Multer.File = {
      ...mockFile,
      fieldname: 'image',
      originalname: 'offer-image.jpg',
      mimetype: 'image/jpeg',
      filename: 'offer-image-123.jpg',
    };

    it('should upload offer image', async () => {
      const uploadResult = { imageUrl: '/uploads/offers/offer-image-123.jpg' };
      mockProjectsService.uploadOfferImage.mockResolvedValue(uploadResult);

      const result = await controller.uploadOfferImage(projectId, mockCompanyId, imageFile);

      expect(mockProjectsService.uploadOfferImage).toHaveBeenCalledWith(projectId, mockCompanyId, imageFile);
      expect(result).toEqual(uploadResult);
    });
  });
});

describe('PublicProjectsController', () => {
  let publicController: PublicProjectsController;
  let projectsService: ProjectsService;

  const mockProjectsService = {
    getSharedProject: jest.fn(),
    getSharedProjectCandidates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    publicController = module.get<PublicProjectsController>(PublicProjectsController);
    projectsService = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(publicController).toBeDefined();
  });

  describe('getSharedProject', () => {
    const token = 'share-token-123';

    it('should return shared project', async () => {
      const sharedProject = { id: 'project-1', name: 'Shared Project', isShared: true };
      mockProjectsService.getSharedProject.mockResolvedValue(sharedProject);

      const result = await publicController.getSharedProject(token);

      expect(mockProjectsService.getSharedProject).toHaveBeenCalledWith(token);
      expect(result).toEqual(sharedProject);
    });

    it('should handle invalid token', async () => {
      const error = new Error('Invalid or expired token');
      mockProjectsService.getSharedProject.mockRejectedValue(error);

      await expect(publicController.getSharedProject(token)).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('getSharedProjectCandidates', () => {
    const token = 'share-token-123';

    it('should return paginated candidates with default parameters', async () => {
      const candidatesResponse = {
        data: [{ id: 'candidate-1', name: 'John Doe' }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockProjectsService.getSharedProjectCandidates.mockResolvedValue(candidatesResponse);

      const result = await publicController.getSharedProjectCandidates(token);

      expect(mockProjectsService.getSharedProjectCandidates).toHaveBeenCalledWith(
        token,
        1,
        20,
        { search: undefined, status: undefined, scoreFilter: undefined }
      );
      expect(result).toEqual(candidatesResponse);
    });

    it('should return paginated candidates with custom parameters', async () => {
      const candidatesResponse = {
        data: [{ id: 'candidate-1', name: 'Jane Smith' }],
        total: 5,
        page: 2,
        limit: 10,
        totalPages: 1,
      };
      mockProjectsService.getSharedProjectCandidates.mockResolvedValue(candidatesResponse);

      const result = await publicController.getSharedProjectCandidates(
        token,
        '2',
        '10',
        'developer',
        'analyzed',
        'excellent'
      );

      expect(mockProjectsService.getSharedProjectCandidates).toHaveBeenCalledWith(
        token,
        2,
        10,
        { search: 'developer', status: 'analyzed', scoreFilter: 'excellent' }
      );
      expect(result).toEqual(candidatesResponse);
    });

    it('should handle invalid query parameters', async () => {
      const candidatesResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
      mockProjectsService.getSharedProjectCandidates.mockResolvedValue(candidatesResponse);

      const result = await publicController.getSharedProjectCandidates(
        token,
        'invalid',
        'invalid'
      );

      expect(mockProjectsService.getSharedProjectCandidates).toHaveBeenCalledWith(
        token,
        1, // NaN defaults to 1
        20, // NaN defaults to 20
        { search: undefined, status: undefined, scoreFilter: undefined }
      );
      expect(result).toEqual(candidatesResponse);
    });
  });
});