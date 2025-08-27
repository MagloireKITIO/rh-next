import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Analysis } from '../../analysis/entities/analysis.entity';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  jobDescription: string;

  @Column('text', { nullable: true })
  customPrompt?: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true })
  public_share_token: string;

  @Column({ default: false })
  is_public_shared: boolean;

  @Column({ nullable: true })
  public_share_expires_at: Date;

  @Column('timestamp', { nullable: true })
  startDate?: Date;

  @Column('timestamp', { nullable: true })
  endDate?: Date;

  @Column('text', { nullable: true })
  offerDescription?: string;

  @Column({ nullable: true })
  offerDocumentUrl?: string;

  @Column({ nullable: true })
  offerDocumentFileName?: string;

  @ManyToOne(() => Company, company => company.projects)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column('uuid')
  company_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column('uuid')
  created_by: string;

  @OneToMany(() => Candidate, candidate => candidate.project)
  candidates: Candidate[];

  @OneToMany(() => Analysis, analysis => analysis.project)
  analyses: Analysis[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}