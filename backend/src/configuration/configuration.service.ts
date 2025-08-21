import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuration } from './entities/configuration.entity';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectRepository(Configuration)
    private configRepository: Repository<Configuration>,
  ) {}

  async create(createConfigDto: CreateConfigurationDto): Promise<Configuration> {
    const config = this.configRepository.create(createConfigDto);
    return await this.configRepository.save(config);
  }

  async findAll(): Promise<Configuration[]> {
    return await this.configRepository.find({
      order: { key: 'ASC' },
    });
  }

  async findByKey(key: string): Promise<Configuration | null> {
    return await this.configRepository.findOne({
      where: { key, isActive: true },
    });
  }

  async getValue(key: string): Promise<string | null> {
    const config = await this.findByKey(key);
    return config ? config.value : null;
  }

  async setValue(key: string, value: string, description?: string): Promise<Configuration> {
    const existingConfig = await this.findByKey(key);
    
    if (existingConfig) {
      await this.configRepository.update(existingConfig.id, { value, description });
      return this.configRepository.findOne({ where: { id: existingConfig.id } });
    } else {
      return this.create({ key, value, description, isActive: true });
    }
  }

  async update(id: string, updateConfigDto: UpdateConfigurationDto): Promise<Configuration> {
    await this.configRepository.update(id, updateConfigDto);
    const config = await this.configRepository.findOne({ where: { id } });
    
    if (!config) {
      throw new NotFoundException(`Configuration with ID ${id} not found`);
    }
    
    return config;
  }

  async remove(id: string): Promise<void> {
    const result = await this.configRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Configuration with ID ${id} not found`);
    }
  }

  async getAIConfiguration() {
    const togetherAiKeys = await this.getValue('TOGETHER_AI_KEYS');
    const defaultPrompt = await this.getValue('DEFAULT_AI_PROMPT');
    
    return {
      togetherAiKeys: togetherAiKeys ? togetherAiKeys.split(',').length : 0,
      hasDefaultPrompt: !!defaultPrompt,
      defaultPrompt: defaultPrompt || this.getDefaultPrompt(),
    };
  }

  private getDefaultPrompt(): string {
    return `You are an expert HR recruiter. Analyze the provided CV against the job description and rate the candidate's fit for the position. Consider skills match, experience relevance, education background, and overall profile alignment.

Provide a detailed analysis including:
- Overall score (0-100)
- Brief summary of the candidate
- Key strengths related to the position
- Potential weaknesses or gaps
- Recommendations for the recruiter

Be objective and focus on job-relevant criteria.`;
  }

  async initializeDefaultConfigurations() {
    const defaultConfigs = [
      {
        key: 'DEFAULT_AI_PROMPT',
        value: this.getDefaultPrompt(),
        description: 'Default prompt for AI analysis of CVs'
      },
      {
        key: 'MAX_UPLOAD_SIZE',
        value: '10485760', // 10MB
        description: 'Maximum file size for CV uploads in bytes'
      },
      {
        key: 'SUPPORTED_FILE_TYPES',
        value: 'pdf',
        description: 'Supported file types for CV uploads'
      },
      {
        key: 'AI_ANALYSIS_TIMEOUT',
        value: '30000', // 30 seconds
        description: 'Timeout for AI analysis requests in milliseconds'
      }
    ];

    for (const config of defaultConfigs) {
      const existing = await this.findByKey(config.key);
      if (!existing) {
        await this.create({
          ...config,
          isActive: true
        });
      }
    }
  }
}