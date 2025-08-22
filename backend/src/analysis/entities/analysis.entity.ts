import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Candidate } from '../../candidates/entities/candidate.entity';

@Entity('analyses')
export class Analysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  aiResponse: string;

  @Column('jsonb')
  analysisData: any;

  @Column('decimal', { precision: 5, scale: 2 })
  score: number;

  @Column('text', { nullable: true })
  summary?: string;

  @Column('jsonb', { nullable: true })
  strengths?: string[];

  @Column('jsonb', { nullable: true })
  weaknesses?: string[];

  @Column('jsonb', { nullable: true })
  recommendations?: string[];

  @Column('jsonb', { nullable: true })
  hrDecision?: {
    recommendation: 'RECRUTER' | 'ENTRETIEN' | 'REJETER';
    confidence: number;
    reasoning: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  };

  @Column('jsonb', { nullable: true })
  skillsMatch?: {
    technical: number;
    experience: number;
    cultural: number;
    overall: number;
  };

  @Column('jsonb', { nullable: true })
  risks?: string[];

  @ManyToOne(() => Project, project => project.analyses)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column('uuid')
  projectId: string;

  @ManyToOne(() => Candidate, candidate => candidate.analyses)
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column('uuid')
  candidateId: string;

  @CreateDateColumn()
  createdAt: Date;
}