import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Analysis } from '../../analysis/entities/analysis.entity';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column('text')
  extractedText: string;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column('jsonb', { nullable: true })
  extractedData?: any;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  score: number;

  @Column({ default: 'pending' })
  status: string; // pending, analyzed, shortlisted, rejected

  @Column('text', { nullable: true })
  summary?: string;

  @Column({ default: 0 })
  ranking: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  previousScore?: number;

  @ManyToOne(() => Project, project => project.candidates)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column('uuid')
  projectId: string;

  @OneToMany(() => Analysis, analysis => analysis.candidate)
  analyses: Analysis[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}