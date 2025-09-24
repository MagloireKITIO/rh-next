import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService, CalendarEvent } from './calendar.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { Logger } from '@nestjs/common';

// Mock Google APIs
const mockGoogleCalendar = {
  events: {
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    list: jest.fn(),
    get: jest.fn(),
  },
  freebusy: {
    query: jest.fn(),
  },
};

jest.mock('googleapis', () => ({
  google: {
    calendar: jest.fn(() => mockGoogleCalendar),
  },
}));

const { google } = require('googleapis');

describe('CalendarService', () => {
  let service: CalendarService;
  let integrationsService: IntegrationsService;

  const mockOAuthClient = {
    credentials: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
    },
  };

  const mockIntegrationsService = {
    createGoogleOAuthClient: jest.fn(),
  };

  const mockCalendarEvent: CalendarEvent = {
    summary: 'Test Event',
    description: 'Test Description',
    start: {
      dateTime: '2024-01-15T10:00:00.000Z',
      timeZone: 'Europe/Paris',
    },
    end: {
      dateTime: '2024-01-15T11:00:00.000Z',
      timeZone: 'Europe/Paris',
    },
    attendees: [
      {
        email: 'test@example.com',
        displayName: 'Test User',
      },
    ],
    location: 'Test Location',
  };

  const mockInterview = {
    title: 'Interview with John Doe',
    description: 'Technical interview',
    scheduled_at: new Date('2024-01-15T10:00:00.000Z'),
    duration_minutes: 60,
    candidate: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    participants: [
      {
        user: {
          email: 'interviewer@company.com',
          name: 'Interviewer Name',
        },
      },
    ],
    location: 'Conference Room A',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: IntegrationsService,
          useValue: mockIntegrationsService,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    integrationsService = module.get<IntegrationsService>(IntegrationsService);

    // Mock Logger to avoid console output in tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGoogleCalendarClient', () => {
    it('should create and return Google Calendar client', async () => {
      mockIntegrationsService.createGoogleOAuthClient.mockResolvedValue(mockOAuthClient);
      // Mock google.calendar to return our mock
      (google.calendar as jest.Mock).mockReturnValue(mockGoogleCalendar);

      const result = await (service as any).getGoogleCalendarClient('user-123');

      expect(mockIntegrationsService.createGoogleOAuthClient).toHaveBeenCalledWith('user-123');
      expect(google.calendar).toHaveBeenCalledWith({ version: 'v3', auth: mockOAuthClient });
      expect(result).toBe(mockGoogleCalendar);
    });

    it('should throw error when OAuth client creation fails', async () => {
      mockIntegrationsService.createGoogleOAuthClient.mockRejectedValue(new Error('OAuth error'));

      await expect((service as any).getGoogleCalendarClient('user-123')).rejects.toThrow(
        'Google Calendar not initialized. Please check your integration configuration.'
      );
    });
  });

  describe('createEvent', () => {
    beforeEach(() => {
      mockIntegrationsService.createGoogleOAuthClient.mockResolvedValue(mockOAuthClient);
      (google.calendar as jest.Mock).mockReturnValue(mockGoogleCalendar);
    });

    it('should create calendar event successfully', async () => {
      const mockEventResponse = { data: { id: 'event-123', ...mockCalendarEvent } };
      mockGoogleCalendar.events.insert.mockResolvedValue(mockEventResponse);

      const result = await service.createEvent('user-123', 'calendar-123', mockCalendarEvent);

      expect(result).toEqual(mockEventResponse.data);
      expect(mockGoogleCalendar.events.insert).toHaveBeenCalledWith({
        calendarId: 'calendar-123',
        resource: {
          ...mockCalendarEvent,
          conferenceData: undefined,
        },
        conferenceDataVersion: 0,
      });
    });

    it('should create calendar event with conference data', async () => {
      const eventWithConference = {
        ...mockCalendarEvent,
        conferenceData: {
          createRequest: {
            requestId: 'meet-123',
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      };

      const mockEventResponse = { data: { id: 'event-123', ...eventWithConference } };
      mockGoogleCalendar.events.insert.mockResolvedValue(mockEventResponse);

      const result = await service.createEvent('user-123', 'calendar-123', eventWithConference);

      expect(result).toEqual(mockEventResponse.data);
      expect(mockGoogleCalendar.events.insert).toHaveBeenCalledWith({
        calendarId: 'calendar-123',
        resource: expect.objectContaining({
          ...eventWithConference,
          conferenceData: {
            createRequest: {
              ...eventWithConference.conferenceData.createRequest,
              requestId: expect.stringContaining('meet-'),
            },
          },
        }),
        conferenceDataVersion: 1,
      });
    });

    it('should handle calendar event creation error', async () => {
      const error = new Error('Calendar API error');
      mockGoogleCalendar.events.insert.mockRejectedValue(error);

      await expect(service.createEvent('user-123', 'calendar-123', mockCalendarEvent)).rejects.toThrow(error);
    });

    it('should handle OAuth client creation error', async () => {
      mockIntegrationsService.createGoogleOAuthClient.mockRejectedValue(new Error('OAuth error'));

      await expect(service.createEvent('user-123', 'calendar-123', mockCalendarEvent)).rejects.toThrow(
        'Google Calendar not initialized. Please check your integration configuration.'
      );
    });
  });

  describe('updateEvent', () => {
    beforeEach(() => {
      mockIntegrationsService.createGoogleOAuthClient.mockResolvedValue(mockOAuthClient);
      (google.calendar as jest.Mock).mockReturnValue(mockGoogleCalendar);
    });

    it('should update calendar event successfully', async () => {
      const updateData = { summary: 'Updated Event' };
      const mockEventResponse = { data: { id: 'event-123', ...updateData } };
      mockGoogleCalendar.events.update.mockResolvedValue(mockEventResponse);

      const result = await service.updateEvent('user-123', 'calendar-123', 'event-123', updateData);

      expect(result).toEqual(mockEventResponse.data);
      expect(mockGoogleCalendar.events.update).toHaveBeenCalledWith({
        calendarId: 'calendar-123',
        eventId: 'event-123',
        resource: updateData,
      });
    });

    it('should handle calendar event update error', async () => {
      const error = new Error('Calendar API error');
      mockGoogleCalendar.events.update.mockRejectedValue(error);

      await expect(service.updateEvent('user-123', 'calendar-123', 'event-123', {})).rejects.toThrow(error);
    });
  });

  describe('deleteEvent', () => {
    beforeEach(() => {
      mockIntegrationsService.createGoogleOAuthClient.mockResolvedValue(mockOAuthClient);
      (google.calendar as jest.Mock).mockReturnValue(mockGoogleCalendar);
    });

    it('should delete calendar event successfully', async () => {
      mockGoogleCalendar.events.delete.mockResolvedValue({});

      await service.deleteEvent('user-123', 'calendar-123', 'event-123');

      expect(mockGoogleCalendar.events.delete).toHaveBeenCalledWith({
        calendarId: 'calendar-123',
        eventId: 'event-123',
      });
    });

    it('should handle calendar event deletion error', async () => {
      const error = new Error('Calendar API error');
      mockGoogleCalendar.events.delete.mockRejectedValue(error);

      await expect(service.deleteEvent('user-123', 'calendar-123', 'event-123')).rejects.toThrow(error);
    });
  });

  describe('getFreeBusy', () => {
    beforeEach(() => {
      mockIntegrationsService.createGoogleOAuthClient.mockResolvedValue(mockOAuthClient);
      (google.calendar as jest.Mock).mockReturnValue(mockGoogleCalendar);
    });

    it('should get free/busy information successfully', async () => {
      const mockFreeBusyResponse = {
        data: {
          calendars: {
            'calendar-123': {
              busy: [
                {
                  start: '2024-01-15T10:00:00.000Z',
                  end: '2024-01-15T11:00:00.000Z',
                },
              ],
            },
          },
        },
      };
      mockGoogleCalendar.freebusy.query.mockResolvedValue(mockFreeBusyResponse);

      const result = await service.getFreeBusy(
        'user-123',
        'calendar-123',
        '2024-01-15T09:00:00.000Z',
        '2024-01-15T17:00:00.000Z'
      );

      expect(result).toEqual(mockFreeBusyResponse.data);
      expect(mockGoogleCalendar.freebusy.query).toHaveBeenCalledWith({
        resource: {
          timeMin: '2024-01-15T09:00:00.000Z',
          timeMax: '2024-01-15T17:00:00.000Z',
          items: [{ id: 'calendar-123' }],
        },
      });
    });

    it('should handle free/busy query error', async () => {
      const error = new Error('Calendar API error');
      mockGoogleCalendar.freebusy.query.mockRejectedValue(error);

      await expect(
        service.getFreeBusy('user-123', 'calendar-123', '2024-01-15T09:00:00.000Z', '2024-01-15T17:00:00.000Z')
      ).rejects.toThrow(error);
    });
  });

  describe('getEventAttendees', () => {
    beforeEach(() => {
      mockIntegrationsService.createGoogleOAuthClient.mockResolvedValue(mockOAuthClient);
      (google.calendar as jest.Mock).mockReturnValue(mockGoogleCalendar);
    });

    it('should get event attendees successfully', async () => {
      const mockEventResponse = {
        data: {
          attendees: [
            {
              email: 'attendee1@example.com',
              displayName: 'Attendee 1',
              responseStatus: 'accepted',
            },
            {
              email: 'attendee2@example.com',
              displayName: 'Attendee 2',
              responseStatus: 'declined',
            },
          ],
        },
      };
      mockGoogleCalendar.events.get.mockResolvedValue(mockEventResponse);

      const result = await service.getEventAttendees('user-123', 'event-123');

      expect(result).toEqual([
        {
          email: 'attendee1@example.com',
          displayName: 'Attendee 1',
          responseStatus: 'accepted',
        },
        {
          email: 'attendee2@example.com',
          displayName: 'Attendee 2',
          responseStatus: 'declined',
        },
      ]);
      expect(mockGoogleCalendar.events.get).toHaveBeenCalledWith({
        calendarId: 'primary',
        eventId: 'event-123',
      });
    });

    it('should handle event with no attendees', async () => {
      const mockEventResponse = { data: {} };
      mockGoogleCalendar.events.get.mockResolvedValue(mockEventResponse);

      const result = await service.getEventAttendees('user-123', 'event-123');

      expect(result).toEqual([]);
    });

    it('should handle attendees with missing fields', async () => {
      const mockEventResponse = {
        data: {
          attendees: [
            {
              email: 'attendee1@example.com',
            },
            {
              displayName: 'Attendee 2',
            },
          ],
        },
      };
      mockGoogleCalendar.events.get.mockResolvedValue(mockEventResponse);

      const result = await service.getEventAttendees('user-123', 'event-123');

      expect(result).toEqual([
        {
          email: 'attendee1@example.com',
          displayName: undefined,
          responseStatus: 'needsAction',
        },
        {
          email: '',
          displayName: 'Attendee 2',
          responseStatus: 'needsAction',
        },
      ]);
    });

    it('should handle get event attendees error', async () => {
      const error = new Error('Calendar API error');
      mockGoogleCalendar.events.get.mockRejectedValue(error);

      await expect(service.getEventAttendees('user-123', 'event-123')).rejects.toThrow(error);
    });
  });

  describe('checkConflicts', () => {
    beforeEach(() => {
      mockIntegrationsService.createGoogleOAuthClient.mockResolvedValue(mockOAuthClient);
      (google.calendar as jest.Mock).mockReturnValue(mockGoogleCalendar);
    });

    it('should detect conflicts when busy periods exist', async () => {
      const mockFreeBusyResponse = {
        data: {
          calendars: {
            primary: {
              busy: [
                {
                  start: '2024-01-15T10:30:00.000Z',
                  end: '2024-01-15T11:30:00.000Z',
                },
              ],
            },
          },
        },
      };
      mockGoogleCalendar.freebusy.query.mockResolvedValue(mockFreeBusyResponse);

      const startTime = new Date('2024-01-15T10:00:00.000Z');
      const endTime = new Date('2024-01-15T12:00:00.000Z');

      const result = await service.checkConflicts('user-123', startTime, endTime);

      expect(result).toEqual({
        hasConflicts: true,
        conflicts: [
          {
            start: '2024-01-15T10:30:00.000Z',
            end: '2024-01-15T11:30:00.000Z',
            summary: 'Événement existant',
          },
        ],
      });
    });

    it('should return no conflicts when no busy periods exist', async () => {
      const mockFreeBusyResponse = {
        data: {
          calendars: {
            primary: {
              busy: [],
            },
          },
        },
      };
      mockGoogleCalendar.freebusy.query.mockResolvedValue(mockFreeBusyResponse);

      const startTime = new Date('2024-01-15T10:00:00.000Z');
      const endTime = new Date('2024-01-15T12:00:00.000Z');

      const result = await service.checkConflicts('user-123', startTime, endTime);

      expect(result).toEqual({
        hasConflicts: false,
        conflicts: [],
      });
    });

    it('should handle missing calendar data gracefully', async () => {
      const mockFreeBusyResponse = { data: {} };
      mockGoogleCalendar.freebusy.query.mockResolvedValue(mockFreeBusyResponse);

      const startTime = new Date('2024-01-15T10:00:00.000Z');
      const endTime = new Date('2024-01-15T12:00:00.000Z');

      const result = await service.checkConflicts('user-123', startTime, endTime);

      expect(result).toEqual({
        hasConflicts: false,
        conflicts: [],
      });
    });

    it('should handle API errors gracefully', async () => {
      mockGoogleCalendar.freebusy.query.mockRejectedValue(new Error('API error'));

      const startTime = new Date('2024-01-15T10:00:00.000Z');
      const endTime = new Date('2024-01-15T12:00:00.000Z');

      const result = await service.checkConflicts('user-123', startTime, endTime);

      expect(result).toEqual({
        hasConflicts: false,
        conflicts: [],
      });
    });
  });

  describe('syncCalendarEvents', () => {
    beforeEach(() => {
      mockIntegrationsService.createGoogleOAuthClient.mockResolvedValue(mockOAuthClient);
      (google.calendar as jest.Mock).mockReturnValue(mockGoogleCalendar);
    });

    it('should sync calendar events successfully', async () => {
      const mockEventsResponse = {
        data: {
          items: [
            {
              id: 'event-1',
              summary: 'Event 1',
              start: { dateTime: '2024-01-15T10:00:00.000Z' },
              end: { dateTime: '2024-01-15T11:00:00.000Z' },
              attendees: [{ email: 'attendee@example.com', displayName: 'Attendee' }],
              location: 'Location 1',
            },
            {
              id: 'event-2',
              start: { dateTime: '2024-01-15T14:00:00.000Z' },
              end: { dateTime: '2024-01-15T15:00:00.000Z' },
            },
          ],
        },
      };
      mockGoogleCalendar.events.list.mockResolvedValue(mockEventsResponse);

      const dateRange = {
        start: new Date('2024-01-15T00:00:00.000Z'),
        end: new Date('2024-01-15T23:59:59.000Z'),
      };

      const result = await service.syncCalendarEvents('user-123', dateRange);

      expect(result).toEqual([
        {
          id: 'event-1',
          summary: 'Event 1',
          start: { dateTime: '2024-01-15T10:00:00.000Z' },
          end: { dateTime: '2024-01-15T11:00:00.000Z' },
          attendees: [{ email: 'attendee@example.com', displayName: 'Attendee' }],
          location: 'Location 1',
        },
        {
          id: 'event-2',
          summary: 'Événement sans titre',
          start: { dateTime: '2024-01-15T14:00:00.000Z' },
          end: { dateTime: '2024-01-15T15:00:00.000Z' },
          attendees: undefined,
          location: undefined,
        },
      ]);
      expect(mockGoogleCalendar.events.list).toHaveBeenCalledWith({
        calendarId: 'primary',
        timeMin: dateRange.start.toISOString(),
        timeMax: dateRange.end.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
    });

    it('should handle empty events list', async () => {
      const mockEventsResponse = { data: {} };
      mockGoogleCalendar.events.list.mockResolvedValue(mockEventsResponse);

      const dateRange = {
        start: new Date('2024-01-15T00:00:00.000Z'),
        end: new Date('2024-01-15T23:59:59.000Z'),
      };

      const result = await service.syncCalendarEvents('user-123', dateRange);

      expect(result).toEqual([]);
    });

    it('should handle sync calendar events error', async () => {
      const error = new Error('Calendar API error');
      mockGoogleCalendar.events.list.mockRejectedValue(error);

      const dateRange = {
        start: new Date('2024-01-15T00:00:00.000Z'),
        end: new Date('2024-01-15T23:59:59.000Z'),
      };

      await expect(service.syncCalendarEvents('user-123', dateRange)).rejects.toThrow(error);
    });
  });

  describe('generateMeetEvent', () => {
    it('should generate Meet event with conference data', () => {
      const result = service.generateMeetEvent(mockCalendarEvent);

      expect(result).toEqual({
        ...mockCalendarEvent,
        conferenceData: {
          createRequest: {
            requestId: expect.stringContaining('meet-'),
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      });
    });

    it('should override existing conference data', () => {
      const eventWithExistingConferenceData = {
        ...mockCalendarEvent,
        conferenceData: {
          createRequest: {
            requestId: 'existing-request',
            conferenceSolutionKey: {
              type: 'other',
            },
          },
        },
      };

      const result = service.generateMeetEvent(eventWithExistingConferenceData);

      expect(result.conferenceData?.createRequest.conferenceSolutionKey.type).toBe('hangoutsMeet');
      expect(result.conferenceData?.createRequest.requestId).toContain('meet-');
      expect(result.conferenceData?.createRequest.requestId).not.toBe('existing-request');
    });
  });

  describe('formatInterviewEvent', () => {
    it('should format interview event with all data', () => {
      const result = service.formatInterviewEvent(mockInterview);

      const expectedStartTime = new Date(mockInterview.scheduled_at);
      const expectedEndTime = new Date(expectedStartTime.getTime() + 60 * 60000);

      expect(result).toEqual({
        summary: mockInterview.title,
        description: mockInterview.description,
        start: {
          dateTime: expectedStartTime.toISOString(),
          timeZone: 'Europe/Paris',
        },
        end: {
          dateTime: expectedEndTime.toISOString(),
          timeZone: 'Europe/Paris',
        },
        attendees: [
          {
            email: 'john@example.com',
            displayName: 'John Doe',
          },
          {
            email: 'interviewer@company.com',
            displayName: 'Interviewer Name',
          },
        ],
        location: 'Conference Room A',
      });
    });

    it('should format interview event without candidate email', () => {
      const interviewWithoutCandidateEmail = {
        ...mockInterview,
        candidate: {
          name: 'John Doe',
          email: undefined,
        },
      };

      const result = service.formatInterviewEvent(interviewWithoutCandidateEmail);

      expect(result.attendees).toEqual([
        {
          email: 'interviewer@company.com',
          displayName: 'Interviewer Name',
        },
      ]);
    });

    it('should format interview event without description', () => {
      const interviewWithoutDescription = {
        ...mockInterview,
        description: undefined,
      };

      const result = service.formatInterviewEvent(interviewWithoutDescription);

      expect(result.description).toBe('Entretien avec John Doe');
    });

    it('should calculate correct end time based on duration', () => {
      const interviewWith90Minutes = {
        ...mockInterview,
        duration_minutes: 90,
      };

      const result = service.formatInterviewEvent(interviewWith90Minutes);

      const expectedStartTime = new Date(mockInterview.scheduled_at);
      const expectedEndTime = new Date(expectedStartTime.getTime() + 90 * 60000);

      expect(result.end.dateTime).toBe(expectedEndTime.toISOString());
    });

    it('should handle multiple participants', () => {
      const interviewWithMultipleParticipants = {
        ...mockInterview,
        participants: [
          {
            user: {
              email: 'interviewer1@company.com',
              name: 'Interviewer 1',
            },
          },
          {
            user: {
              email: 'interviewer2@company.com',
              name: 'Interviewer 2',
            },
          },
        ],
      };

      const result = service.formatInterviewEvent(interviewWithMultipleParticipants);

      expect(result.attendees).toEqual([
        {
          email: 'john@example.com',
          displayName: 'John Doe',
        },
        {
          email: 'interviewer1@company.com',
          displayName: 'Interviewer 1',
        },
        {
          email: 'interviewer2@company.com',
          displayName: 'Interviewer 2',
        },
      ]);
    });
  });
});