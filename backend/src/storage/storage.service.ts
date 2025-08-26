import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AzureStorageService } from './azure-storage.service';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient;

  constructor(private readonly azureStorageService: AzureStorageService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase credentials not found, using local storage');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\-_.]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    // Prioriser Azure Storage si configuré
    if (this.azureStorageService.isAzureStorageConfigured()) {
      return this.azureStorageService.uploadFile(file, fileName, mimeType);
    }

    // Fallback vers Supabase
    if (!this.supabase) {
      throw new Error('No storage service configured');
    }

    try {
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const filePath = `cvs/${Date.now()}-${sanitizedFileName}`;
      
      const { data, error } = await this.supabase.storage
        .from('cv-documents')
        .upload(filePath, file, {
          contentType: mimeType,
          upsert: false
        });

      if (error) {
        this.logger.error('Error uploading to Supabase:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Générer l'URL publique
      const { data: urlData } = this.supabase.storage
        .from('cv-documents')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      this.logger.error('Error uploading file to Supabase:', error);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    // Prioriser Azure Storage si configuré
    if (this.azureStorageService.isAzureStorageConfigured()) {
      return this.azureStorageService.deleteFile(filePath);
    }

    // Fallback vers Supabase
    if (!this.supabase) {
      throw new Error('No storage service configured');
    }

    try {
      const { error } = await this.supabase.storage
        .from('cv-documents')
        .remove([filePath]);

      if (error) {
        this.logger.error('Error deleting from Supabase:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      this.logger.error('Error deleting file from Supabase:', error);
      throw error;
    }
  }

  isSupabaseConfigured(): boolean {
    return !!this.supabase;
  }
}