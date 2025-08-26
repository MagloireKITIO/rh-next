import { Injectable, Logger } from '@nestjs/common';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

@Injectable()
export class AzureStorageService {
  private readonly logger = new Logger(AzureStorageService.name);
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private readonly containerName = 'cv-documents';

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    
    if (!connectionString) {
      this.logger.warn('Azure Storage connection string not found');
      return;
    }

    try {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      this.initializeContainer();
    } catch (error) {
      this.logger.error('Failed to initialize Azure Storage:', error);
    }
  }

  private async initializeContainer(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists({
        access: 'blob'
      });
      this.logger.log(`Container ${this.containerName} initialized`);
    } catch (error) {
      this.logger.error('Failed to initialize container:', error);
    }
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
    if (!this.containerClient) {
      throw new Error('Azure Storage not configured');
    }

    try {
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const blobName = `cvs/${Date.now()}-${sanitizedFileName}`;
      
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.upload(file, file.length, {
        blobHTTPHeaders: {
          blobContentType: mimeType
        }
      });

      this.logger.log(`File uploaded successfully: ${blobName}`);
      return blockBlobClient.url;
    } catch (error) {
      this.logger.error('Error uploading file to Azure Storage:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async deleteFile(blobName: string): Promise<void> {
    if (!this.containerClient) {
      throw new Error('Azure Storage not configured');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      this.logger.log(`File deleted successfully: ${blobName}`);
    } catch (error) {
      this.logger.error('Error deleting file from Azure Storage:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async getFileUrl(blobName: string): Promise<string> {
    if (!this.containerClient) {
      throw new Error('Azure Storage not configured');
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.url;
  }

  isAzureStorageConfigured(): boolean {
    return !!this.containerClient;
  }
}