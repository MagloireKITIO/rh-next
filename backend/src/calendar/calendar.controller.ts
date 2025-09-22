import { Controller, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CalendarService, CalendarEvent } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('events')
  async createEvent(
    @Request() req,
    @Body() createEventDto: {
      calendarId: string;
      event: CalendarEvent;
      generateMeet?: boolean;
    }
  ) {
    const userId = req.user.id;
    const { calendarId, event, generateMeet } = createEventDto;

    const eventToCreate = generateMeet
      ? this.calendarService.generateMeetEvent(event)
      : event;

    return this.calendarService.createEvent(userId, calendarId, eventToCreate);
  }

  @Delete('events/:calendarId/:eventId')
  async deleteEvent(
    @Request() req,
    @Param('calendarId') calendarId: string,
    @Param('eventId') eventId: string
  ) {
    const userId = req.user.id;
    return this.calendarService.deleteEvent(userId, calendarId, eventId);
  }

  @Post('freebusy')
  async getFreeBusy(
    @Request() req,
    @Body() freeBusyDto: {
      calendarId: string;
      timeMin: string;
      timeMax: string;
    }
  ) {
    const userId = req.user.id;
    const { calendarId, timeMin, timeMax } = freeBusyDto;
    return this.calendarService.getFreeBusy(userId, calendarId, timeMin, timeMax);
  }
}