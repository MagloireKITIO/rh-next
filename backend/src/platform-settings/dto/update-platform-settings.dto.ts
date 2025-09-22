import { PartialType } from '@nestjs/mapped-types';
import { CreatePlatformSettingsDto } from './create-platform-settings.dto';

export class UpdatePlatformSettingsDto extends PartialType(CreatePlatformSettingsDto) {}