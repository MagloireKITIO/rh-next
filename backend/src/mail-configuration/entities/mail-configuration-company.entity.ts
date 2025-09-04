import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { MailConfiguration } from './mail-configuration.entity';
import { Company } from '../../companies/entities/company.entity';

@Entity('mail_configuration_companies')
export class MailConfigurationCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  mail_configuration_id: string;

  @Column()
  company_id: string;

  @ManyToOne(() => MailConfiguration, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mail_configuration_id' })
  mailConfiguration: MailConfiguration;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn()
  created_at: Date;
}