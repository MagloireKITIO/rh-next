import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview, InterviewStatus } from '../interviews/entities/interview.entity';
import { InterviewParticipant } from '../interviews/entities/interview-participant.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Interview)
    private interviewRepository: Repository<Interview>,
  ) {}

  // @Cron(CronExpression.EVERY_MINUTE) // Désactivé pour éviter les dépendances
  async checkUpcomingInterviews(): Promise<void> {
    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);

    try {
      // Trouver les entretiens qui commencent dans 15 minutes
      const upcomingInterviews = await this.interviewRepository.find({
        where: {
          status: InterviewStatus.SCHEDULED,
          reminder_sent: false,
        },
        relations: ['candidate', 'participants', 'participants.user', 'project'],
      });

      const interviewsToRemind = upcomingInterviews.filter(interview => {
        const scheduledTime = new Date(interview.scheduled_at);
        return scheduledTime <= in15Minutes && scheduledTime > now;
      });

      this.logger.log(`Found ${interviewsToRemind.length} interviews needing reminders`);

      for (const interview of interviewsToRemind) {
        await this.sendInterviewReminders(interview);
      }
    } catch (error) {
      this.logger.error('Error checking upcoming interviews:', error);
    }
  }

  async sendInterviewReminders(interview: Interview): Promise<void> {
    this.logger.log(`Sending reminders for interview ${interview.id}: ${interview.title}`);

    try {
      // Ici vous pourriez intégrer avec un service d'email (SendGrid, Nodemailer, etc.)
      // Pour l'instant, on simule l'envoi des notifications

      // Préparer les données pour l'email
      const emailData = {
        interviewTitle: interview.title,
        candidateName: interview.candidate?.name,
        scheduledAt: interview.scheduled_at,
        duration: interview.duration_minutes,
        meetingLink: interview.meeting_link,
        location: interview.location,
        participants: interview.participants?.map(p => ({
          name: p.user?.name,
          email: p.user?.email,
          role: p.role,
        })) || [],
      };

      // Envoyer les rappels aux participants
      for (const participant of interview.participants || []) {
        if (participant.user?.email) {
          await this.sendParticipantReminder(participant, emailData);
        }
      }

      // Envoyer un rappel au candidat s'il a un email
      if (interview.candidate?.email) {
        await this.sendCandidateReminder(interview.candidate, emailData);
      }

      // Marquer le rappel comme envoyé
      await this.interviewRepository.update(interview.id, {
        reminder_sent: true,
      });

      this.logger.log(`✅ Reminders sent for interview ${interview.id}`);
    } catch (error) {
      this.logger.error(`Failed to send reminders for interview ${interview.id}:`, error);
    }
  }

  private async sendParticipantReminder(
    participant: InterviewParticipant,
    emailData: any
  ): Promise<void> {
    // Simulation d'envoi d'email
    this.logger.log(`📧 Sending reminder to participant: ${participant.user?.email}`);

    // Ici vous intégreriez avec votre service d'email
    // Exemple avec un template d'email:
    /*
    const emailTemplate = {
      to: participant.user?.email,
      subject: `Rappel: Entretien avec ${emailData.candidateName}`,
      template: 'interview-reminder-participant',
      data: {
        participantName: participant.user?.name,
        role: participant.role,
        ...emailData,
      },
    };

    await this.emailService.send(emailTemplate);
    */
  }

  private async sendCandidateReminder(candidate: any, emailData: any): Promise<void> {
    // Simulation d'envoi d'email
    this.logger.log(`📧 Sending reminder to candidate: ${candidate.email}`);

    // Ici vous intégreriez avec votre service d'email
    // Exemple avec un template d'email:
    /*
    const emailTemplate = {
      to: candidate.email,
      subject: `Rappel: Votre entretien commence dans 15 minutes`,
      template: 'interview-reminder-candidate',
      data: {
        candidateName: candidate.name,
        ...emailData,
      },
    };

    await this.emailService.send(emailTemplate);
    */
  }

  async sendCustomReminder(interviewId: string, minutesBefore: number): Promise<void> {
    const interview = await this.interviewRepository.findOne({
      where: { id: interviewId },
      relations: ['candidate', 'participants', 'participants.user'],
    });

    if (!interview) {
      throw new Error('Interview not found');
    }

    this.logger.log(
      `Sending custom reminder for interview ${interviewId} (${minutesBefore} minutes before)`
    );

    await this.sendInterviewReminders(interview);
  }

  async scheduleReminder(
    interviewId: string,
    reminderTime: Date
  ): Promise<void> {
    // Ici vous pourriez utiliser un job scheduler comme Bull Queue
    // pour programmer des rappels à des heures spécifiques
    this.logger.log(`Scheduling reminder for interview ${interviewId} at ${reminderTime}`);

    // Pour l'instant, on log juste l'intention
    // Dans une vraie implémentation, vous utiliseriez:
    /*
    await this.queueService.add('send-reminder', {
      interviewId,
      reminderTime,
    }, {
      delay: reminderTime.getTime() - Date.now(),
    });
    */
  }
}