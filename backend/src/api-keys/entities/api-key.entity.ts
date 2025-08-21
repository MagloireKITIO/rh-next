import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  key: string;

  @Column({ length: 100, nullable: true })
  name?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  requestCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @Column({ length: 50, default: 'together_ai' })
  provider: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}