import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';

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
  private calendar: any;

  constructor() {
    this.initializeGoogleCalendar();
  }

  private async initializeGoogleCalendar() {
    try {
      // Configuration Google Calendar avec Service Account
      const credentials = {
        type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: process.env.GOOGLE_AUTH_URI,
        token_uri: process.env.GOOGLE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
      };

      if (!credentials.private_key || !credentials.client_email) {
        this.logger.warn('Google Calendar credentials not configured. Calendar integration disabled.');
        return;
      }

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });

      this.calendar = google.calendar({ version: 'v3', auth });
      this.logger.log('Google Calendar initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Calendar:', error);
    }
  }

  async createEvent(calendarId: string, event: CalendarEvent): Promise<any> {
    if (!this.calendar) {
      throw new Error('Google Calendar not initialized. Please check your credentials configuration.');
    }

    try {
      const response = await this.calendar.events.insert({
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

  async updateEvent(calendarId: string, eventId: string, event: Partial<CalendarEvent>): Promise<any> {
    if (!this.calendar) {
      throw new Error('Google Calendar not initialized. Please check your credentials configuration.');
    }

    try {
      const response = await this.calendar.events.update({
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

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    if (!this.calendar) {
      throw new Error('Google Calendar not initialized. Please check your credentials configuration.');
    }

    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });

      this.logger.log(`Calendar event deleted: ${eventId}`);
    } catch (error) {
      this.logger.error('Failed to delete calendar event:', error);
      throw error;
    }
  }

  async getFreeBusy(calendarId: string, timeMin: string, timeMax: string): Promise<any> {
    if (!this.calendar) {
      throw new Error('Google Calendar not initialized. Please check your credentials configuration.');
    }

    try {
      const response = await this.calendar.freebusy.query({
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