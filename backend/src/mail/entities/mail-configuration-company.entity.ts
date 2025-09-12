import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { MailConfiguration } from './mail-configuration.entity';
import { Company } from '../../companies/entities/company.entity';

@Entity('mail_configuration_companies')
export class MailConfigurationCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  configuration_id: string;

  @Column()
  company_id: string;

  @ManyToOne(() => MailConfiguration, config => config.configurationCompanies, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'configuration_id' })
  configuration: MailConfiguration;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn()
  created_at: Date;
}