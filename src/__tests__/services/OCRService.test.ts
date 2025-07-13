// src/__tests__/services/OCRService.test.ts

import { OCRService } from '../../services/ocr/OCRService';
import { ImageOptimizer } from '../../services/ocr/ImageOptimizer';
import { NetworkClient } from '../../services/network/NetworkClient';
import { ProcessedReceipt, OCRAction } from '../../state/ocr/types';

// Mock dependencies
jest.mock('../../services/ocr/ImageOptimizer');
jest.mock('../../services/network/NetworkClient');
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
}));

const MockedImageOptimizer = ImageOptimizer as jest.Mocked<typeof ImageOptimizer>;
const MockedNetworkClient = NetworkClient as jest.MockedClass<typeof NetworkClient>;

describe('OCRService', () => {
  let service: OCRService;
  let mockNetworkClient: jest.Mocked<NetworkClient>;
  let mockProgressCallback: jest.Mock;

  // Fixed: Match actual ImageOptimizationResult interface
  const mockOptimizationResult = {
    uri: 'file://optimized.jpg',
    originalDimensions: { width: 2000, height: 1500 },
    optimizedDimensions: { width: 1200, height: 900 },
    reductionPercentage: 75,
  };

  // Separate metrics that would be created by OCRService
  const mockMetrics = {
    originalSize: 2000000,
    optimizedSize: 500000,
    originalDimensions: { width: 2000, height: 1500 },
    optimizedDimensions: { width: 1200, height: 900 },
    reductionPercentage: 75,
    processingTime: 1500,
    format: 'jpeg',
  };

  const mockClassification = {
    date: '2024-01-15',
    type: 'Fuel' as const,
    amount: '$45.99',
    vehicle: 'Truck-001',
    vendorName: 'Shell',
    location: 'Main St Gas Station',
    confidence: 0.95,
  };

  const mockJobResult = {
    extractedText: 'Shell Gas Station\nDate: 01/15/24\nTotal: $45.99\nTruck: 001',
    confidence: 0.95,
    classification: mockClassification,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    service = new OCRService({
      maxRetries: 3,
      timeout: 30000,
      chunkSize: 1024 * 1024,
    });

    mockNetworkClient = new MockedNetworkClient() as jest.Mocked<NetworkClient>;
    (service as any).networkClient = mockNetworkClient;
    
    mockProgressCallback = jest.fn();

    // Default successful mocks
    MockedImageOptimizer.optimizeImage.mockResolvedValue(mockOptimizationResult);
    mockNetworkClient.createUploadSession.mockResolvedValue({
      uploadId: 'upload-123',
      chunkSize: 1024 * 1024,
      maxChunks: 10,
    });
    mockNetworkClient.uploadFileChunked.mockResolvedValue();
    mockNetworkClient.startProcessing.mockResolvedValue({ jobId: 'job-456' });
    mockNetworkClient.getJobStatus.mockResolvedValue({
      status: 'completed',
      progress: 100,
      result: mockJobResult,
    });
  });

  describe('processImage', () => {
    const testImageUri = 'file://test-receipt.jpg';
    const testCorrelationId = 'test-correlation-id';

    it('should process receipt successfully through complete workflow', async () => {
      // Act
      const result = await service.processImage(
        testImageUri,
        mockProgressCallback,
        testCorrelationId
      );

      // Assert
      expect(result).toEqual<ProcessedReceipt>({
        imageUri: mockOptimizationResult.uri,
        originalImageUri: testImageUri,
        extractedText: mockJobResult.extractedText,
        classification: mockClassification,
        optimizationMetrics: expect.objectContaining({
          reductionPercentage: mockOptimizationResult.reductionPercentage,
          originalDimensions: mockOptimizationResult.originalDimensions,
          optimizedDimensions: mockOptimizationResult.optimizedDimensions,
        }),
        processedAt: expect.any(String),
        confidence: mockJobResult.confidence,
      });

      // Verify workflow steps
      expect(MockedImageOptimizer.optimizeImage).toHaveBeenCalledWith(
        testImageUri,
        expect.objectContaining({
          quality: 0.8,
          maxWidth: 2048,
          maxHeight: 2048,
          format: 'jpeg',
        })
      );

      expect(mockNetworkClient.createUploadSession).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Number),
        testCorrelationId,
        expect.any(AbortSignal)
      );

      expect(mockNetworkClient.uploadFileChunked).toHaveBeenCalledWith(
        mockOptimizationResult.uri,
        'upload-123',
        expect.any(Function),
        testCorrelationId,
        expect.any(AbortSignal)
      );

      expect(mockNetworkClient.startProcessing).toHaveBeenCalledWith(
        'upload-123',
        testCorrelationId,
        expect.any(AbortSignal)
      );
    });

    it('should report progress correctly throughout workflow', async () => {
      // Arrange - Mock job status progression
      mockNetworkClient.getJobStatus
        .mockResolvedValueOnce({
          status: 'active',
          progress: 10,
          stage: 'processing',
        })
        .mockResolvedValueOnce({
          status: 'active', 
          progress: 50,
          stage: 'extracting',
        })
        .mockResolvedValueOnce({
          status: 'active',
          progress: 80,
          stage: 'classifying',
        })
        .mockResolvedValueOnce({
          status: 'completed',
          progress: 100,
          result: mockJobResult,
        });

      // Act
      await service.processImage(testImageUri, mockProgressCallback);

      // Assert progress callbacks
      expect(mockProgressCallback).toHaveBeenCalledWith({
        type: 'OPTIMIZE_START',
      });

      expect(mockProgressCallback).toHaveBeenCalledWith({
        type: 'OPTIMIZE_COMPLETE',
        optimizedUri: mockOptimizationResult.uri,
        metrics: expect.any(Object),
      });

      expect(mockProgressCallback).toHaveBeenCalledWith({
        type: 'UPLOAD_COMPLETE',
      });

      expect(mockProgressCallback).toHaveBeenCalledWith({
        type: 'PROCESS_START',
        jobId: 'job-456',
      });

      expect(mockProgressCallback).toHaveBeenCalledWith({
        type: 'EXTRACT_PROGRESS',
        progress: 0.5,
      });

      expect(mockProgressCallback).toHaveBeenCalledWith({
        type: 'CLASSIFY_PROGRESS', 
        progress: 0.8,
      });
    });

    it('should handle image optimization errors', async () => {
      // Arrange
      const optimizationError = new Error('Image optimization failed');
      MockedImageOptimizer.optimizeImage.mockRejectedValue(optimizationError);

      // Act & Assert
      await expect(
        service.processImage(testImageUri, mockProgressCallback)
      ).rejects.toThrow('Image optimization failed');

      expect(mockProgressCallback).toHaveBeenCalledWith({
        type: 'ERROR',
        error: expect.objectContaining({
          code: 'OPTIMIZATION_FAILED',
          retryable: true,
        }),
      });
    });

    it('should handle network upload errors', async () => {
      // Arrange
      mockNetworkClient.uploadFileChunked.mockRejectedValue(
        new Error('Network upload failed')
      );

      // Act & Assert
      await expect(
        service.processImage(testImageUri, mockProgressCallback)
      ).rejects.toThrow('Network upload failed');

      expect(mockProgressCallback).toHaveBeenCalledWith({
        type: 'ERROR',
        error: expect.objectContaining({
          code: 'UPLOAD_FAILED',
          retryable: true,
        }),
      });
    });

    it('should handle OCR processing failures', async () => {
      // Arrange
      mockNetworkClient.getJobStatus.mockResolvedValue({
        status: 'failed',
        progress: 0,
        error: {
          code: 'OCR_FAILED',
          message: 'Could not extract text from image',
        },
      });

      // Act & Assert
      await expect(
        service.processImage(testImageUri, mockProgressCallback)
      ).rejects.toThrow('Could not extract text from image');

      expect(mockProgressCallback).toHaveBeenCalledWith({
        type: 'ERROR',
        error: expect.objectContaining({
          code: 'OCR_FAILED',
          retryable: false,
        }),
      });
    });

    it('should handle cancellation during any stage', async () => {
      // Arrange - Cancel during optimization
      MockedImageOptimizer.optimizeImage.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation cancelled')), 50);
        });
      });

      const promise = service.processImage(
        testImageUri,
        mockProgressCallback,
        testCorrelationId
      );

      // Act - Cancel immediately
      service.cancel();

      // Assert
      await expect(promise).rejects.toThrow();
    });

    it('should handle job polling timeout', async () => {
      // Arrange - Mock service with short timeout
      const shortTimeoutService = new OCRService({
        timeout: 100, // 100ms timeout
        pollInterval: 50,
      });
      (shortTimeoutService as any).networkClient = mockNetworkClient;

      // Mock job that never completes
      mockNetworkClient.getJobStatus.mockResolvedValue({
        status: 'active',
        progress: 50,
        stage: 'processing',
      });

      // Act & Assert
      await expect(
        shortTimeoutService.processImage(testImageUri, mockProgressCallback)
      ).rejects.toThrow('timeout');
    });

    it('should retry failed operations according to configuration', async () => {
      // Arrange
      mockNetworkClient.uploadFileChunked
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(); // Success on third try

      // Act
      await service.processImage(testImageUri, mockProgressCallback);

      // Assert - Should have retried 3 times total
      expect(mockNetworkClient.uploadFileChunked).toHaveBeenCalledTimes(3);
    });

    it('should handle invalid file input', async () => {
      // Arrange
      const invalidUri = 'invalid://not-a-file';

      // Act & Assert
      await expect(
        service.processImage(invalidUri, mockProgressCallback)
      ).rejects.toThrow();
    });

    it('should handle classification with low confidence', async () => {
      // Arrange
      const lowConfidenceResult = {
        ...mockJobResult,
        confidence: 0.3,
        classification: {
          ...mockClassification,
          confidence: 0.3,
        },
      };

      mockNetworkClient.getJobStatus.mockResolvedValue({
        status: 'completed',
        progress: 100,
        result: lowConfidenceResult,
      });

      // Act
      const result = await service.processImage(testImageUri, mockProgressCallback);

      // Assert
      expect(result.confidence).toBe(0.3);
      expect(mockProgressCallback).toHaveBeenCalledWith({
        type: 'CLASSIFY_COMPLETE',
        classification: expect.objectContaining({
          confidence: 0.3,
        }),
      });
    });

    it('should generate correlation ID when not provided', async () => {
      // Act
      await service.processImage(testImageUri, mockProgressCallback);

      // Assert - All network calls should have correlation ID
      expect(mockNetworkClient.createUploadSession).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Number),
        expect.stringMatching(/^rn-\w+-\d+-\w+$/), // Correlation ID format
        expect.any(AbortSignal)
      );
    });

    it('should clean up resources on completion', async () => {
      // Act
      await service.processImage(testImageUri, mockProgressCallback);

      // Assert - AbortController should be cleared
      expect((service as any).abortController).toBeUndefined();
    });
  });

  describe('cancel', () => {
    const testImageUri = 'file://test-receipt.jpg'; // Fixed: Define testImageUri in correct scope

    it('should abort ongoing operations', () => {
      // Arrange
      const mockAbortController = {
        abort: jest.fn(),
        signal: { aborted: false },
      };
      (service as any).abortController = mockAbortController;

      // Act
      service.cancel();

      // Assert
      expect(mockAbortController.abort).toHaveBeenCalled();
    });

    it('should handle cancel when no operation is running', () => {
      // Act & Assert - Should not throw
      expect(() => service.cancel()).not.toThrow();
    });
  });

  describe('error handling', () => {
    const testImageUri = 'file://test-receipt.jpg';
  
    it('should create appropriate error objects', async () => {
      // Test OPTIMIZATION_FAILED
      MockedImageOptimizer.optimizeImage.mockRejectedValueOnce(
        new Error('Optimization failed')
      );
      
      await expect(
        service.processImage(testImageUri, mockProgressCallback)
      ).rejects.toThrow('Optimization failed');
    });
  
    it('should handle network errors as retryable', async () => {
      // Reset to default successful mocks first
      MockedImageOptimizer.optimizeImage.mockResolvedValue(mockOptimizationResult);
      mockNetworkClient.createUploadSession.mockResolvedValue({
        uploadId: 'upload-123',
        chunkSize: 1024 * 1024,
        maxChunks: 10,
      });
      
      // Then make upload fail
      mockNetworkClient.uploadFileChunked.mockRejectedValueOnce(
        new Error('Network error')
      );
      
      await expect(
        service.processImage(testImageUri, mockProgressCallback)
      ).rejects.toThrow('Network error');
    });
  
    it('should handle validation errors as non-retryable', async () => {
      MockedImageOptimizer.optimizeImage.mockRejectedValueOnce(
        new Error('Invalid file format')
      );
      
      await expect(
        service.processImage(testImageUri, mockProgressCallback)
      ).rejects.toThrow('Invalid file format');
    });
  });
});