import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiKey } from './api-key.entity';

@Entity('api_key_model_configs')
export class ApiKeyModelConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'api_key_id' })
  apiKeyId: string;

  @ManyToOne(() => ApiKey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'api_key_id' })
  apiKey: ApiKey;

  @Column({ name: 'primary_model' })
  primaryModel: string; // Ex: 'openai/gpt-4-turbo'

  @Column({ name: 'fallback_model_1', nullable: true })
  fallbackModel1: string; // Ex: 'anthropic/claude-3-haiku'

  @Column({ name: 'fallback_model_2', nullable: true })
  fallbackModel2: string; // Ex: 'meta-llama/llama-3.2-3b-instruct'

  @Column({ name: 'fallback_model_3', nullable: true })
  fallbackModel3: string; // Ex: 'openai/gpt-3.5-turbo'

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string; // Notes sur le choix des modèles

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Méthode utilitaire pour récupérer tous les modèles dans l'ordre
  getModelsFallbackOrder(): string[] {
    const models = [this.primaryModel];
    
    if (this.fallbackModel1) models.push(this.fallbackModel1);
    if (this.fallbackModel2) models.push(this.fallbackModel2);
    if (this.fallbackModel3) models.push(this.fallbackModel3);
    
    return models.filter(Boolean);
  }
}