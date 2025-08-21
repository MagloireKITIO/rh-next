import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';

@Controller('configuration')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Post()
  create(@Body() createConfigurationDto: CreateConfigurationDto) {
    return this.configurationService.create(createConfigurationDto);
  }

  @Get()
  findAll() {
    return this.configurationService.findAll();
  }

  @Get('ai')
  getAIConfiguration() {
    return this.configurationService.getAIConfiguration();
  }

  @Get('key/:key')
  findByKey(@Param('key') key: string) {
    return this.configurationService.findByKey(key);
  }

  @Post('set')
  setValue(@Body() body: { key: string; value: string; description?: string }) {
    return this.configurationService.setValue(body.key, body.value, body.description);
  }

  @Post('initialize')
  initializeDefaults() {
    return this.configurationService.initializeDefaultConfigurations();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateConfigurationDto: UpdateConfigurationDto) {
    return this.configurationService.update(id, updateConfigurationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.configurationService.remove(id);
  }
}