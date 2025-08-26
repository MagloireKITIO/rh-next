import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

export enum UserRole {
  ADMIN = 'admin',
  HR = 'hr',
  USER = 'user'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ nullable: true })
  password_hash: string;

  @Column({ unique: true, nullable: true })
  supabase_user_id: string;

  @Column({ unique: true, nullable: true })
  google_id: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_invited: boolean;

  @Column({ default: false })
  is_onboarded: boolean;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ nullable: true })
  invitation_token: string;

  @Column({ nullable: true })
  invitation_expires_at: Date;

  @ManyToOne(() => Company, company => company.users)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column('uuid', { nullable: true })
  company_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}