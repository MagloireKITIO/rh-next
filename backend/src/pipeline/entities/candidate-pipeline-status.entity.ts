import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { RecruitmentPipeline } from './recruitment-pipeline.entity';
import { PipelineStage } from './pipeline-stage.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('candidate_pipeline_statuses')
export class CandidatePipelineStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column('uuid')
  candidateId: string;

  @ManyToOne(() => RecruitmentPipeline, pipeline => pipeline.candidateStatuses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pipelineId' })
  pipeline: RecruitmentPipeline;

  @Column('uuid')
  pipelineId: string;

  @ManyToOne(() => PipelineStage, stage => stage.candidateStatuses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'currentStageId' })
  currentStage: PipelineStage;

  @Column('uuid')
  currentStageId: string;

  @ManyToOne(() => PipelineStage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'previousStageId' })
  previousStage?: PipelineStage;

  @Column('uuid', { nullable: true })
  previousStageId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'movedBy' })
  movedByUser: User;

  @Column('uuid')
  movedBy: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('timestamp')
  movedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}