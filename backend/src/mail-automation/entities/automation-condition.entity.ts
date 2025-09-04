import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MailAutomation } from './mail-automation.entity';

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  IN = 'in',
  NOT_IN = 'not_in',
}

export enum ConditionLogic {
  AND = 'and',
  OR = 'or',
}

@Entity('automation_conditions')
export class AutomationCondition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MailAutomation, automation => automation.conditions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mail_automation_id' })
  mail_automation: MailAutomation;

  @Column('uuid')
  mail_automation_id: string;

  // Champ de l'entité à vérifier (ex: 'status', 'score', 'project.name')
  @Column()
  field_path: string;

  @Column({
    type: 'enum',
    enum: ConditionOperator
  })
  operator: ConditionOperator;

  // Valeur à comparer (stockée en JSON pour supporter différents types)
  @Column('jsonb', { nullable: true })
  value?: any;

  // Logique avec la condition suivante (AND/OR)
  @Column({
    type: 'enum',
    enum: ConditionLogic,
    nullable: true
  })
  logic?: ConditionLogic;

  // Ordre d'évaluation des conditions
  @Column({ default: 0 })
  order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}