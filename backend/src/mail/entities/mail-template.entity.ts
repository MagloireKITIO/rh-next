import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

export enum TemplateType {
  CONFIRM_SIGNUP = 'confirm_signup',
  INVITE_USER = 'invite_user',
  MAGIC_LINK = 'magic_link',
  CHANGE_EMAIL = 'change_email',
  RESET_PASSWORD = 'reset_password',
  REAUTHENTICATION = 'reauthentication',
  TEAM_REQUEST_NOTIFICATION = 'team_request_notification',
  CANDIDATE_ANALYSIS_COMPLETE = 'candidate_analysis_complete',
  CANDIDATE_APPLICATION = 'candidate_application',
  PROJECT_SHARED = 'project_shared'
}

@Entity('mail_templates')
export class MailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TemplateType
  })
  template_type: TemplateType;

  @Column()
  subject: string;

  @Column('text')
  html_body: string;

  @Column('text', { nullable: true })
  text_body: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_default: boolean;

  // Configuration spécifique à une entreprise (optionnel)
  @Column({ nullable: true })
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  // Variables disponibles pour ce type de template
  @Column('text', { nullable: true })
  available_variables: string; // JSON string

  // Notes/description du template
  @Column('text', { nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}