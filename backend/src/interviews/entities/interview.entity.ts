import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../auth/entities/user.entity';
import { InterviewParticipant } from './interview-participant.entity';
import { InterviewEvaluation } from './interview-evaluation.entity';

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled'
}

export enum InterviewType {
  VIDEO_CALL = 'video_call',
  PHONE = 'phone',
  IN_PERSON = 'in_person'
}

@Entity('interviews')
export class Interview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('timestamp')
  scheduled_at: Date;

  @Column('timestamp', { nullable: true })
  started_at?: Date;

  @Column('timestamp', { nullable: true })
  ended_at?: Date;

  @Column('int', { default: 60 })
  duration_minutes: number;

  @Column({
    type: 'enum',
    enum: InterviewStatus,
    default: InterviewStatus.SCHEDULED
  })
  status: InterviewStatus;

  @Column({
    type: 'enum',
    enum: InterviewType,
    default: InterviewType.VIDEO_CALL
  })
  type: InterviewType;

  @Column('text', { nullable: true })
  meeting_link?: string;

  @Column('text', { nullable: true })
  meeting_id?: string;

  @Column('text', { nullable: true })
  location?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('text', { nullable: true })
  agenda?: string;

  @Column('jsonb', { nullable: true })
  evaluation_criteria?: Record<string, any>;

  @Column({ default: false })
  calendar_invites_sent: boolean;

  @Column({ default: false })
  reminder_sent: boolean;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @Column('uuid')
  candidate_id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column('uuid')
  project_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @Column('uuid')
  created_by: string;

  @OneToMany(() => InterviewParticipant, participant => participant.interview, { cascade: true })
  participants: InterviewParticipant[];

  @OneToMany(() => InterviewEvaluation, evaluation => evaluation.interview, { cascade: true })
  evaluations: InterviewEvaluation[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}