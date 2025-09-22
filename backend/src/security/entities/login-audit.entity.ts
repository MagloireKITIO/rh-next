import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Company } from '../../companies/entities/company.entity';

export enum LoginStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  SUSPICIOUS = 'suspicious'
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  UNKNOWN = 'unknown'
}

@Entity('login_audit')
@Index(['company_id', 'created_at'])
@Index(['user_id', 'created_at'])
@Index(['status', 'created_at'])
@Index(['ip_address', 'created_at'])
export class LoginAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid', { nullable: true })
  user_id: string;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column('uuid')
  company_id: string;

  @Column()
  email_attempt: string;

  @Column({
    type: 'enum',
    enum: LoginStatus,
    default: LoginStatus.FAILED
  })
  status: LoginStatus;

  @Column({ nullable: true })
  failure_reason: string;

  @Column()
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @Column({
    type: 'enum',
    enum: DeviceType,
    default: DeviceType.UNKNOWN
  })
  device_type: DeviceType;

  @Column({ nullable: true })
  browser: string;

  @Column({ nullable: true })
  operating_system: string;

  @Column({ nullable: true })
  location_country: string;

  @Column({ nullable: true })
  location_city: string;

  @Column({ nullable: true })
  location_region: string;

  @Column({ type: 'float', nullable: true })
  location_latitude: number;

  @Column({ type: 'float', nullable: true })
  location_longitude: number;

  @Column({ type: 'int', nullable: true })
  session_duration_seconds: number;

  @Column({ nullable: true })
  session_token: string;

  @Column({ default: false })
  is_suspicious: boolean;

  @Column({ type: 'text', nullable: true })
  suspicious_reasons: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}