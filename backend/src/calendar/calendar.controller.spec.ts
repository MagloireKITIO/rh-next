import { Test, TestingModule } from '@nestjs/testing';
import { CalendarController } from './calendar.controller';
import { CalendarService, CalendarEvent } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('CalendarController', () => {
  let controller: CalendarController;
  let calendarService: jest.Mocked<CalendarService>;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'user@test.com',
    name: 'Test User',
  };

  const mockRequest = {
    user: mockUser,
  };

  const mockCalendarEvent: CalendarEvent = {
    summary: 'Test Meeting',
    description: 'Test meeting description',
    start: {
      dateTime: '2023-12-01T10:00:00Z',
      timeZone: 'UTC',
    },
    end: {
      dateTime: '2023-12-01T11:00:00Z',
      timeZone: 'UTC',
    },
    attendees: [
      {
        email: 'attendee@test.com',
        displayName: 'Test Attendee',
      },
    ],
    location: 'Conference Room 1',
  };

  const mockCalendarService = {
    createEvent: jest.fn(),
    deleteEvent: jest.fn(),
    getFreeBusy: jest.fn(),
    generateMeetEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CalendarController>(CalendarController);
    calendarService = module.get(CalendarService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create a calendar event without generating meet', async () => {
      const createEventDto = {
        calendarId: 'calendar-1',
        event: mockCalendarEvent,
        generateMeet: false,
      };

      const expectedResponse = {
        id: 'event-1',
        ...mockCalendarEvent,
        htmlLink: 'https://calendar.google.com/event?eid=123',
      };

      calendarService.createEvent.mockResolvedValue(expectedResponse);

      const result = await controller.createEvent(mockRequest, createEventDto);

      expect(calendarService.createEvent).toHaveBeenCalledWith(
        mockUser.id,
        'calendar-1',
        mockCalendarEvent
      );
      expect(calendarService.generateMeetEvent).not.toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    it('should create a calendar event with generating meet', async () => {
      const createEventDto = {
        calendarId: 'calendar-1',
        event: mockCalendarEvent,
        generateMeet: true,
      };

      const meetEvent = {
        ...mockCalendarEvent,
        conferenceData: {
          createRequest: {
            requestId: 'meet-request-1',
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      };

      const expectedResponse = {
        id: 'event-1',
        ...meetEvent,
        htmlLink: 'https://calendar.google.com/event?eid=123',
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
      };

      calendarService.generateMeetEvent.mockReturnValue(meetEvent);
      calendarService.createEvent.mockResolvedValue(expectedResponse);

      const result = await controller.createEvent(mockRequest, createEventDto);

      expect(calendarService.generateMeetEvent).toHaveBeenCalledWith(mockCalendarEvent);
      expect(calendarService.createEvent).toHaveBeenCalledWith(
        mockUser.id,
        'calendar-1',
        meetEvent
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should create event without generateMeet flag (default behavior)', async () => {
      const createEventDto = {
        calendarId: 'calendar-1',
        event: mockCalendarEvent,
      };

      const expectedResponse = {
        id: 'event-1',
        ...mockCalendarEvent,
        htmlLink: 'https://calendar.google.com/event?eid=123',
      };

      calendarService.createEvent.mockResolvedValue(expectedResponse);

      const result = await controller.createEvent(mockRequest, createEventDto);

      expect(calendarService.createEvent).toHaveBeenCalledWith(
        mockUser.id,
        'calendar-1',
        mockCalendarEvent
      );
      expect(calendarService.generateMeetEvent).not.toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    it('should handle minimal event data', async () => {
      const minimalEvent: CalendarEvent = {
        summary: 'Quick Meeting',
        start: {
          dateTime: '2023-12-01T10:00:00Z',
          timeZone: 'UTC',
        },
        end: {
          dateTime: '2023-12-01T11:00:00Z',
          timeZone: 'UTC',
        },
      };

      const createEventDto = {
        calendarId: 'calendar-1',
        event: minimalEvent,
      };

      const expectedResponse = {
        id: 'event-2',
        ...minimalEvent,
        htmlLink: 'https://calendar.google.com/event?eid=456',
      };

      calendarService.createEvent.mockResolvedValue(expectedResponse);

      const result = await controller.createEvent(mockRequest, createEventDto);

      expect(calendarService.createEvent).toHaveBeenCalledWith(
        mockUser.id,
        'calendar-1',
        minimalEvent
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('deleteEvent', () => {
    it('should delete a calendar event', async () => {
      calendarService.deleteEvent.mockResolvedValue(undefined);

      const result = await controller.deleteEvent(mockRequest, 'calendar-1', 'event-1');

      expect(calendarService.deleteEvent).toHaveBeenCalledWith(
        mockUser.id,
        'calendar-1',
        'event-1'
      );
      expect(result).toBeUndefined();
    });

    it('should handle deletion of non-existent event', async () => {
      calendarService.deleteEvent.mockResolvedValue(undefined);

      const result = await controller.deleteEvent(mockRequest, 'calendar-1', 'non-existent-event');

      expect(calendarService.deleteEvent).toHaveBeenCalledWith(
        mockUser.id,
        'calendar-1',
        'non-existent-event'
      );
      expect(result).toBeUndefined();
    });
  });

  describe('getFreeBusy', () => {
    it('should get free/busy information for a calendar', async () => {
      const freeBusyDto = {
        calendarId: 'calendar-1',
        timeMin: '2023-12-01T00:00:00Z',
        timeMax: '2023-12-01T23:59:59Z',
      };

      const expectedResponse = {
        timeMin: '2023-12-01T00:00:00Z',
        timeMax: '2023-12-01T23:59:59Z',
        calendars: {
          'calendar-1': {
            busy: [
              {
                start: '2023-12-01T10:00:00Z',
                end: '2023-12-01T11:00:00Z',
              },
              {
                start: '2023-12-01T14:00:00Z',
                end: '2023-12-01T15:00:00Z',
              },
            ],
          },
        },
      };

      calendarService.getFreeBusy.mockResolvedValue(expectedResponse);

      const result = await controller.getFreeBusy(mockRequest, freeBusyDto);

      expect(calendarService.getFreeBusy).toHaveBeenCalledWith(
        mockUser.id,
        'calendar-1',
        '2023-12-01T00:00:00Z',
        '2023-12-01T23:59:59Z'
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should get free/busy information with no busy times', async () => {
      const freeBusyDto = {
        calendarId: 'calendar-1',
        timeMin: '2023-12-02T00:00:00Z',
        timeMax: '2023-12-02T23:59:59Z',
      };

      const expectedResponse = {
        timeMin: '2023-12-02T00:00:00Z',
        timeMax: '2023-12-02T23:59:59Z',
        calendars: {
          'calendar-1': {
            busy: [],
          },
        },
      };

      calendarService.getFreeBusy.mockResolvedValue(expectedResponse);

      const result = await controller.getFreeBusy(mockRequest, freeBusyDto);

      expect(calendarService.getFreeBusy).toHaveBeenCalledWith(
        mockUser.id,
        'calendar-1',
        '2023-12-02T00:00:00Z',
        '2023-12-02T23:59:59Z'
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle different time zones in free/busy query', async () => {
      const freeBusyDto = {
        calendarId: 'calendar-1',
        timeMin: '2023-12-01T05:00:00-05:00', // EST
        timeMax: '2023-12-01T17:00:00-05:00', // EST
      };

      const expectedResponse = {
        timeMin: '2023-12-01T05:00:00-05:00',
        timeMax: '2023-12-01T17:00:00-05:00',
        calendars: {
          'calendar-1': {
            busy: [
              {
                start: '2023-12-01T15:00:00Z', // UTC equivalent
                end: '2023-12-01T16:00:00Z',   // UTC equivalent
              },
            ],
          },
        },
      };

      calendarService.getFreeBusy.mockResolvedValue(expectedResponse);

      const result = await controller.getFreeBusy(mockRequest, freeBusyDto);

      expect(calendarService.getFreeBusy).toHaveBeenCalledWith(
        mockUser.id,
        'calendar-1',
        '2023-12-01T05:00:00-05:00',
        '2023-12-01T17:00:00-05:00'
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});