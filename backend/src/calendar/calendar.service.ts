import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { IntegrationsService } from '../integrations/integrations.service';

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  location?: string;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private integrationsService: IntegrationsService,
  ) {}

  private async getGoogleCalendarClient(userId: string): Promise<any> {
    try {
      const oauth2Client = await this.integrationsService.createGoogleOAuthClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      return calendar;
    } catch (error) {
      this.logger.error(`Failed to get Google Calendar client for user ${userId}:`, error);
      throw new Error('Google Calendar not initialized. Please check your integration configuration.');
    }
  }

  async createEvent(userId: string, calendarId: string, event: CalendarEvent): Promise<any> {
    const calendar = await this.getGoogleCalendarClient(userId);

    try {
      const response = await calendar.events.insert({
        calendarId,
        resource: {
          ...event,
          conferenceData: event.conferenceData ? {
            createRequest: {
              ...event.conferenceData.createRequest,
              requestId: `meet-${Date.now()}`, // ID unique pour la requête
            }
          } : undefined,
        },
        conferenceDataVersion: event.conferenceData ? 1 : 0, // Nécessaire pour créer des Meet
      });

      this.logger.log(`Calendar event created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create calendar event:', error);
      throw error;
    }
  }

  async updateEvent(userId: string, calendarId: string, eventId: string, event: Partial<CalendarEvent>): Promise<any> {
    const calendar = await this.getGoogleCalendarClient(userId);

    try {
      const response = await calendar.events.update({
        calendarId,
        eventId,
        resource: event,
      });

      this.logger.log(`Calendar event updated: ${eventId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to update calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(userId: string, calendarId: string, eventId: string): Promise<void> {
    const calendar = await this.getGoogleCalendarClient(userId);

    try {
      await calendar.events.delete({
        calendarId,
        eventId,
      });

      this.logger.log(`Calendar event deleted: ${eventId}`);
    } catch (error) {
      this.logger.error('Failed to delete calendar event:', error);
      throw error;
    }
  }

  async getFreeBusy(userId: string, calendarId: string, timeMin: string, timeMax: string): Promise<any> {
    const calendar = await this.getGoogleCalendarClient(userId);

    try {
      const response = await calendar.freebusy.query({
        resource: {
          timeMin,
          timeMax,
          items: [{ id: calendarId }],
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get free/busy information:', error);
      throw error;
    }
  }

  // Générer un lien Google Meet automatiquement
  generateMeetEvent(event: CalendarEvent): CalendarEvent {
    return {
      ...event,
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };
  }

  // Formater les événements pour les entretiens
  formatInterviewEvent(interview: {
    title: string;
    description?: string;
    scheduled_at: Date;
    duration_minutes: number;
    candidate: { name: string; email?: string };
    participants: Array<{ user: { email: string; name: string } }>;
    location?: string;
  }): CalendarEvent {
    const startTime = new Date(interview.scheduled_at);
    const endTime = new Date(startTime.getTime() + interview.duration_minutes * 60000);

    const attendees = [
      // Ajouter le candidat s'il a un email
      ...(interview.candidate.email ? [{
        email: interview.candidate.email,
        displayName: interview.candidate.name,
      }] : []),
      // Ajouter les participants
      ...interview.participants.map(p => ({
        email: p.user.email,
        displayName: p.user.name,
      })),
    ];

    return {
      summary: interview.title,
      description: interview.description || `Entretien avec ${interview.candidate.name}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Europe/Paris',
      },
      attendees,
      location: interview.location,
    };
  }
}