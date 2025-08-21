import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { TeamRequest } from '../../team-requests/entities/team-request.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  domain: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column('jsonb', { nullable: true })
  settings: any;

  @OneToMany(() => User, user => user.company)
  users: User[];

  @OneToMany(() => Project, project => project.company)
  projects: Project[];

  @OneToMany(() => TeamRequest, teamRequest => teamRequest.company)
  teamRequests: TeamRequest[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}