import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Interview } from './interview.entity';
import { User } from '../../auth/entities/user.entity';

export enum EvaluationRecommendation {
  HIRE = 'hire',
  STRONG_HIRE = 'strong_hire',
  NO_HIRE = 'no_hire',
  STRONG_NO_HIRE = 'strong_no_hire',
  NEUTRAL = 'neutral'
}

@Entity('interview_evaluations')
export class InterviewEvaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb', { nullable: true })
  criteria_scores?: Record<string, number>;

  @Column('int', { nullable: true })
  overall_score?: number;

  @Column('text', { nullable: true })
  strengths?: string;

  @Column('text', { nullable: true })
  weaknesses?: string;

  @Column('text', { nullable: true })
  comments?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column({
    type: 'enum',
    enum: EvaluationRecommendation,
    nullable: true
  })
  recommendation?: EvaluationRecommendation;

  @Column('int', { nullable: true })
  confidence_level?: number;

  @Column('jsonb', { nullable: true })
  additional_data?: Record<string, any>;

  @Column({ default: false })
  is_completed: boolean;

  @ManyToOne(() => Interview, interview => interview.evaluations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'interview_id' })
  interview: Interview;

  @Column('uuid')
  interview_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluator_id' })
  evaluator: User;

  @Column('uuid')
  evaluator_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}