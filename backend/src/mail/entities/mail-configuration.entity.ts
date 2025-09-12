import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { MailConfigurationCompany } from './mail-configuration-company.entity';

@Entity('mail_configurations')
export class MailConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'smtp' })
  provider_type: string;

  // Configuration SMTP
  @Column({ nullable: true })
  smtp_host: string;

  @Column({ nullable: true })
  smtp_port: number;

  @Column({ nullable: true })
  smtp_user: string;

  @Column({ nullable: true })
  smtp_password: string;

  @Column({ default: true })
  smtp_secure: boolean;

  @Column({ default: false })
  smtp_require_tls: boolean;

  // Configuration générale
  @Column()
  from_email: string;

  @Column()
  from_name: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_default: boolean;

  // Ancienne relation pour compatibilité (optionnelle)
  @Column({ nullable: true })
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  // Nouvelle relation many-to-many via table pivot
  @OneToMany(() => MailConfigurationCompany, configCompany => configCompany.configuration)
  configurationCompanies: MailConfigurationCompany[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}