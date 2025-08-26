import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { AzureStorageService } from './azure-storage.service';

@Module({
  providers: [StorageService, AzureStorageService],
  exports: [StorageService],
})
export class StorageModule {}