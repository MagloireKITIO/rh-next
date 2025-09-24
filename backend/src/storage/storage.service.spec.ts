import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { StorageService } from './storage.service';
import { AzureStorageService } from './azure-storage.service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('StorageService', () => {
  let service: StorageService;
  let azureStorageService: jest.Mocked<AzureStorageService>;

  const mockSupabaseClient = {
    storage: {
      from: jest.fn(),
    },
  };

  const mockSupabaseStorage = {
    upload: jest.fn(),
    remove: jest.fn(),
    getPublicUrl: jest.fn(),
  };

  const mockAzureStorageService = {
    isAzureStorageConfigured: jest.fn(),
    uploadFile: jest.fn(),
    uploadOfferDocument: jest.fn(),
    deleteFile: jest.fn(),
    getFileUrl: jest.fn(),
  };

  beforeEach(async () => {
    // Reset environment variables
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: AzureStorageService,
          useValue: mockAzureStorageService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    azureStorageService = module.get(AzureStorageService);

    // Setup Supabase mock
    mockSupabaseClient.storage.from.mockReturnValue(mockSupabaseStorage as any);
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with Supabase when credentials are provided', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      const newService = module.get<StorageService>(StorageService);

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key'
      );
      expect(newService.isSupabaseConfigured()).toBe(true);
    });

    it('should handle missing Supabase credentials gracefully', () => {
      // Credentials are already not set in beforeEach
      expect(service.isSupabaseConfigured()).toBe(false);
    });

    it('should warn when Supabase credentials are missing', async () => {
      // Mock environment variables to be undefined
      const originalSupabaseUrl = process.env.SUPABASE_URL;
      const originalSupabaseKey = process.env.SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;

      // Mock the Logger prototype
      const mockWarn = jest.fn();
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(mockWarn);

      const module = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      // Instantiate the service to trigger any warnings
      const storageService = module.get<StorageService>(StorageService);

      // Check that logger.warn was called
      expect(mockWarn).toHaveBeenCalledWith('Supabase credentials not found, using local storage');

      // Restore environment variables and mocks
      if (originalSupabaseUrl) process.env.SUPABASE_URL = originalSupabaseUrl;
      if (originalSupabaseKey) process.env.SUPABASE_ANON_KEY = originalSupabaseKey;
      jest.restoreAllMocks();
    });
  });

  describe('File Name Sanitization', () => {
    it('should sanitize file names correctly', async () => {
      // Setup Supabase
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);

      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(false);
      mockSupabaseStorage.upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
      mockSupabaseStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.url' },
      });

      const testCases = [
        { input: 'file with spaces.pdf', expected: 'file_with_spaces.pdf' },
        { input: 'fichier-avec-accénts.pdf', expected: 'fichier-avec-accents.pdf' },
        { input: 'file@#$%^&*().pdf', expected: 'file.pdf' },
        { input: '___multiple___underscores___.pdf', expected: 'multiple_underscores.pdf' },
        { input: '_leading_and_trailing_.pdf', expected: 'leading_and_trailing.pdf' },
      ];

      for (const testCase of testCases) {
        const file = Buffer.from('test content');
        await testService.uploadFile(file, testCase.input, 'application/pdf');

        expect(mockSupabaseStorage.upload).toHaveBeenCalledWith(
          expect.stringMatching(new RegExp(`cvs/\\d+-${testCase.expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)),
          file,
          expect.any(Object)
        );

        mockSupabaseStorage.upload.mockClear();
      }
    });
  });

  describe('uploadFile', () => {
    beforeEach(() => {
      // Setup Supabase for upload tests
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    });

    it('should upload file using Azure Storage when configured', async () => {
      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(true);
      mockAzureStorageService.uploadFile.mockResolvedValue('https://azure.blob.url');

      const file = Buffer.from('test content');
      const fileName = 'test.pdf';
      const mimeType = 'application/pdf';

      const result = await service.uploadFile(file, fileName, mimeType);

      expect(mockAzureStorageService.uploadFile).toHaveBeenCalledWith(
        file,
        fileName,
        mimeType,
        'cv'
      );
      expect(result).toBe('https://azure.blob.url');
    });

    it('should fallback to Supabase when Azure is not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);

      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(false);
      mockSupabaseStorage.upload.mockResolvedValue({
        data: { path: 'cvs/123456789-test.pdf' },
        error: null,
      });
      mockSupabaseStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://supabase.storage.url/test.pdf' },
      });

      const file = Buffer.from('test content');
      const fileName = 'test.pdf';
      const mimeType = 'application/pdf';

      const result = await testService.uploadFile(file, fileName, mimeType);

      expect(mockSupabaseStorage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^cvs\/\d+-test\.pdf$/),
        file,
        {
          contentType: mimeType,
          upsert: false,
        }
      );
      expect(result).toBe('https://supabase.storage.url/test.pdf');
    });

    it('should handle different file types correctly', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);

      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(false);
      mockSupabaseStorage.upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
      mockSupabaseStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.url' },
      });

      const file = Buffer.from('test content');

      // Test offer document
      await testService.uploadFile(file, 'offer.pdf', 'application/pdf', 'offer');
      expect(mockSupabaseStorage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^offer-documents\/\d+-offer\.pdf$/),
        file,
        expect.any(Object)
      );

      // Test offer image
      await testService.uploadFile(file, 'image.jpg', 'image/jpeg', 'offer-image');
      expect(mockSupabaseStorage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^offer-images\/\d+-image\.jpg$/),
        file,
        expect.any(Object)
      );
    });

    it('should throw error when no storage service is configured', async () => {
      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(false);

      const file = Buffer.from('test content');

      await expect(
        service.uploadFile(file, 'test.pdf', 'application/pdf')
      ).rejects.toThrow('No storage service configured');
    });

    it('should handle Supabase upload errors', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);

      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(false);
      mockSupabaseStorage.upload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      const file = Buffer.from('test content');

      await expect(
        testService.uploadFile(file, 'test.pdf', 'application/pdf')
      ).rejects.toThrow('Upload failed: Upload failed');
    });

    it('should handle Supabase client exceptions', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);

      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(false);
      mockSupabaseStorage.upload.mockRejectedValue(new Error('Network error'));

      const file = Buffer.from('test content');

      await expect(
        testService.uploadFile(file, 'test.pdf', 'application/pdf')
      ).rejects.toThrow('Network error');
    });
  });

  describe('uploadOfferDocument', () => {
    it('should upload offer document with correct parameters', async () => {
      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(true);
      mockAzureStorageService.uploadFile.mockResolvedValue('https://azure.blob.url');

      const file = Buffer.from('pdf content');
      const fileName = 'offer.pdf';

      const result = await service.uploadOfferDocument(file, fileName);

      expect(mockAzureStorageService.uploadFile).toHaveBeenCalledWith(
        file,
        fileName,
        'application/pdf',
        'offer'
      );
      expect(result).toBe('https://azure.blob.url');
    });
  });

  describe('uploadOfferImage', () => {
    it('should determine MIME type correctly for different image formats', async () => {
      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(true);
      mockAzureStorageService.uploadFile.mockResolvedValue('https://azure.blob.url');

      const file = Buffer.from('image content');

      const testCases = [
        { fileName: 'image.jpg', expectedMimeType: 'image/jpeg' },
        { fileName: 'image.jpeg', expectedMimeType: 'image/jpeg' },
        { fileName: 'image.png', expectedMimeType: 'image/png' },
        { fileName: 'image.webp', expectedMimeType: 'image/webp' },
        { fileName: 'image.unknown', expectedMimeType: 'image/jpeg' }, // default
        { fileName: 'IMAGE.PNG', expectedMimeType: 'image/png' }, // case insensitive
      ];

      for (const testCase of testCases) {
        await service.uploadOfferImage(file, testCase.fileName);

        expect(mockAzureStorageService.uploadFile).toHaveBeenCalledWith(
          file,
          testCase.fileName,
          testCase.expectedMimeType,
          'offer-image'
        );

        mockAzureStorageService.uploadFile.mockClear();
      }
    });
  });

  describe('deleteFile', () => {
    it('should delete file using Azure Storage when configured', async () => {
      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(true);
      mockAzureStorageService.deleteFile.mockResolvedValue(undefined);

      const filePath = 'cvs/test-file.pdf';

      await service.deleteFile(filePath);

      expect(mockAzureStorageService.deleteFile).toHaveBeenCalledWith(filePath);
    });

    it('should fallback to Supabase when Azure is not configured', async () => {
      // Setup environment for Supabase
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);

      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(false);
      mockSupabaseStorage.remove.mockResolvedValue({
        data: true,
        error: null,
      });

      const filePath = 'cvs/test-file.pdf';

      await testService.deleteFile(filePath);

      expect(mockSupabaseStorage.remove).toHaveBeenCalledWith([filePath]);

      // Cleanup
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
    });

    it('should throw error when no storage service is configured', async () => {
      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(false);

      const filePath = 'cvs/test-file.pdf';

      await expect(service.deleteFile(filePath)).rejects.toThrow(
        'No storage service configured'
      );
    });

    it('should handle Supabase delete errors', async () => {
      // Setup environment for Supabase
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);

      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(false);
      mockSupabaseStorage.remove.mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      });

      const filePath = 'cvs/test-file.pdf';

      await expect(testService.deleteFile(filePath)).rejects.toThrow(
        'Delete failed: Delete failed'
      );

      // Cleanup
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
    });

    it('should handle Supabase client exceptions during delete', async () => {
      // Setup environment for Supabase
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);

      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(false);
      mockSupabaseStorage.remove.mockRejectedValue(new Error('Network error'));

      const filePath = 'cvs/test-file.pdf';

      await expect(testService.deleteFile(filePath)).rejects.toThrow('Network error');

      // Cleanup
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
    });
  });

  describe('isSupabaseConfigured', () => {
    it('should return true when Supabase is configured', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);

      expect(testService.isSupabaseConfigured()).toBe(true);
    });

    it('should return false when Supabase is not configured', () => {
      expect(service.isSupabaseConfigured()).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty file names', async () => {
      // Setup environment for Supabase
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);

      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(false);
      mockSupabaseStorage.upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
      mockSupabaseStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.url' },
      });

      const file = Buffer.from('test content');

      await testService.uploadFile(file, '', 'application/pdf');

      // Should still upload with sanitized empty name
      expect(mockSupabaseStorage.upload).toHaveBeenCalled();

      // Cleanup
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
    });

    it('should handle very long file names', async () => {
      // Setup environment for Supabase
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);

      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(false);
      mockSupabaseStorage.upload.mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });
      mockSupabaseStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.url' },
      });

      const file = Buffer.from('test content');
      const longFileName = 'a'.repeat(300) + '.pdf';

      await testService.uploadFile(file, longFileName, 'application/pdf');

      expect(mockSupabaseStorage.upload).toHaveBeenCalled();

      // Cleanup
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
    });

    it('should handle empty files', async () => {
      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(true);
      mockAzureStorageService.uploadFile.mockResolvedValue('https://azure.blob.url');

      const emptyFile = Buffer.alloc(0);

      const result = await service.uploadFile(emptyFile, 'empty.pdf', 'application/pdf');

      expect(mockAzureStorageService.uploadFile).toHaveBeenCalledWith(
        emptyFile,
        'empty.pdf',
        'application/pdf',
        'cv'
      );
      expect(result).toBe('https://azure.blob.url');
    });

    it('should handle binary files correctly', async () => {
      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(true);
      mockAzureStorageService.uploadFile.mockResolvedValue('https://azure.blob.url');

      // Create a buffer with binary data
      const binaryFile = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG header

      const result = await service.uploadFile(binaryFile, 'image.png', 'image/png');

      expect(mockAzureStorageService.uploadFile).toHaveBeenCalledWith(
        binaryFile,
        'image.png',
        'image/png',
        'cv'
      );
      expect(result).toBe('https://azure.blob.url');
    });
  });

  describe('Integration with Azure Storage Priority', () => {
    it('should always prefer Azure Storage when both services are configured', async () => {
      // Both services configured
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: AzureStorageService,
            useValue: mockAzureStorageService,
          },
        ],
      }).compile();

      const testService = module.get<StorageService>(StorageService);

      mockAzureStorageService.isAzureStorageConfigured.mockReturnValue(true);
      mockAzureStorageService.uploadFile.mockResolvedValue('https://azure.blob.url');

      const file = Buffer.from('test content');

      const result = await testService.uploadFile(file, 'test.pdf', 'application/pdf');

      expect(mockAzureStorageService.uploadFile).toHaveBeenCalled();
      expect(mockSupabaseStorage.upload).not.toHaveBeenCalled();
      expect(result).toBe('https://azure.blob.url');
    });
  });
});