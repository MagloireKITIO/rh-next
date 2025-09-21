import { Controller, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { CalendarService, CalendarEvent } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('events')
  async createEvent(
    @Body() createEventDto: {
      calendarId: string;
      event: CalendarEvent;
      generateMeet?: boolean;
    }
  ) {
    const { calendarId, event, generateMeet } = createEventDto;

    const eventToCreate = generateMeet
      ? this.calendarService.generateMeetEvent(event)
      : event;

    return this.calendarService.createEvent(calendarId, eventToCreate);
  }

  @Delete('events/:calendarId/:eventId')
  async deleteEvent(
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string
  ) {
    return this.calendarService.deleteEvent(calendarId, eventId);
  }

  @Post('freebusy')
  async getFreeBusy(
    @Body() freeBusyDto: {
      calendarId: string;
      timeMin: string;
      timeMax: string;
    }
  ) {
    const { calendarId, timeMin, timeMax } = freeBusyDto;
    return this.calendarService.getFreeBusy(calendarId, timeMin, timeMax);
  }
}