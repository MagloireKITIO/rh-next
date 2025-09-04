import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

export enum MailTemplateType {
  INVITATION = 'invitation',
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password_reset',
  WELCOME = 'welcome',
  NOTIFICATION = 'notification',
  CUSTOM = 'custom'
}

export enum MailTemplateContext {
  SYSTEM = 'system',           // Templates système (invitation, verification, password_reset, welcome)
  AUTOMATION = 'automation'    // Templates pour les automations (notification, custom)
}

export enum MailTemplateStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
}

@Entity('mail_templates')
export class MailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MailTemplateType
  })
  type: MailTemplateType;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  subject: string;

  @Column('text')
  html_content: string;

  @Column('text', { nullable: true })
  text_content?: string;

  @Column('json', { nullable: true })
  variables?: Record<string, any>;

  @Column({
    type: 'enum',
    enum: MailTemplateStatus,
    default: MailTemplateStatus.DRAFT
  })
  status: MailTemplateStatus;

  @Column({ default: false })
  is_default: boolean;

  @Column({ nullable: true })
  company_id?: string;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @Column({ default: 1 })
  version: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

// Fonction utilitaire pour obtenir le contexte d'un type de template
export function getTemplateContext(type: MailTemplateType): MailTemplateContext {
  switch (type) {
    case MailTemplateType.INVITATION:
    case MailTemplateType.VERIFICATION:
    case MailTemplateType.PASSWORD_RESET:
    case MailTemplateType.WELCOME:
      return MailTemplateContext.SYSTEM;
    case MailTemplateType.NOTIFICATION:
    case MailTemplateType.CUSTOM:
      return MailTemplateContext.AUTOMATION;
    default:
      return MailTemplateContext.AUTOMATION;
  }
}

// Fonction utilitaire pour obtenir les types de template par contexte
export function getTemplateTypesByContext(context: MailTemplateContext): MailTemplateType[] {
  if (context === MailTemplateContext.SYSTEM) {
    return [MailTemplateType.INVITATION, MailTemplateType.VERIFICATION, MailTemplateType.PASSWORD_RESET, MailTemplateType.WELCOME];
  } else {
    return [MailTemplateType.NOTIFICATION, MailTemplateType.CUSTOM];
  }
}