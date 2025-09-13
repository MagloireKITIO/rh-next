import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MailTemplate } from './mail-template.entity';
import { User } from '../../auth/entities/user.entity';
import { Company } from '../../companies/entities/company.entity';

export enum TriggerType {
  ON_CREATE = 'onCreate',
  ON_UPDATE = 'onUpdate', 
  ON_DELETE = 'onDelete',
}

export enum VisibilityType {
  COMPANY = 'company',
  SYSTEM = 'system',
}

@Entity('mail_automations')
export class MailAutomation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  company_id?: string;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  target_entity: string;

  @Column({
    type: 'enum',
    enum: TriggerType,
  })
  trigger_type: TriggerType;

  @Column({ type: 'text', nullable: true })
  conditions?: string;

  @Column({ type: 'text', nullable: true })
  conditions_querystring?: string;

  @Column()
  mail_template_id: string;

  @ManyToOne(() => MailTemplate)
  @JoinColumn({ name: 'mail_template_id' })
  mail_template: MailTemplate;

  @Column({ type: 'text' })
  recipient_rules: string;

  @Column({ type: 'json', nullable: true })
  cc_users?: string[];

  @Column({ default: true })
  is_active: boolean;

  @Column({
    type: 'enum',
    enum: VisibilityType,
    default: VisibilityType.COMPANY,
  })
  visibility: VisibilityType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}