import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { RecruitmentPipeline } from './recruitment-pipeline.entity';
import { CandidatePipelineStatus } from './candidate-pipeline-status.entity';

@Entity('pipeline_stages')
export class PipelineStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('int')
  order: number;

  @Column({ nullable: true })
  color?: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => RecruitmentPipeline, pipeline => pipeline.stages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pipelineId' })
  pipeline: RecruitmentPipeline;

  @Column('uuid')
  pipelineId: string;

  @OneToMany(() => CandidatePipelineStatus, status => status.currentStage)
  candidateStatuses: CandidatePipelineStatus[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}