import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum IntegrationProvider {
  GOOGLE_CALENDAR = 'google_calendar',
  MICROSOFT_CALENDAR = 'microsoft_calendar',
  SLACK = 'slack',
}

@Entity('user_integrations')
@Unique(['user_id', 'provider'])
export class UserIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column({
    type: 'varchar',
    enum: IntegrationProvider,
  })
  provider: IntegrationProvider;

  @Column('text')
  access_token: string;

  @Column('text', { nullable: true })
  refresh_token: string;

  @Column('timestamp', { nullable: true })
  expires_at: Date;

  @Column({ default: 'primary' })
  calendar_id: string;

  @Column('text', { nullable: true })
  scope: string;

  @Column({ nullable: true })
  provider_user_id: string;

  @Column({ nullable: true })
  provider_email: string;

  @Column({ default: true })
  is_active: boolean;

  @Column('timestamp', { nullable: true })
  last_sync_at: Date;

  @Column('jsonb', { nullable: true })
  sync_errors: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Méthodes utilitaires
  isTokenExpired(): boolean {
    if (!this.expires_at) return false;
    return new Date() >= this.expires_at;
  }

  needsRefresh(): boolean {
    if (!this.expires_at) return false;
    // Rafraîchir 5 minutes avant expiration
    const bufferTime = 5 * 60 * 1000; // 5 minutes en ms
    return new Date().getTime() + bufferTime >= this.expires_at.getTime();
  }

  isGoogleCalendar(): boolean {
    return this.provider === IntegrationProvider.GOOGLE_CALENDAR;
  }

  getProviderDisplayName(): string {
    switch (this.provider) {
      case IntegrationProvider.GOOGLE_CALENDAR:
        return 'Google Calendar';
      case IntegrationProvider.MICROSOFT_CALENDAR:
        return 'Microsoft Calendar';
      case IntegrationProvider.SLACK:
        return 'Slack';
      default:
        return this.provider;
    }
  }
}