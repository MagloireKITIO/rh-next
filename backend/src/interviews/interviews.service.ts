import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Interview, InterviewStatus } from './entities/interview.entity';
import { InterviewParticipant, ParticipantStatus } from './entities/interview-participant.entity';
import { InterviewEvaluation } from './entities/interview-evaluation.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../auth/entities/user.entity';
import { CreateInterviewDto, UpdateInterviewDto, CreateInterviewEvaluationDto, UpdateInterviewEvaluationDto } from './dto';
import { CalendarService } from '../calendar/calendar.service';

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    @InjectRepository(Interview)
    private interviewRepository: Repository<Interview>,
    @InjectRepository(InterviewParticipant)
    private participantRepository: Repository<InterviewParticipant>,
    @InjectRepository(InterviewEvaluation)
    private evaluationRepository: Repository<InterviewEvaluation>,
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectDataSource()
    private dataSource: DataSource,
    private calendarService: CalendarService,
  ) {}

  async create(createInterviewDto: CreateInterviewDto, createdBy: string): Promise<Interview> {
    this.logger.log(`🔄 Creating interview for candidate ${createInterviewDto.candidate_id}`);

    return await this.dataSource.transaction(async manager => {
      // Vérifier que le candidat et le projet existent
      const candidate = await manager.findOne(Candidate, {
        where: { id: createInterviewDto.candidate_id }
      });
      if (!candidate) {
        throw new NotFoundException('Candidate not found');
      }

      const project = await manager.findOne(Project, {
        where: { id: createInterviewDto.project_id }
      });
      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Créer l'entretien
      const interview = manager.create(Interview, {
        ...createInterviewDto,
        created_by: createdBy,
      });

      const savedInterview = await manager.save(interview);
      this.logger.log(`✅ Interview created with ID: ${savedInterview.id}`);

      // Ajouter les participants
      let participants: InterviewParticipant[] = [];
      if (createInterviewDto.participants && createInterviewDto.participants.length > 0) {
        participants = createInterviewDto.participants.map(participantDto =>
          manager.create(InterviewParticipant, {
            ...participantDto,
            interview_id: savedInterview.id,
          })
        );

        await manager.save(participants);
        this.logger.log(`✅ Added ${participants.length} participants to interview`);
      }

      // Créer l'événement Google Calendar avec Meet automatique
      try {
        await this.createCalendarEvent(savedInterview, candidate, participants);
        this.logger.log(`📅 Calendar event created for interview ${savedInterview.id}`);
      } catch (error) {
        this.logger.warn(`⚠️ Failed to create calendar event for interview ${savedInterview.id}: ${error.message}`);
        // Ne pas faire échouer la création de l'entretien si le calendrier échoue
        // L'utilisateur peut générer le lien Meet manuellement plus tard
      }

      return savedInterview;
    });
  }

  async findAll(): Promise<Interview[]> {
    return this.interviewRepository.find({
      relations: ['candidate', 'project', 'participants', 'participants.user', 'evaluations'],
      order: { scheduled_at: 'ASC' },
    });
  }

  async findByProject(projectId: string): Promise<Interview[]> {
    return this.interviewRepository.find({
      where: { project_id: projectId },
      relations: ['candidate', 'project', 'participants', 'participants.user', 'evaluations', 'evaluations.evaluator'],
      order: { scheduled_at: 'ASC' },
    });
  }

  async findByCandidate(candidateId: string): Promise<Interview[]> {
    return this.interviewRepository.find({
      where: { candidate_id: candidateId },
      relations: ['candidate', 'project', 'participants', 'participants.user', 'evaluations', 'evaluations.evaluator'],
      order: { scheduled_at: 'ASC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Interview[]> {
    return this.interviewRepository.find({
      where: {
        scheduled_at: Between(startDate, endDate),
      },
      relations: ['candidate', 'project', 'participants', 'participants.user'],
      order: { scheduled_at: 'ASC' },
    });
  }

  async findByUser(userId: string): Promise<Interview[]> {
    return this.interviewRepository
      .createQueryBuilder('interview')
      .leftJoinAndSelect('interview.candidate', 'candidate')
      .leftJoinAndSelect('interview.project', 'project')
      .leftJoinAndSelect('interview.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .where('participants.user_id = :userId', { userId })
      .orderBy('interview.scheduled_at', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<Interview> {
    const interview = await this.interviewRepository.findOne({
      where: { id },
      relations: ['candidate', 'project', 'participants', 'participants.user', 'evaluations', 'evaluations.evaluator'],
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    return interview;
  }

  async update(id: string, updateInterviewDto: UpdateInterviewDto): Promise<Interview> {
    const interview = await this.findOne(id);

    // Mettre à jour l'entretien
    Object.assign(interview, updateInterviewDto);

    const updatedInterview = await this.interviewRepository.save(interview);
    this.logger.log(`✅ Interview ${id} updated`);

    return updatedInterview;
  }

  async updateStatus(id: string, status: InterviewStatus): Promise<Interview> {
    const interview = await this.findOne(id);

    interview.status = status;

    // Mettre à jour les timestamps selon le statut
    const now = new Date();
    switch (status) {
      case InterviewStatus.IN_PROGRESS:
        interview.started_at = now;
        break;
      case InterviewStatus.COMPLETED:
        if (!interview.started_at) {
          interview.started_at = now;
        }
        interview.ended_at = now;
        break;
    }

    const updatedInterview = await this.interviewRepository.save(interview);
    this.logger.log(`✅ Interview ${id} status updated to ${status}`);

    return updatedInterview;
  }

  async remove(id: string): Promise<void> {
    const interview = await this.findOne(id);
    await this.interviewRepository.remove(interview);
    this.logger.log(`✅ Interview ${id} removed`);
  }

  // Gestion des participants
  async addParticipant(interviewId: string, userId: string, role: string): Promise<InterviewParticipant> {
    const interview = await this.findOne(interviewId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const participant = this.participantRepository.create({
      interview_id: interviewId,
      user_id: userId,
      role: role as any,
    });

    return this.participantRepository.save(participant);
  }

  async updateParticipantStatus(participantId: string, status: ParticipantStatus): Promise<InterviewParticipant> {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.status = status;
    return this.participantRepository.save(participant);
  }

  async removeParticipant(participantId: string): Promise<void> {
    const participant = await this.participantRepository.findOne({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    await this.participantRepository.remove(participant);
  }

  // Gestion des évaluations
  async createEvaluation(createEvaluationDto: CreateInterviewEvaluationDto, evaluatorId: string): Promise<InterviewEvaluation> {
    const interview = await this.findOne(createEvaluationDto.interview_id);

    const evaluation = this.evaluationRepository.create({
      ...createEvaluationDto,
      evaluator_id: evaluatorId,
    });

    const savedEvaluation = await this.evaluationRepository.save(evaluation);
    this.logger.log(`✅ Evaluation created for interview ${createEvaluationDto.interview_id}`);

    return savedEvaluation;
  }

  async updateEvaluation(id: string, updateEvaluationDto: UpdateInterviewEvaluationDto): Promise<InterviewEvaluation> {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      relations: ['interview', 'evaluator'],
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    Object.assign(evaluation, updateEvaluationDto);

    const updatedEvaluation = await this.evaluationRepository.save(evaluation);
    this.logger.log(`✅ Evaluation ${id} updated`);

    return updatedEvaluation;
  }

  async findEvaluationsByInterview(interviewId: string): Promise<InterviewEvaluation[]> {
    return this.evaluationRepository.find({
      where: { interview_id: interviewId },
      relations: ['evaluator'],
      order: { created_at: 'ASC' },
    });
  }

  async removeEvaluation(id: string): Promise<void> {
    const evaluation = await this.evaluationRepository.findOne({ where: { id } });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    await this.evaluationRepository.remove(evaluation);
    this.logger.log(`✅ Evaluation ${id} removed`);
  }

  // Utilitaires pour la planification
  async getAvailableTimeSlots(userIds: string[], date: Date, duration: number): Promise<any[]> {
    // TODO: Implémenter la logique de vérification des disponibilités
    // Cela pourrait inclure l'intégration avec des calendriers externes
    this.logger.log(`🔍 Checking availability for ${userIds.length} users on ${date}`);

    // Pour l'instant, retourner des créneaux par défaut
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      if (hour !== 12 && hour !== 13) { // Éviter l'heure du déjeuner
        slots.push({
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0),
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + Math.floor(duration / 60), duration % 60),
          available: true,
        });
      }
    }

    return slots;
  }

  async generateMeetingLink(interviewId: string): Promise<string> {
    const interview = await this.findOne(interviewId);
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    // Si l'entretien a déjà un lien Meet depuis Google Calendar, le retourner
    if (interview.meeting_link && interview.meeting_link.includes('meet.google.com')) {
      return interview.meeting_link;
    }

    // Sinon générer un nouveau lien Meet via Google Calendar
    try {
      const participants = await this.participantRepository.find({
        where: { interview_id: interviewId },
        relations: ['user'],
      });

      const candidate = await this.candidateRepository.findOne({
        where: { id: interview.candidate_id },
      });

      if (candidate) {
        const calendarEvent = await this.createCalendarEvent(interview, candidate, participants, true);
        const meetingLink = calendarEvent?.hangoutLink || calendarEvent?.conferenceData?.entryPoints?.[0]?.uri;

        if (meetingLink) {
          // Mettre à jour l'entretien avec le lien Meet
          await this.interviewRepository.update(interviewId, { meeting_link: meetingLink });
          return meetingLink;
        }
      }
    } catch (error) {
      this.logger.error(`Failed to generate meeting link: ${error.message}`);
    }

    // Fallback: générer un lien fictif
    const meetingId = `meeting-${interviewId.slice(-8)}`;
    return `https://meet.company.com/interview/${meetingId}`;
  }

  /**
   * Créer un événement Google Calendar avec Meet automatique
   */
  private async createCalendarEvent(
    interview: Interview,
    candidate: any,
    participants: InterviewParticipant[],
    forceUpdate = false
  ): Promise<any> {
    try {
      // Récupérer les utilisateurs participants avec leurs emails
      const participantsWithUsers = await Promise.all(
        participants.map(async (p) => {
          const user = await this.userRepository.findOne({ where: { id: p.user_id } });
          return { ...p, user };
        })
      );

      // Formater l'événement pour Google Calendar
      const calendarEvent = this.calendarService.formatInterviewEvent({
        title: interview.title,
        description: interview.description,
        scheduled_at: interview.scheduled_at,
        duration_minutes: interview.duration_minutes,
        candidate: { name: candidate.name, email: candidate.email },
        participants: participantsWithUsers.filter(p => p.user).map(p => ({
          ...p,
          user: { email: p.user.email, name: p.user.name }
        })),
        location: interview.location,
      });

      // Ajouter la génération automatique de Meet
      const eventWithMeet = this.calendarService.generateMeetEvent(calendarEvent);

      // Utiliser le calendrier principal (peut être configuré via env)
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

      // Créer l'événement dans Google Calendar
      const createdEvent = await this.calendarService.createEvent(calendarId, eventWithMeet);

      this.logger.log(`📅 Calendar event created: ${createdEvent.id}`);

      // Mettre à jour l'entretien avec les informations Calendar
      const updateData: any = {
        meeting_id: createdEvent.id,
        calendar_invites_sent: true,
      };

      // Extraire le lien Meet s'il existe
      if (createdEvent.hangoutLink) {
        updateData.meeting_link = createdEvent.hangoutLink;
      } else if (createdEvent.conferenceData?.entryPoints?.[0]?.uri) {
        updateData.meeting_link = createdEvent.conferenceData.entryPoints[0].uri;
      }

      await this.interviewRepository.update(interview.id, updateData);

      return createdEvent;
    } catch (error) {
      this.logger.error(`Failed to create calendar event for interview ${interview.id}: ${error.message}`);

      // Si Google Calendar n'est pas configuré, on continue sans erreur
      if (error.message?.includes('not initialized') || error.message?.includes('credentials')) {
        this.logger.warn('Google Calendar not properly configured. Skipping calendar integration.');
        return null;
      }

      throw error;
    }
  }
}