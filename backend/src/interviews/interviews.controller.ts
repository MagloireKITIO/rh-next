import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto, UpdateInterviewDto, CreateInterviewEvaluationDto, UpdateInterviewEvaluationDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InterviewStatus } from './entities/interview.entity';
import { ParticipantStatus } from './entities/interview-participant.entity';

@UseGuards(JwtAuthGuard)
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  create(@Body() createInterviewDto: CreateInterviewDto, @Request() req) {
    return this.interviewsService.create(createInterviewDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.interviewsService.findAll();
  }

  @Get('project/:projectId')
  async findByProject(@Param('projectId', ParseUUIDPipe) projectId: string, @Request() req) {
    try {
      const result = await this.interviewsService.findByProject(projectId);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get('candidate/:candidateId')
  async findByCandidate(@Param('candidateId', ParseUUIDPipe) candidateId: string) {
    try {
      const result = await this.interviewsService.findByCandidate(candidateId);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get('user/:userId')
  async findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    try {
      const result = await this.interviewsService.findByUser(userId);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get('calendar')
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    try {
      const result = await this.interviewsService.findByDateRange(start, end);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.interviewsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateInterviewDto: UpdateInterviewDto) {
    return this.interviewsService.update(id, updateInterviewDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: InterviewStatus,
  ) {
    return this.interviewsService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.interviewsService.remove(id);
  }

  // Gestion des participants
  @Post(':id/participants')
  addParticipant(
    @Param('id', ParseUUIDPipe) interviewId: string,
    @Body('userId') userId: string,
    @Body('role') role: string,
  ) {
    return this.interviewsService.addParticipant(interviewId, userId, role);
  }

  @Patch('participants/:participantId/status')
  updateParticipantStatus(
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Body('status') status: ParticipantStatus,
  ) {
    return this.interviewsService.updateParticipantStatus(participantId, status);
  }

  @Delete('participants/:participantId')
  removeParticipant(@Param('participantId', ParseUUIDPipe) participantId: string) {
    return this.interviewsService.removeParticipant(participantId);
  }

  // Gestion des évaluations
  @Post('evaluations')
  createEvaluation(
    @Body() createEvaluationDto: CreateInterviewEvaluationDto,
    @Request() req,
  ) {
    return this.interviewsService.createEvaluation(createEvaluationDto, req.user.id);
  }

  @Get(':id/evaluations')
  findEvaluationsByInterview(@Param('id', ParseUUIDPipe) interviewId: string) {
    return this.interviewsService.findEvaluationsByInterview(interviewId);
  }

  @Patch('evaluations/:evaluationId')
  updateEvaluation(
    @Param('evaluationId', ParseUUIDPipe) evaluationId: string,
    @Body() updateEvaluationDto: UpdateInterviewEvaluationDto,
  ) {
    return this.interviewsService.updateEvaluation(evaluationId, updateEvaluationDto);
  }

  @Delete('evaluations/:evaluationId')
  removeEvaluation(@Param('evaluationId', ParseUUIDPipe) evaluationId: string) {
    return this.interviewsService.removeEvaluation(evaluationId);
  }

  // Utilitaires
  @Get('availability/:date')
  getAvailableTimeSlots(
    @Param('date') date: string,
    @Query('userIds') userIds: string,
    @Query('duration') duration: number = 60,
  ) {
    const userIdArray = userIds.split(',');
    return this.interviewsService.getAvailableTimeSlots(userIdArray, new Date(date), duration);
  }

  @Post(':id/meeting-link')
  generateMeetingLink(@Param('id', ParseUUIDPipe) interviewId: string) {
    return this.interviewsService.generateMeetingLink(interviewId);
  }

  @Post('sync-calendar')
  syncCalendar(@Request() req) {
    return this.interviewsService.syncCalendar(req.user.id);
  }

  @Post(':id/sync-attendees')
  syncAttendeesStatus(@Param('id', ParseUUIDPipe) interviewId: string) {
    return this.interviewsService.syncAttendeesStatus(interviewId);
  }

  @Post('check-conflicts')
  async checkConflicts(
    @Body('userId') userId: string,
    @Body('startTime') startTime: string,
    @Body('endTime') endTime: string,
    @Request() req
  ) {
    // Utiliser l'utilisateur connecté si userId n'est pas fourni
    const userIdToCheck = userId || req.user.id;
    return this.interviewsService.checkUserConflicts(
      userIdToCheck,
      new Date(startTime),
      new Date(endTime)
    );
  }

  @Get('calendar-events')
  async getCalendarEvents(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    try {
      const result = await this.interviewsService.getCalendarEvents(req.user.id, { start, end });
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post(':id/send-reminder')
  async sendReminder(
    @Param('id', ParseUUIDPipe) interviewId: string,
    @Body('minutesBefore') minutesBefore: number = 15
  ) {
    return this.interviewsService.sendInterviewReminder(interviewId, minutesBefore);
  }
}