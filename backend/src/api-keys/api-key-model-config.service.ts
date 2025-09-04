import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeyModelConfig } from './entities/api-key-model-config.entity';
import { ApiKey } from './entities/api-key.entity';

export interface ModelConfigData {
  primaryModel?: string; // Optional pour les PATCH
  fallbackModel1?: string;
  fallbackModel2?: string;
  fallbackModel3?: string;
  notes?: string;
}

@Injectable()
export class ApiKeyModelConfigService {
  constructor(
    @InjectRepository(ApiKeyModelConfig)
    private configRepository: Repository<ApiKeyModelConfig>,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async findByApiKeyId(apiKeyId: string): Promise<ApiKeyModelConfig | null> {
    return this.configRepository.findOne({
      where: { apiKeyId, isActive: true },
      relations: ['apiKey'],
    });
  }

  async getModelsFallbackOrder(apiKeyId: string): Promise<string[]> {
    const config = await this.findByApiKeyId(apiKeyId);
    
    if (!config) {
      // Retourner des modèles par défaut si aucune configuration
      return this.getDefaultModels();
    }

    return config.getModelsFallbackOrder();
  }

  async createOrUpdateConfig(apiKeyId: string, configData: ModelConfigData): Promise<ApiKeyModelConfig> {
    // Vérifier que la clé API existe
    const apiKey = await this.apiKeyRepository.findOne({ where: { id: apiKeyId } });
    if (!apiKey) {
      throw new NotFoundException('Clé API introuvable');
    }

    // Vérifier que la clé est pour OpenRouter
    if (apiKey.provider !== 'openrouter') {
      throw new BadRequestException('La configuration de modèles n\'est disponible que pour les clés OpenRouter');
    }

    // Chercher une configuration existante
    let config = await this.findByApiKeyId(apiKeyId);

    // Pour une nouvelle configuration, le modèle principal est requis
    if (!config && !configData.primaryModel) {
      throw new BadRequestException('Le modèle principal est requis pour une nouvelle configuration');
    }

    if (config) {
      // Mettre à jour la configuration existante
      Object.assign(config, configData);
    } else {
      // Créer une nouvelle configuration
      config = this.configRepository.create({
        apiKeyId,
        ...configData,
      });
    }

    return this.configRepository.save(config);
  }

  async deleteConfig(apiKeyId: string): Promise<void> {
    const config = await this.findByApiKeyId(apiKeyId);
    
    if (config) {
      config.isActive = false;
      await this.configRepository.save(config);
    }
  }

  async getAllConfigs(): Promise<ApiKeyModelConfig[]> {
    return this.configRepository.find({
      where: { isActive: true },
      relations: ['apiKey'],
      order: { createdAt: 'DESC' },
    });
  }

  private getDefaultModels(): string[] {
    // Modèles par défaut équilibrés coût/performance
    return [
      'meta-llama/llama-3.2-11b-vision-instruct', // Bon rapport qualité/prix
      'anthropic/claude-3-haiku', // Rapide et économique
      'openai/gpt-3.5-turbo' // Fallback fiable
    ];
  }

  async getModelStats(): Promise<{
    totalConfigs: number;
    configuredKeys: number;
    popularModels: { model: string; count: number }[];
  }> {
    const configs = await this.getAllConfigs();
    
    const modelUsage = new Map<string, number>();
    
    configs.forEach(config => {
      const models = config.getModelsFallbackOrder();
      models.forEach(model => {
        modelUsage.set(model, (modelUsage.get(model) || 0) + 1);
      });
    });

    const popularModels = Array.from(modelUsage.entries())
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalConfigs: configs.length,
      configuredKeys: configs.length,
      popularModels,
    };
  }
}