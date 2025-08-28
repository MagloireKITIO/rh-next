import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

export enum MailProviderType {
  SUPABASE = 'supabase',
  SMTP = 'smtp',
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  AWS_SES = 'aws_ses'
}

@Entity('mail_configurations')
export class MailConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MailProviderType,
    default: MailProviderType.SUPABASE
  })
  provider_type: MailProviderType;

  @Column({ nullable: true })
  company_id: string;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  // Configuration SMTP
  @Column({ nullable: true })
  smtp_host?: string;

  @Column({ type: 'int', nullable: true })
  smtp_port?: number;

  @Column({ nullable: true })
  smtp_user?: string;

  @Column({ nullable: true, select: false })
  smtp_password?: string;

  @Column({ default: true })
  smtp_secure: boolean;

  @Column({ default: false })
  smtp_require_tls: boolean;

  // Configuration services tiers (chiffrées)
  @Column({ nullable: true, select: false })
  api_key?: string;

  @Column({ nullable: true, select: false })
  api_secret?: string;

  // Configuration générale
  @Column()
  from_email: string;

  @Column({ default: 'RH Analytics Pro' })
  from_name: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_default: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}