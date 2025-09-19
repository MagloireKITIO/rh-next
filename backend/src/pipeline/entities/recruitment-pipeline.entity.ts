import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { PipelineStage } from './pipeline-stage.entity';
import { CandidatePipelineStatus } from './candidate-pipeline-status.entity';

@Entity('recruitment_pipelines')
export class RecruitmentPipeline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Project, project => project.recruitmentPipelines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column('uuid')
  projectId: string;

  @OneToMany(() => PipelineStage, stage => stage.pipeline, { cascade: true })
  stages: PipelineStage[];

  @OneToMany(() => CandidatePipelineStatus, status => status.pipeline)
  candidateStatuses: CandidatePipelineStatus[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}