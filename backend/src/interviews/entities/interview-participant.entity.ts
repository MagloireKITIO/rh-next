import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Interview } from './interview.entity';
import { User } from '../../auth/entities/user.entity';

export enum ParticipantRole {
  INTERVIEWER = 'interviewer',
  OBSERVER = 'observer',
  COORDINATOR = 'coordinator'
}

export enum ParticipantStatus {
  INVITED = 'invited',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  TENTATIVE = 'tentative'
}

@Entity('interview_participants')
export class InterviewParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.INTERVIEWER
  })
  role: ParticipantRole;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.INVITED
  })
  status: ParticipantStatus;

  @Column({ default: false })
  is_required: boolean;

  @Column('text', { nullable: true })
  notes?: string;

  @Column({ default: false })
  calendar_invite_sent: boolean;

  @ManyToOne(() => Interview, interview => interview.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'interview_id' })
  interview: Interview;

  @Column('uuid')
  interview_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid')
  user_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}