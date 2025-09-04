import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    request?: string;
  };
  top_provider: {
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
  per_request_limits?: {
    prompt_tokens: string;
    completion_tokens: string;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

@Injectable()
export class OpenRouterService {
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  constructor(private configService: ConfigService) {}

  async getModels(apiKey: string): Promise<OpenRouterModelsResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des modèles OpenRouter:', error);
      
      if (error.response?.status === 401) {
        throw new HttpException(
          'Clé API OpenRouter invalide ou expirée',
          HttpStatus.UNAUTHORIZED,
        );
      }
      
      if (error.response?.status === 403) {
        throw new HttpException(
          'Accès refusé - vérifiez les permissions de votre clé API',
          HttpStatus.FORBIDDEN,
        );
      }
      
      throw new HttpException(
        'Erreur lors de la récupération des modèles OpenRouter',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFilteredModels(apiKey: string, filters?: {
    modality?: string;
    provider?: string;
    maxContextLength?: number;
  }): Promise<OpenRouterModelsResponse> {
    const modelsResponse = await this.getModels(apiKey);
    
    if (!filters) {
      return modelsResponse;
    }

    const filteredModels = modelsResponse.data.filter(model => {
      if (filters.modality && model.architecture.modality !== filters.modality) {
        return false;
      }
      
      if (filters.maxContextLength && model.context_length > filters.maxContextLength) {
        return false;
      }
      
      if (filters.provider && !model.id.toLowerCase().includes(filters.provider.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    return {
      data: filteredModels,
    };
  }

  async getModelById(apiKey: string, modelId: string): Promise<OpenRouterModel | null> {
    const modelsResponse = await this.getModels(apiKey);
    return modelsResponse.data.find(model => model.id === modelId) || null;
  }

  async getProviders(apiKey: string): Promise<string[]> {
    const modelsResponse = await this.getModels(apiKey);
    const providers = new Set<string>();
    
    modelsResponse.data.forEach(model => {
      // Extraire le fournisseur du nom du modèle (ex: "openai/gpt-4" -> "openai")
      const provider = model.id.split('/')[0];
      if (provider) {
        providers.add(provider);
      }
    });
    
    return Array.from(providers).sort();
  }
}