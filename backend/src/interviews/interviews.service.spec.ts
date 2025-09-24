import { Test, TestingModule } from '@nestjs/testing';
import { InterviewsService } from './interviews.service';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Interview, InterviewStatus, InterviewType } from './entities/interview.entity';
import { InterviewParticipant, ParticipantStatus, ParticipantRole } from './entities/interview-participant.entity';
import { InterviewEvaluation, EvaluationRecommendation } from './entities/interview-evaluation.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../auth/entities/user.entity';
import { CreateInterviewDto, UpdateInterviewDto, CreateInterviewEvaluationDto } from './dto';
import { CalendarService } from '../calendar/calendar.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException, BadRequestException, Logger } from '@nestjs/common';

describe('InterviewsService', () => {
  let service: InterviewsService;
  let interviewRepository: Repository<Interview>;
  let participantRepository: Repository<InterviewParticipant>;
  let evaluationRepository: Repository<InterviewEvaluation>;
  let candidateRepository: Repository<Candidate>;
  let projectRepository: Repository<Project>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let calendarService: CalendarService;
  let notificationsService: NotificationsService;

  const mockInterview = {
    id: 'interview-uuid-1',
    title: 'Technical Interview',
    description: 'Frontend development assessment',
    scheduled_at: new Date('2023-12-01T10:00:00Z'),
    started_at: null,
    ended_at: null,
    duration_minutes: 60,
    status: InterviewStatus.SCHEDULED,
    type: 'video_call',
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    meeting_id: 'abc-defg-hij',
    notes: '',
    agenda: 'Technical questions and coding challenge',
    evaluation_criteria: {},
    calendar_invites_sent: false,
    reminder_sent: false,
    candidate_id: 'candidate-uuid-1',
    project_id: 'project-uuid-1',
    created_by: 'user-uuid-1',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockCandidate = {
    id: 'candidate-uuid-1',
    name: 'John Doe',
    email: 'john@example.com',
    projectId: 'project-uuid-1',
  };

  const mockProject = {
    id: 'project-uuid-1',
    name: 'Frontend Developer Position',
    company_id: 'company-uuid-1',
  };

  const mockUser = {
    id: 'user-uuid-1',
    name: 'Jane Smith',
    email: 'jane@company.com',
    company_id: 'company-uuid-1',
  };

  const mockParticipant = {
    id: 'participant-uuid-1',
    role: 'interviewer',
    status: ParticipantStatus.INVITED,
    is_required: true,
    notes: '',
    calendar_invite_sent: false,
    interview_id: 'interview-uuid-1',
    user_id: 'user-uuid-1',
  };

  const mockEvaluation = {
    id: 'evaluation-uuid-1',
    criteria_scores: { technical: 8, communication: 9 },
    overall_score: 8.5,
    strengths: 'Strong technical skills',
    weaknesses: 'Could improve on system design',
    comments: 'Good candidate overall',
    recommendation: EvaluationRecommendation.HIRE,
    confidence_level: 8,
    is_completed: true,
    interview_id: 'interview-uuid-1',
    evaluator_id: 'user-uuid-1',
  };

  const mockInterviewRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  };

  const mockParticipantRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockEvaluationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCandidateRepository = {
    findOne: jest.fn(),
  };

  const mockProjectRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockTransactionManager = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCalendarService = {
    checkConflicts: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
    sendInvites: jest.fn(),
  };

  const mockNotificationsService = {
    sendInterviewNotification: jest.fn(),
    sendReminderNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewsService,
        {
          provide: getRepositoryToken(Interview),
          useValue: mockInterviewRepository,
        },
        {
          provide: getRepositoryToken(InterviewParticipant),
          useValue: mockParticipantRepository,
        },
        {
          provide: getRepositoryToken(InterviewEvaluation),
          useValue: mockEvaluationRepository,
        },
        {
          provide: getRepositoryToken(Candidate),
          useValue: mockCandidateRepository,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<InterviewsService>(InterviewsService);
    interviewRepository = module.get<Repository<Interview>>(getRepositoryToken(Interview));
    participantRepository = module.get<Repository<InterviewParticipant>>(getRepositoryToken(InterviewParticipant));
    evaluationRepository = module.get<Repository<InterviewEvaluation>>(getRepositoryToken(InterviewEvaluation));
    candidateRepository = module.get<Repository<Candidate>>(getRepositoryToken(Candidate));
    projectRepository = module.get<Repository<Project>>(getRepositoryToken(Project));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
    calendarService = module.get<CalendarService>(CalendarService);
    notificationsService = module.get<NotificationsService>(NotificationsService);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createInterviewDto: CreateInterviewDto = {
      title: 'Technical Interview',
      description: 'Frontend development assessment',
      scheduled_at: new Date('2023-12-01T10:00:00Z'),
      duration_minutes: 60,
      type: InterviewType.VIDEO_CALL,
      candidate_id: 'candidate-uuid-1',
      project_id: 'project-uuid-1',
      participants: [
        {
          user_id: 'user-uuid-1',
          role: ParticipantRole.INTERVIEWER,
          is_required: true,
        },
      ],
    };

    it('should create interview successfully', async () => {
      mockTransactionManager.findOne
        .mockResolvedValueOnce(mockCandidate) // Candidate lookup
        .mockResolvedValueOnce(mockProject); // Project lookup

      mockTransactionManager.create
        .mockReturnValueOnce(mockInterview) // Interview creation
        .mockReturnValueOnce(mockParticipant); // Participant creation

      mockTransactionManager.save
        .mockResolvedValueOnce(mockInterview) // Interview save
        .mockResolvedValueOnce([mockParticipant]); // Participants save

      mockCalendarService.checkConflicts.mockResolvedValue({
        hasConflicts: false,
        conflicts: [],
      });

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionManager);
      });

      const result = await service.create(createInterviewDto, 'user-uuid-1');

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockTransactionManager.findOne).toHaveBeenCalledTimes(2);
      expect(mockTransactionManager.create).toHaveBeenCalledTimes(2);
      expect(mockTransactionManager.save).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockInterview);
    });

    it('should handle candidate not found', async () => {
      mockTransactionManager.findOne.mockResolvedValueOnce(null); // Candidate not found

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionManager);
      });

      await expect(service.create(createInterviewDto, 'user-uuid-1')).rejects.toThrow(
        new NotFoundException('Candidate not found')
      );
    });

    it('should handle project not found', async () => {
      mockTransactionManager.findOne
        .mockResolvedValueOnce(mockCandidate) // Candidate found
        .mockResolvedValueOnce(null); // Project not found

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionManager);
      });

      await expect(service.create(createInterviewDto, 'user-uuid-1')).rejects.toThrow(
        new NotFoundException('Project not found')
      );
    });

    it('should handle calendar conflicts gracefully', async () => {
      mockTransactionManager.findOne
        .mockResolvedValueOnce(mockCandidate)
        .mockResolvedValueOnce(mockProject);

      mockTransactionManager.create.mockReturnValueOnce(mockInterview);
      mockTransactionManager.save.mockResolvedValueOnce(mockInterview);

      mockCalendarService.checkConflicts.mockResolvedValue({
        hasConflicts: true,
        conflicts: [{ start: '10:00', end: '11:00', summary: 'Another meeting' }],
      });

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionManager);
      });

      const result = await service.create(createInterviewDto, 'user-uuid-1');

      expect(result).toEqual(mockInterview);
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        expect.stringContaining('Conflicts detected')
      );
    });

    it('should handle calendar service errors gracefully', async () => {
      mockTransactionManager.findOne
        .mockResolvedValueOnce(mockCandidate)
        .mockResolvedValueOnce(mockProject);

      mockTransactionManager.create.mockReturnValueOnce(mockInterview);
      mockTransactionManager.save.mockResolvedValueOnce(mockInterview);

      mockCalendarService.checkConflicts.mockRejectedValue(new Error('Calendar service unavailable'));

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return await callback(mockTransactionManager);
      });

      const result = await service.create(createInterviewDto, 'user-uuid-1');

      expect(result).toEqual(mockInterview);
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        expect.stringContaining('Could not check conflicts')
      );
    });
  });

  describe('findAll', () => {
    it('should return all interviews', async () => {
      const interviews = [mockInterview];
      mockInterviewRepository.find.mockResolvedValue(interviews);

      const result = await service.findAll();

      expect(mockInterviewRepository.find).toHaveBeenCalledWith({
        relations: ['candidate', 'project', 'participants', 'participants.user', 'evaluations'],
        order: { scheduled_at: 'ASC' },
      });
      expect(result).toEqual(interviews);
    });
  });

  describe('findByProject', () => {
    it('should return interviews for a project', async () => {
      const interviews = [mockInterview];
      mockInterviewRepository.find.mockResolvedValue(interviews);

      const result = await service.findByProject('project-uuid-1');

      expect(mockInterviewRepository.find).toHaveBeenCalledWith({
        where: { project_id: 'project-uuid-1' },
        relations: ['candidate', 'project', 'participants', 'participants.user', 'evaluations', 'evaluations.evaluator'],
        order: { scheduled_at: 'ASC' },
      });
      expect(result).toEqual(interviews);
    });
  });

  describe('findByCandidate', () => {
    it('should return interviews for a candidate', async () => {
      const interviews = [mockInterview];
      mockInterviewRepository.find.mockResolvedValue(interviews);

      const result = await service.findByCandidate('candidate-uuid-1');

      expect(mockInterviewRepository.find).toHaveBeenCalledWith({
        where: { candidate_id: 'candidate-uuid-1' },
        relations: ['candidate', 'project', 'participants', 'participants.user', 'evaluations', 'evaluations.evaluator'],
        order: { scheduled_at: 'ASC' },
      });
      expect(result).toEqual(interviews);
    });
  });

  describe('findOne', () => {
    it('should return interview when found', async () => {
      mockInterviewRepository.findOne.mockResolvedValue(mockInterview);

      const result = await service.findOne('interview-uuid-1');

      expect(mockInterviewRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'interview-uuid-1' },
        relations: ['candidate', 'project', 'participants', 'participants.user', 'evaluations', 'evaluations.evaluator'],
      });
      expect(result).toEqual(mockInterview);
    });

    it('should throw NotFoundException when interview not found', async () => {
      mockInterviewRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new NotFoundException('Interview not found')
      );
    });
  });

  describe('update', () => {
    const updateInterviewDto: UpdateInterviewDto = {
      title: 'Updated Interview',
      duration_minutes: 90,
      status: InterviewStatus.IN_PROGRESS,
    };

    it('should update interview successfully', async () => {
      const updatedInterview = { ...mockInterview, ...updateInterviewDto };

      mockInterviewRepository.findOne.mockResolvedValue(mockInterview);
      mockInterviewRepository.save.mockResolvedValue(updatedInterview);

      const result = await service.update('interview-uuid-1', updateInterviewDto);

      expect(mockInterviewRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'interview-uuid-1' },
        relations: ['candidate', 'project', 'participants', 'participants.user', 'evaluations', 'evaluations.evaluator'],
      });
      expect(mockInterviewRepository.save).toHaveBeenCalledWith({
        ...mockInterview,
        ...updateInterviewDto,
      });
      expect(result).toEqual(updatedInterview);
    });

    it('should throw NotFoundException when interview not found', async () => {
      mockInterviewRepository.findOne.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateInterviewDto)).rejects.toThrow(
        new NotFoundException('Interview not found')
      );
    });
  });

  describe('remove', () => {
    it('should delete interview successfully', async () => {
      mockInterviewRepository.findOne.mockResolvedValue(mockInterview);
      mockInterviewRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('interview-uuid-1');

      expect(mockInterviewRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'interview-uuid-1' },
        relations: ['candidate', 'project', 'participants', 'participants.user', 'evaluations', 'evaluations.evaluator'],
      });
      expect(mockInterviewRepository.remove).toHaveBeenCalledWith(mockInterview);
    });

    it('should throw NotFoundException when interview not found', async () => {
      mockInterviewRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        new NotFoundException('Interview not found')
      );
    });
  });

  describe('createEvaluation', () => {
    const createEvaluationDto: CreateInterviewEvaluationDto = {
      interview_id: 'interview-uuid-1',
      criteria_scores: { technical: 8, communication: 9 },
      overall_score: 8.5,
      strengths: 'Strong technical skills',
      recommendation: EvaluationRecommendation.HIRE,
      is_completed: true,
    };

    it('should create evaluation successfully', async () => {
      mockInterviewRepository.findOne.mockResolvedValue(mockInterview);
      mockEvaluationRepository.create.mockReturnValue(mockEvaluation);
      mockEvaluationRepository.save.mockResolvedValue(mockEvaluation);

      const result = await service.createEvaluation(createEvaluationDto, 'user-uuid-1');

      expect(mockInterviewRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'interview-uuid-1' },
        relations: ['candidate', 'project', 'participants', 'participants.user', 'evaluations', 'evaluations.evaluator'],
      });
      expect(mockEvaluationRepository.create).toHaveBeenCalledWith({
        ...createEvaluationDto,
        evaluator_id: 'user-uuid-1',
      });
      expect(mockEvaluationRepository.save).toHaveBeenCalledWith(mockEvaluation);
      expect(result).toEqual(mockEvaluation);
    });

    it('should throw NotFoundException when interview not found', async () => {
      mockInterviewRepository.findOne.mockResolvedValue(null);

      await expect(service.createEvaluation(createEvaluationDto, 'user-uuid-1')).rejects.toThrow(
        new NotFoundException('Interview not found')
      );
    });
  });

  describe('getAvailableTimeSlots', () => {
    it('should return available time slots', async () => {
      const date = new Date('2023-12-01');
      const userIds = ['user-1', 'user-2'];
      const duration = 60;

      const availableSlots = [
        {
          start: new Date('2023-12-01T09:00:00Z'),
          end: new Date('2023-12-01T10:00:00Z'),
          available: true,
          conflicts: [],
        },
        {
          start: new Date('2023-12-01T14:00:00Z'),
          end: new Date('2023-12-01T15:00:00Z'),
          available: true,
          conflicts: [],
        },
      ];

      mockCalendarService.checkConflicts.mockResolvedValue({ hasConflicts: false, conflicts: [] });

      const result = await service.getAvailableTimeSlots(userIds, date, duration);

      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          available: true,
          conflicts: [],
        })
      ]));
      expect(result[0]).toEqual(expect.objectContaining({
        available: true,
        conflicts: [],
      }));
    });
  });
});