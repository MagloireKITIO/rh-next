import { Test, TestingModule } from '@nestjs/testing';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InterviewStatus } from './entities/interview.entity';
import { ParticipantStatus } from './entities/interview-participant.entity';

describe('InterviewsController', () => {
  let controller: InterviewsController;
  let service: InterviewsService;

  const mockInterviewsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByProject: jest.fn(),
    findByCandidate: jest.fn(),
    findByUser: jest.fn(),
    findByDateRange: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
    addParticipant: jest.fn(),
    updateParticipantStatus: jest.fn(),
    removeParticipant: jest.fn(),
    createEvaluation: jest.fn(),
    findEvaluationsByInterview: jest.fn(),
    updateEvaluation: jest.fn(),
    removeEvaluation: jest.fn(),
    getAvailableTimeSlots: jest.fn(),
    generateMeetingLink: jest.fn(),
    syncCalendar: jest.fn(),
    syncAttendeesStatus: jest.fn(),
    checkUserConflicts: jest.fn(),
    getCalendarEvents: jest.fn(),
    sendInterviewReminder: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      company_id: 'company-123',
    },
  };

  const mockInterview = {
    id: 'interview-123',
    title: 'Technical Interview',
    description: 'Frontend development interview',
    scheduled_at: new Date('2024-01-20T10:00:00Z'),
    duration: 60,
    location: 'Google Meet',
    status: InterviewStatus.SCHEDULED,
    project_id: 'project-123',
    candidate_id: 'candidate-123',
    created_by: 'user-123',
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewsController],
      providers: [
        {
          provide: InterviewsService,
          useValue: mockInterviewsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<InterviewsController>(InterviewsController);
    service = module.get<InterviewsService>(InterviewsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new interview', async () => {
      const createDto = {
        title: 'New Interview',
        scheduled_at: new Date(),
        duration: 60,
        project_id: 'project-123',
        candidate_id: 'candidate-123',
      };
      mockInterviewsService.create.mockResolvedValue(mockInterview);

      const result = await controller.create(createDto as any, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, 'user-123');
      expect(result).toEqual(mockInterview);
    });
  });

  describe('findAll', () => {
    it('should return all interviews', async () => {
      const interviews = [mockInterview];
      mockInterviewsService.findAll.mockResolvedValue(interviews);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(interviews);
    });
  });

  describe('findByProject', () => {
    it('should return interviews for a project', async () => {
      const interviews = [mockInterview];
      mockInterviewsService.findByProject.mockResolvedValue(interviews);

      const result = await controller.findByProject('project-123', mockRequest);

      expect(service.findByProject).toHaveBeenCalledWith('project-123');
      expect(result).toEqual(interviews);
    });

    it('should handle errors when finding by project', async () => {
      const error = new Error('Project not found');
      mockInterviewsService.findByProject.mockRejectedValue(error);

      await expect(controller.findByProject('project-123', mockRequest)).rejects.toThrow(error);
    });
  });

  describe('findByCandidate', () => {
    it('should return interviews for a candidate', async () => {
      const interviews = [mockInterview];
      mockInterviewsService.findByCandidate.mockResolvedValue(interviews);

      const result = await controller.findByCandidate('candidate-123');

      expect(service.findByCandidate).toHaveBeenCalledWith('candidate-123');
      expect(result).toEqual(interviews);
    });

    it('should handle errors when finding by candidate', async () => {
      const error = new Error('Candidate not found');
      mockInterviewsService.findByCandidate.mockRejectedValue(error);

      await expect(controller.findByCandidate('candidate-123')).rejects.toThrow(error);
    });
  });

  describe('findByUser', () => {
    it('should return interviews for a user', async () => {
      const interviews = [mockInterview];
      mockInterviewsService.findByUser.mockResolvedValue(interviews);

      const result = await controller.findByUser('user-123');

      expect(service.findByUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(interviews);
    });

    it('should handle errors when finding by user', async () => {
      const error = new Error('User not found');
      mockInterviewsService.findByUser.mockRejectedValue(error);

      await expect(controller.findByUser('user-123')).rejects.toThrow(error);
    });
  });

  describe('findByDateRange', () => {
    it('should return interviews for a date range', async () => {
      const interviews = [mockInterview];
      mockInterviewsService.findByDateRange.mockResolvedValue(interviews);

      const result = await controller.findByDateRange('2024-01-01', '2024-01-31');

      expect(service.findByDateRange).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      expect(result).toEqual(interviews);
    });

    it('should handle errors when finding by date range', async () => {
      const error = new Error('Invalid date range');
      mockInterviewsService.findByDateRange.mockRejectedValue(error);

      await expect(controller.findByDateRange('2024-01-01', '2024-01-31')).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    it('should return a single interview', async () => {
      mockInterviewsService.findOne.mockResolvedValue(mockInterview);

      const result = await controller.findOne('interview-123');

      expect(service.findOne).toHaveBeenCalledWith('interview-123');
      expect(result).toEqual(mockInterview);
    });
  });

  describe('update', () => {
    it('should update an interview', async () => {
      const updateDto = { title: 'Updated Interview' };
      const updatedInterview = { ...mockInterview, title: 'Updated Interview' };
      mockInterviewsService.update.mockResolvedValue(updatedInterview);

      const result = await controller.update('interview-123', updateDto as any);

      expect(service.update).toHaveBeenCalledWith('interview-123', updateDto);
      expect(result).toEqual(updatedInterview);
    });
  });

  describe('updateStatus', () => {
    it('should update interview status', async () => {
      const updatedInterview = { ...mockInterview, status: InterviewStatus.COMPLETED };
      mockInterviewsService.updateStatus.mockResolvedValue(updatedInterview);

      const result = await controller.updateStatus('interview-123', InterviewStatus.COMPLETED);

      expect(service.updateStatus).toHaveBeenCalledWith('interview-123', InterviewStatus.COMPLETED);
      expect(result).toEqual(updatedInterview);
    });
  });

  describe('remove', () => {
    it('should remove an interview', async () => {
      mockInterviewsService.remove.mockResolvedValue(undefined);

      await controller.remove('interview-123');

      expect(service.remove).toHaveBeenCalledWith('interview-123');
    });
  });

  describe('addParticipant', () => {
    it('should add a participant to an interview', async () => {
      const participant = { id: 'participant-123', role: 'interviewer' };
      mockInterviewsService.addParticipant.mockResolvedValue(participant);

      const result = await controller.addParticipant('interview-123', 'user-456', 'interviewer');

      expect(service.addParticipant).toHaveBeenCalledWith('interview-123', 'user-456', 'interviewer');
      expect(result).toEqual(participant);
    });
  });

  describe('updateParticipantStatus', () => {
    it('should update participant status', async () => {
      const updatedParticipant = { id: 'participant-123', status: ParticipantStatus.ACCEPTED };
      mockInterviewsService.updateParticipantStatus.mockResolvedValue(updatedParticipant);

      const result = await controller.updateParticipantStatus('participant-123', ParticipantStatus.ACCEPTED);

      expect(service.updateParticipantStatus).toHaveBeenCalledWith('participant-123', ParticipantStatus.ACCEPTED);
      expect(result).toEqual(updatedParticipant);
    });
  });

  describe('removeParticipant', () => {
    it('should remove a participant', async () => {
      mockInterviewsService.removeParticipant.mockResolvedValue(undefined);

      await controller.removeParticipant('participant-123');

      expect(service.removeParticipant).toHaveBeenCalledWith('participant-123');
    });
  });

  describe('createEvaluation', () => {
    it('should create an evaluation', async () => {
      const evaluationDto = {
        interview_id: 'interview-123',
        overall_rating: 4,
        comments: 'Good performance',
      };
      const evaluation = { id: 'evaluation-123', ...evaluationDto };
      mockInterviewsService.createEvaluation.mockResolvedValue(evaluation);

      const result = await controller.createEvaluation(evaluationDto as any, mockRequest);

      expect(service.createEvaluation).toHaveBeenCalledWith(evaluationDto, 'user-123');
      expect(result).toEqual(evaluation);
    });
  });

  describe('findEvaluationsByInterview', () => {
    it('should return evaluations for an interview', async () => {
      const evaluations = [{ id: 'evaluation-123', overall_rating: 4 }];
      mockInterviewsService.findEvaluationsByInterview.mockResolvedValue(evaluations);

      const result = await controller.findEvaluationsByInterview('interview-123');

      expect(service.findEvaluationsByInterview).toHaveBeenCalledWith('interview-123');
      expect(result).toEqual(evaluations);
    });
  });

  describe('updateEvaluation', () => {
    it('should update an evaluation', async () => {
      const updateDto = { overall_rating: 5 };
      const updatedEvaluation = { id: 'evaluation-123', overall_rating: 5 };
      mockInterviewsService.updateEvaluation.mockResolvedValue(updatedEvaluation);

      const result = await controller.updateEvaluation('evaluation-123', updateDto as any);

      expect(service.updateEvaluation).toHaveBeenCalledWith('evaluation-123', updateDto);
      expect(result).toEqual(updatedEvaluation);
    });
  });

  describe('removeEvaluation', () => {
    it('should remove an evaluation', async () => {
      mockInterviewsService.removeEvaluation.mockResolvedValue(undefined);

      await controller.removeEvaluation('evaluation-123');

      expect(service.removeEvaluation).toHaveBeenCalledWith('evaluation-123');
    });
  });

  describe('getAvailableTimeSlots', () => {
    it('should return available time slots', async () => {
      const timeSlots = ['10:00', '11:00', '14:00'];
      mockInterviewsService.getAvailableTimeSlots.mockResolvedValue(timeSlots);

      const result = await controller.getAvailableTimeSlots('2024-01-20', 'user-123,user-456', 60);

      expect(service.getAvailableTimeSlots).toHaveBeenCalledWith(
        ['user-123', 'user-456'],
        new Date('2024-01-20'),
        60
      );
      expect(result).toEqual(timeSlots);
    });

    it('should use default duration when not provided', async () => {
      const timeSlots = ['10:00', '11:00'];
      mockInterviewsService.getAvailableTimeSlots.mockResolvedValue(timeSlots);

      await controller.getAvailableTimeSlots('2024-01-20', 'user-123', undefined);

      expect(service.getAvailableTimeSlots).toHaveBeenCalledWith(
        ['user-123'],
        new Date('2024-01-20'),
        60
      );
    });
  });

  describe('generateMeetingLink', () => {
    it('should generate a meeting link', async () => {
      const meetingData = { link: 'https://meet.google.com/abc-def-ghi' };
      mockInterviewsService.generateMeetingLink.mockResolvedValue(meetingData);

      const result = await controller.generateMeetingLink('interview-123');

      expect(service.generateMeetingLink).toHaveBeenCalledWith('interview-123');
      expect(result).toEqual(meetingData);
    });
  });

  describe('syncCalendar', () => {
    it('should sync calendar', async () => {
      const syncResult = { synced: 5, errors: 0 };
      mockInterviewsService.syncCalendar.mockResolvedValue(syncResult);

      const result = await controller.syncCalendar(mockRequest);

      expect(service.syncCalendar).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(syncResult);
    });
  });

  describe('syncAttendeesStatus', () => {
    it('should sync attendees status', async () => {
      const syncResult = { updated: 3 };
      mockInterviewsService.syncAttendeesStatus.mockResolvedValue(syncResult);

      const result = await controller.syncAttendeesStatus('interview-123');

      expect(service.syncAttendeesStatus).toHaveBeenCalledWith('interview-123');
      expect(result).toEqual(syncResult);
    });
  });

  describe('checkConflicts', () => {
    it('should check conflicts with provided userId', async () => {
      const conflicts = [];
      mockInterviewsService.checkUserConflicts.mockResolvedValue(conflicts);

      const result = await controller.checkConflicts(
        'user-456',
        '2024-01-20T10:00:00Z',
        '2024-01-20T11:00:00Z',
        mockRequest
      );

      expect(service.checkUserConflicts).toHaveBeenCalledWith(
        'user-456',
        new Date('2024-01-20T10:00:00Z'),
        new Date('2024-01-20T11:00:00Z')
      );
      expect(result).toEqual(conflicts);
    });

    it('should use current user when userId not provided', async () => {
      const conflicts = [];
      mockInterviewsService.checkUserConflicts.mockResolvedValue(conflicts);

      const result = await controller.checkConflicts(
        undefined,
        '2024-01-20T10:00:00Z',
        '2024-01-20T11:00:00Z',
        mockRequest
      );

      expect(service.checkUserConflicts).toHaveBeenCalledWith(
        'user-123',
        new Date('2024-01-20T10:00:00Z'),
        new Date('2024-01-20T11:00:00Z')
      );
      expect(result).toEqual(conflicts);
    });
  });

  describe('getCalendarEvents', () => {
    it('should return calendar events', async () => {
      const events = [{ id: 'event-123', title: 'Meeting' }];
      mockInterviewsService.getCalendarEvents.mockResolvedValue(events);

      const result = await controller.getCalendarEvents('2024-01-01', '2024-01-31', mockRequest);

      expect(service.getCalendarEvents).toHaveBeenCalledWith('user-123', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      });
      expect(result).toEqual(events);
    });

    it('should handle errors when getting calendar events', async () => {
      const error = new Error('Calendar service unavailable');
      mockInterviewsService.getCalendarEvents.mockRejectedValue(error);

      await expect(
        controller.getCalendarEvents('2024-01-01', '2024-01-31', mockRequest)
      ).rejects.toThrow(error);
    });
  });

  describe('sendReminder', () => {
    it('should send reminder with provided minutes', async () => {
      const reminderResult = { sent: true };
      mockInterviewsService.sendInterviewReminder.mockResolvedValue(reminderResult);

      const result = await controller.sendReminder('interview-123', 30);

      expect(service.sendInterviewReminder).toHaveBeenCalledWith('interview-123', 30);
      expect(result).toEqual(reminderResult);
    });

    it('should use default minutes when not provided', async () => {
      const reminderResult = { sent: true };
      mockInterviewsService.sendInterviewReminder.mockResolvedValue(reminderResult);

      const result = await controller.sendReminder('interview-123', undefined);

      expect(service.sendInterviewReminder).toHaveBeenCalledWith('interview-123', 15);
      expect(result).toEqual(reminderResult);
    });
  });
});