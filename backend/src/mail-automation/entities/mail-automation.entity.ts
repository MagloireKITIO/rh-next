import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { MailTemplate } from '../../mail-configuration/entities/mail-template.entity';
import { User } from '../../auth/entities/user.entity';
import { AutomationCondition } from './automation-condition.entity';

export enum AutomationTrigger {
  ON_CREATE = 'on_create',
  ON_UPDATE = 'on_update',
  ON_DELETE = 'on_delete',
}

export enum AutomationEntityType {
  CANDIDATE = 'candidate',
  PROJECT = 'project',
  USER = 'user',
  ANALYSIS = 'analysis',
}

export enum AutomationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

@Entity('mail_automations')
export class MailAutomation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({
    type: 'enum',
    enum: AutomationTrigger
  })
  trigger: AutomationTrigger;

  @Column({
    type: 'enum',
    enum: AutomationEntityType
  })
  entity_type: AutomationEntityType;

  @Column({
    type: 'enum',
    enum: AutomationStatus,
    default: AutomationStatus.DRAFT
  })
  status: AutomationStatus;

  // Relations
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column('uuid')
  company_id: string;

  @ManyToOne(() => MailTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mail_template_id' })
  mail_template: MailTemplate;

  @Column('uuid')
  mail_template_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @Column('uuid')
  created_by: string;

  // Destinataires (JSON array des emails ou des rôles)
  @Column('jsonb', { default: [] })
  recipients: string[];

  // Variables pour le template
  @Column('jsonb', { nullable: true })
  template_variables?: Record<string, any>;

  // Conditions
  @OneToMany(() => AutomationCondition, condition => condition.mail_automation, { cascade: true })
  conditions: AutomationCondition[];

  // Statistiques
  @Column({ default: 0 })
  sent_count: number;

  @Column({ default: 0 })
  success_count: number;

  @Column({ default: 0 })
  failed_count: number;

  @Column({ nullable: true })
  last_triggered_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}