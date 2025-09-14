import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Company } from '../../companies/entities/company.entity';

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}

@Entity('email_history')
export class EmailHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  to: string;

  @Column()
  subject: string;

  @Column('text')
  message: string;

  @Column('text', { nullable: true })
  html_content?: string;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDING
  })
  status: EmailStatus;

  @Column('jsonb', { nullable: true })
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;

  @Column({ nullable: true })
  failure_reason?: string;

  @Column({ nullable: true })
  sent_at?: Date;

  @Column({ nullable: true })
  delivered_at?: Date;

  @Column({ nullable: true })
  read_at?: Date;

  // Relations
  @Column('uuid')
  candidate_id: string;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @Column('uuid')
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}