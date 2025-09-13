import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { MailAutomation } from './mail-automation.entity';

export enum AutomationLogStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped',
}

@Entity('automation_logs')
export class AutomationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  automation_id: string;

  @ManyToOne(() => MailAutomation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'automation_id' })
  automation: MailAutomation;

  @Column()
  entity_id: string;

  @Column()
  entity_type: string;

  @Column({
    type: 'enum',
    enum: AutomationLogStatus,
  })
  status: AutomationLogStatus;

  @Column({ nullable: true })
  error_message?: string;

  @Column({ nullable: true })
  email_sent_to?: string;

  @Column({ type: 'json', nullable: true })
  context_data?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}