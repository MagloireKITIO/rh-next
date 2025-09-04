import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async create(createApiKeyDto: CreateApiKeyDto): Promise<Omit<ApiKey, 'key'>> {
    // Vérifier si la clé existe déjà
    const existingKey = await this.apiKeyRepository.findOne({
      where: { key: createApiKeyDto.key }
    });

    if (existingKey) {
      throw new ConflictException('This API key already exists');
    }

    const apiKey = this.apiKeyRepository.create(createApiKeyDto);
    const savedKey = await this.apiKeyRepository.save(apiKey);
    
    // Retourner sans exposer la clé complète
    return this.sanitizeApiKey(savedKey);
  }

  async findAll(): Promise<Omit<ApiKey, 'key'>[]> {
    const apiKeys = await this.apiKeyRepository.find({
      order: { createdAt: 'DESC' },
    });
    
    return apiKeys.map(key => this.sanitizeApiKey(key));
  }

  async findActive(): Promise<string[]> {
    const activeKeys = await this.apiKeyRepository.find({
      where: { isActive: true },
      select: ['key'],
      order: { requestCount: 'ASC' }, // Rotation: utiliser la clé la moins utilisée
    });
    
    return activeKeys.map(k => k.key);
  }

  async findActiveByCompany(companyId: string): Promise<string[]> {
    const activeKeys = await this.apiKeyRepository.find({
      where: { 
        isActive: true,
        company_id: companyId 
      },
      select: ['key'],
      order: { requestCount: 'ASC' }, // Rotation: utiliser la clé la moins utilisée
    });
    
    return activeKeys.map(k => k.key);
  }

  async findActiveGlobal(): Promise<string[]> {
    const activeKeys = await this.apiKeyRepository.find({
      where: { 
        isActive: true,
        company_id: null // Clés globales non assignées à une entreprise
      },
      select: ['key'],
      order: { requestCount: 'ASC' },
    });
    
    return activeKeys.map(k => k.key);
  }

  // Nouvelle méthode pour récupérer les objets complets avec IDs
  async findActiveWithIds(): Promise<{ id: string; key: string }[]> {
    const activeKeys = await this.apiKeyRepository.find({
      where: { isActive: true },
      select: ['id', 'key'],
      order: { requestCount: 'ASC' },
    });
    
    return activeKeys.map(keyObj => ({ id: keyObj.id, key: keyObj.key }));
  }

  async findActiveByCompanyWithIds(companyId: string): Promise<{ id: string; key: string }[]> {
    const activeKeys = await this.apiKeyRepository.find({
      where: { 
        isActive: true,
        company_id: companyId 
      },
      select: ['id', 'key'],
      order: { requestCount: 'ASC' },
    });
    
    return activeKeys.map(keyObj => ({ id: keyObj.id, key: keyObj.key }));
  }

  async findActiveGlobalWithIds(): Promise<{ id: string; key: string }[]> {
    const activeKeys = await this.apiKeyRepository.find({
      where: { 
        isActive: true,
        company_id: null
      },
      select: ['id', 'key'],
      order: { requestCount: 'ASC' },
    });
    
    return activeKeys.map(keyObj => ({ id: keyObj.id, key: keyObj.key }));
  }

  async findOne(id: string): Promise<Omit<ApiKey, 'key'>> {
    const apiKey = await this.apiKeyRepository.findOne({ 
      where: { id } 
    });
    
    if (!apiKey) {
      throw new NotFoundException(`API key with ID ${id} not found`);
    }
    
    return this.sanitizeApiKey(apiKey);
  }

  async update(id: string, updateApiKeyDto: UpdateApiKeyDto): Promise<Omit<ApiKey, 'key'>> {
    const apiKey = await this.apiKeyRepository.findOne({ 
      where: { id } 
    });
    
    if (!apiKey) {
      throw new NotFoundException(`API key with ID ${id} not found`);
    }

    await this.apiKeyRepository.update(id, updateApiKeyDto);
    const updatedKey = await this.apiKeyRepository.findOne({ 
      where: { id } 
    });
    
    return this.sanitizeApiKey(updatedKey);
  }

  async remove(id: string): Promise<void> {
    const result = await this.apiKeyRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`API key with ID ${id} not found`);
    }
  }

  async incrementUsage(keyValue: string): Promise<void> {
    await this.apiKeyRepository
      .createQueryBuilder()
      .update(ApiKey)
      .set({ 
        requestCount: () => 'requestCount + 1',
        lastUsedAt: new Date()
      })
      .where('key = :key', { key: keyValue })
      .execute();
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    totalRequests: number;
  }> {
    const [total, active, stats] = await Promise.all([
      this.apiKeyRepository.count(),
      this.apiKeyRepository.count({ where: { isActive: true } }),
      this.apiKeyRepository
        .createQueryBuilder('apiKey')
        .select('SUM(apiKey.requestCount)', 'totalRequests')
        .getRawOne()
    ]);

    return {
      total,
      active,
      inactive: total - active,
      totalRequests: parseInt(stats.totalRequests || '0')
    };
  }

  private sanitizeApiKey(apiKey: ApiKey): Omit<ApiKey, 'key'> {
    const { key, ...sanitized } = apiKey;
    return {
      ...sanitized,
      // Ajouter une version masquée de la clé pour l'affichage
      maskedKey: this.maskKey(key)
    } as any;
  }

  private maskKey(key: string): string {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '....' + key.substring(key.length - 4);
  }
}