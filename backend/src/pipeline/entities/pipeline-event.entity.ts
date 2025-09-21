import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { User } from '../../auth/entities/user.entity';

export enum PipelineEventType {
  CANDIDATE_MOVED = 'CANDIDATE_MOVED',
  CANDIDATE_ADDED = 'CANDIDATE_ADDED',
  CANDIDATE_REMOVED = 'CANDIDATE_REMOVED',
  CANDIDATE_ANALYZED = 'CANDIDATE_ANALYZED',
  EMAIL_SENT = 'EMAIL_SENT',
  NOTE_ADDED = 'NOTE_ADDED',
  STAGE_CREATED = 'STAGE_CREATED',
  STAGE_UPDATED = 'STAGE_UPDATED',
  STAGE_DELETED = 'STAGE_DELETED'
}

@Entity('pipeline_events')
export class PipelineEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PipelineEventType
  })
  eventType: PipelineEventType;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column('uuid')
  projectId: string;

  @ManyToOne(() => Candidate, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate?: Candidate;

  @Column('uuid', { nullable: true })
  candidateId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  userId: string;

  @Column('jsonb', { nullable: true })
  eventData?: {
    fromStage?: string;
    toStage?: string;
    stageName?: string;
    stageColor?: string;
    emailSubject?: string;
    noteContent?: string;
    analysisScore?: number;
    [key: string]: any;
  };

  @Column('text', { nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;
}