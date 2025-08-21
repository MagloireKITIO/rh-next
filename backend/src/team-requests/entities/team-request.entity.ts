import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';

export enum TeamRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity('team_requests')
export class TeamRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  requester_email: string;

  @Column()
  requester_name: string;

  @Column('text', { nullable: true })
  message: string;

  @Column({
    type: 'enum',
    enum: TeamRequestStatus,
    default: TeamRequestStatus.PENDING
  })
  status: TeamRequestStatus;

  @Column({ nullable: true })
  project_share_token: string;

  @ManyToOne(() => Company, company => company.teamRequests)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column('uuid')
  company_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processed_by' })
  processedBy: User;

  @Column('uuid', { nullable: true })
  processed_by: string;

  @Column({ nullable: true })
  processed_at: Date;

  @Column('text', { nullable: true })
  rejection_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}