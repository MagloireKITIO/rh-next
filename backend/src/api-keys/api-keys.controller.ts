import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(@Body() createApiKeyDto: CreateApiKeyDto) {
    return this.apiKeysService.create(createApiKeyDto);
  }

  @Get()
  findAll() {
    return this.apiKeysService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.apiKeysService.getStats();
  }

  @Get('active')
  findActive() {
    return this.apiKeysService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.apiKeysService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateApiKeyDto: UpdateApiKeyDto) {
    return this.apiKeysService.update(id, updateApiKeyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.apiKeysService.remove(id);
  }

  @Post(':id/toggle')
  async toggleStatus(@Param('id') id: string) {
    const apiKey = await this.apiKeysService.findOne(id);
    return this.apiKeysService.update(id, { isActive: !apiKey.isActive });
  }
}