import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { AnalysisQueueService } from './analysis-queue.service';
import { ProjectsService } from '../projects/projects.service';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyGuard } from '../auth/guards/company.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CandidatesController', () => {
  let controller: CandidatesController;
  let candidatesService: CandidatesService;
  let analysisQueueService: AnalysisQueueService;
  let projectsService: ProjectsService;
  let mailService: MailService;

  const mockCandidatesService = {
    findAll: jest.fn(),
    findByProject: jest.fn(),
    findOne: jest.fn(),
    findCandidateInProject: jest.fn(),
    uploadCV: jest.fn(),
    analyzeCandidate: jest.fn(),
    getRankingChanges: jest.fn(),
  };

  const mockAnalysisQueueService = {
    getQueueStatus: jest.fn(),
  };

  const mockProjectsService = {
    findOne: jest.fn(),
  };

  const mockMailService = {
    sendEmail: jest.fn(),
    sendEmailWithAttachments: jest.fn(),
  };

  const mockGuards = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockCompanyId = 'company-uuid-1';
  const mockProjectId = 'project-uuid-1';
  const mockCandidateId = 'candidate-uuid-1';

  const mockCandidate = {
    id: mockCandidateId,
    name: 'John Doe',
    email: 'john.doe@example.com',
    projectId: mockProjectId,
    score: 85,
    status: 'analyzed',
  };

  const mockProject = {
    id: mockProjectId,
    name: 'Test Project',
    company_id: mockCompanyId,
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'files',
    originalname: 'cv-john-doe.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024 * 1024, // 1MB
    destination: '',
    filename: 'cv-john-doe.pdf',
    path: '',
    buffer: Buffer.from('mock pdf content'),
    stream: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidatesController],
      providers: [
        {
          provide: CandidatesService,
          useValue: mockCandidatesService,
        },
        {
          provide: AnalysisQueueService,
          useValue: mockAnalysisQueueService,
        },
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuards)
      .overrideGuard(CompanyGuard)
      .useValue(mockGuards)
      .compile();

    controller = module.get<CandidatesController>(CandidatesController);
    candidatesService = module.get<CandidatesService>(CandidatesService);
    analysisQueueService = module.get<AnalysisQueueService>(AnalysisQueueService);
    projectsService = module.get<ProjectsService>(ProjectsService);
    mailService = module.get<MailService>(MailService);

    // Setup default mock return values
    mockMailService.sendEmailWithAttachments.mockResolvedValue({
      success: true,
      message: `Email envoyé avec succès à ${mockCandidate.email}`,
      candidateId: mockCandidate.id,
      attachmentCount: 0
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    const mockPaginatedResponse = {
      data: [mockCandidate],
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    };

    it('should return all candidates for company with default parameters', async () => {
      mockCandidatesService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(mockCompanyId);

      expect(mockCandidatesService.findAll).toHaveBeenCalledWith(
        mockCompanyId,
        1,
        50,
        { search: undefined, status: undefined, scoreFilter: undefined }
      );
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should return candidates for specific project when projectId provided', async () => {
      mockCandidatesService.findByProject.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(
        mockCompanyId,
        mockProjectId,
        '2',
        '20',
        'developer',
        'analyzed',
        'excellent'
      );

      expect(mockCandidatesService.findByProject).toHaveBeenCalledWith(
        mockProjectId,
        mockCompanyId,
        2,
        20,
        { search: 'developer', status: 'analyzed', scoreFilter: 'excellent' }
      );
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle invalid page and limit parameters', async () => {
      mockCandidatesService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(
        mockCompanyId,
        undefined,
        'invalid',
        'invalid'
      );

      expect(mockCandidatesService.findAll).toHaveBeenCalledWith(
        mockCompanyId,
        1, // NaN defaults to 1
        50, // NaN defaults to 50
        { search: undefined, status: undefined, scoreFilter: undefined }
      );
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return specific candidate', async () => {
      mockCandidatesService.findOne.mockResolvedValue(mockCandidate);

      const result = await controller.findOne(mockCandidateId, mockCompanyId);

      expect(mockCandidatesService.findOne).toHaveBeenCalledWith(mockCandidateId, mockCompanyId);
      expect(result).toEqual(mockCandidate);
    });

    it('should handle candidate not found', async () => {
      const error = new NotFoundException('Candidate not found');
      mockCandidatesService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(mockCandidateId, mockCompanyId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findCandidateInProject', () => {
    it('should return candidate in specific project', async () => {
      mockCandidatesService.findCandidateInProject.mockResolvedValue(mockCandidate);

      const result = await controller.findCandidateInProject(
        mockProjectId,
        mockCandidateId,
        mockCompanyId
      );

      expect(mockCandidatesService.findCandidateInProject).toHaveBeenCalledWith(
        mockProjectId,
        mockCandidateId,
        mockCompanyId
      );
      expect(result).toEqual(mockCandidate);
    });
  });

  describe('uploadCVs', () => {
    const mockFiles = [mockFile, { ...mockFile, originalname: 'cv-jane-smith.pdf' }];

    it('should upload multiple CV files successfully', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);
      mockCandidatesService.uploadCV
        .mockResolvedValueOnce({ id: 'candidate-1', name: 'John Doe' })
        .mockResolvedValueOnce({ id: 'candidate-2', name: 'Jane Smith' });

      const result = await controller.uploadCVs(mockProjectId, mockFiles, mockCompanyId);

      expect(mockProjectsService.findOne).toHaveBeenCalledWith(mockProjectId, mockCompanyId);
      expect(mockCandidatesService.uploadCV).toHaveBeenCalledTimes(2);
      expect(mockCandidatesService.uploadCV).toHaveBeenNthCalledWith(1, mockFiles[0], mockProjectId, mockProject);
      expect(mockCandidatesService.uploadCV).toHaveBeenNthCalledWith(2, mockFiles[1], mockProjectId, mockProject);

      expect(result).toEqual({
        successful: 2,
        failed: 0,
        total: 2,
        candidates: [
          { id: 'candidate-1', name: 'John Doe' },
          { id: 'candidate-2', name: 'Jane Smith' },
        ],
        errors: [],
      });
    });

    it('should handle partial upload failures', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);
      mockCandidatesService.uploadCV
        .mockResolvedValueOnce({ id: 'candidate-1', name: 'John Doe' })
        .mockRejectedValueOnce(new Error('Invalid PDF format'));

      const result = await controller.uploadCVs(mockProjectId, mockFiles, mockCompanyId);

      expect(result).toEqual({
        successful: 1,
        failed: 1,
        total: 2,
        candidates: [{ id: 'candidate-1', name: 'John Doe' }],
        errors: [
          {
            filename: 'cv-john-doe.pdf',
            error: 'Invalid PDF format',
          },
        ],
      });
    });

    it('should handle project not found', async () => {
      const error = new NotFoundException('Project not found');
      mockProjectsService.findOne.mockRejectedValue(error);

      await expect(controller.uploadCVs(mockProjectId, mockFiles, mockCompanyId)).rejects.toThrow(NotFoundException);
    });

    it('should handle empty files array', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);

      const result = await controller.uploadCVs(mockProjectId, [], mockCompanyId);

      expect(result).toEqual({
        successful: 0,
        failed: 0,
        total: 0,
        candidates: [],
        errors: [],
      });
    });
  });

  describe('analyzeCandidate', () => {
    it('should start candidate analysis', async () => {
      mockCandidatesService.analyzeCandidate.mockResolvedValue(undefined);

      const result = await controller.analyzeCandidate(mockCandidateId, mockCompanyId);

      expect(mockCandidatesService.analyzeCandidate).toHaveBeenCalledWith(mockCandidateId, mockCompanyId);
      expect(result).toEqual({ message: 'Analysis started' });
    });

    it('should handle analysis errors', async () => {
      const error = new Error('Analysis failed');
      mockCandidatesService.analyzeCandidate.mockRejectedValue(error);

      await expect(controller.analyzeCandidate(mockCandidateId, mockCompanyId)).rejects.toThrow('Analysis failed');
    });
  });

  describe('getRankingChanges', () => {
    it('should return ranking changes for project', async () => {
      const rankingChanges = [
        { candidateId: 'candidate-1', oldRanking: 2, newRanking: 1, change: 'up' },
        { candidateId: 'candidate-2', oldRanking: 1, newRanking: 3, change: 'down' },
      ];
      mockCandidatesService.getRankingChanges.mockResolvedValue(rankingChanges);

      const result = await controller.getRankingChanges(mockProjectId, mockCompanyId);

      expect(mockCandidatesService.getRankingChanges).toHaveBeenCalledWith(mockProjectId, mockCompanyId);
      expect(result).toEqual(rankingChanges);
    });
  });

  describe('getQueueStatus', () => {
    it('should return analysis queue status', async () => {
      const queueStatus = {
        projectId: mockProjectId,
        pending: 3,
        processing: 1,
        completed: 5,
        failed: 0,
      };
      mockAnalysisQueueService.getQueueStatus.mockResolvedValue(queueStatus);

      const result = await controller.getQueueStatus(mockProjectId);

      expect(mockAnalysisQueueService.getQueueStatus).toHaveBeenCalledWith(mockProjectId);
      expect(result).toEqual(queueStatus);
    });
  });

  describe('sendEmailToCandidate', () => {
    const emailData = {
      to: 'john.doe@example.com',
      subject: 'Interview Invitation',
      message: 'Hello John, we would like to invite you for an interview.',
    };

    const mockAttachments = [
      {
        fieldname: 'attachments',
        originalname: 'job-description.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        destination: '',
        filename: 'job-description.pdf',
        path: '',
        buffer: Buffer.from('attachment content'),
        stream: null,
      },
    ];

    it('should send email to candidate without attachments', async () => {
      mockCandidatesService.findOne.mockResolvedValue(mockCandidate);
      mockMailService.sendEmail.mockResolvedValue({ success: true });

      const result = await controller.sendEmailToCandidate(
        mockCandidateId,
        mockCompanyId,
        emailData
      );

      expect(mockCandidatesService.findOne).toHaveBeenCalledWith(mockCandidateId, mockCompanyId);
      expect(mockMailService.sendEmailWithAttachments).toHaveBeenCalledWith({
        to: emailData.to,
        subject: emailData.subject,
        html: expect.stringContaining('Hello John'),
        companyId: mockCompanyId,
        candidateId: mockCandidateId,
        attachments: [],
      });
      expect(result).toEqual({
        success: true,
        message: 'Email envoyé avec succès à john.doe@example.com',
        candidateId: mockCandidateId,
        attachmentCount: 0
      });
    });

    it('should send email to candidate with attachments', async () => {
      mockCandidatesService.findOne.mockResolvedValue(mockCandidate);
      mockMailService.sendEmail.mockResolvedValue({ success: true });

      const result = await controller.sendEmailToCandidate(
        mockCandidateId,
        mockCompanyId,
        emailData,
        mockAttachments
      );

      expect(mockMailService.sendEmailWithAttachments).toHaveBeenCalledWith({
        to: emailData.to,
        subject: emailData.subject,
        html: expect.stringContaining('Hello John'),
        companyId: mockCompanyId,
        candidateId: mockCandidateId,
        attachments: [
          {
            filename: 'job-description.pdf',
            content: mockAttachments[0].buffer,
            contentType: 'application/pdf',
          },
        ],
      });
      expect(result).toEqual({
        success: true,
        message: 'Email envoyé avec succès à john.doe@example.com',
        candidateId: mockCandidateId,
        attachmentCount: 1
      });
    });

    it('should handle candidate not found', async () => {
      mockCandidatesService.findOne.mockResolvedValue(null);

      await expect(
        controller.sendEmailToCandidate(mockCandidateId, mockCompanyId, emailData)
      ).rejects.toThrow('Candidat non trouvé');

      expect(mockMailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should handle email sending errors', async () => {
      mockCandidatesService.findOne.mockResolvedValue(mockCandidate);
      const error = new Error('Email service unavailable');
      mockMailService.sendEmailWithAttachments.mockRejectedValue(error);

      await expect(
        controller.sendEmailToCandidate(mockCandidateId, mockCompanyId, emailData)
      ).rejects.toThrow('Email service unavailable');
    });
  });
});