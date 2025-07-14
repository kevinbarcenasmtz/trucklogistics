// src/services/ocr/OCRService.ts

import * as FileSystem from 'expo-file-system';
import {
  ERROR_CODES,
  OCRAction,
  OCRError,
  OptimizationMetrics,
  ProcessedReceipt,
} from '../../state/ocr/types';
import { AIClassifiedReceipt } from '../../types/ReceiptInterfaces';
import { generateCorrelationId } from '../../utils/correlation';

/**
 * Configuration for OCR service
 */
interface OCRConfig {
  apiUrl: string;
  chunkSize: number;
  pollInterval: number;
  timeout: number;
  maxRetries: number;
}

/**
 * Progress callback function type
 */
type ProgressCallback = (action: OCRAction) => void;

/**
 * Image optimization result
 */
interface OptimizationResult {
  optimizedUri: string;
  metrics: OptimizationMetrics;
}

/**
 * Upload session response
 */
interface UploadSessionResponse {
  uploadId: string;
  chunkSize: number;
  maxChunks: number;
}

/**
 * Job status response
 */
interface JobStatusResponse {
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress: number;
  stage?: 'uploading' | 'processing' | 'extracting' | 'classifying';
  result?: {
    extractedText: string;
    confidence: number;
    classification: AIClassifiedReceipt;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Type guard for FileInfo with size property
 */
function hasSize(
  fileInfo: FileSystem.FileInfo
): fileInfo is FileSystem.FileInfo & { size: number } {
  return fileInfo.exists && 'size' in fileInfo;
}

/**
 * Unified OCR Service
 * Handles the complete OCR workflow from image optimization to classification
 */
export class OCRService {
  private config: OCRConfig;
  private abortController?: AbortController;

  constructor(config?: Partial<OCRConfig>) {
    this.config = {
      apiUrl: process.env.EXPO_PUBLIC_OCR_API_URL || 'http://localhost:3000',
      chunkSize: parseInt(process.env.EXPO_PUBLIC_OCR_CHUNK_SIZE || '1048576', 10), // 1MB
      pollInterval: parseInt(process.env.EXPO_PUBLIC_OCR_POLL_INTERVAL || '1000', 10), // 1s
      timeout: parseInt(process.env.EXPO_PUBLIC_OCR_TIMEOUT || '60000', 10), // 60s
      maxRetries: 3,
      ...config,
    };
  }

  /**
   * Process an image through the complete OCR workflow
   * @param imageUri Local path to the image
   * @param onProgress Callback for progress updates
   * @param correlationId Optional correlation ID for tracking
   * @returns Promise with the processed receipt data
   */
  async processImage(
    imageUri: string,
    onProgress: ProgressCallback,
    correlationId?: string
  ): Promise<ProcessedReceipt> {
    const corrId = correlationId || generateCorrelationId();
    this.abortController = new AbortController();

    try {
      // Step 1: Optimize image (0-20%)
      onProgress({ type: 'OPTIMIZE_START' });
      const optimizationResult = await this.optimizeImage(imageUri, onProgress);

      onProgress({
        type: 'OPTIMIZE_COMPLETE',
        optimizedUri: optimizationResult.optimizedUri,
        metrics: optimizationResult.metrics,
      });

      // Step 2: Upload image (20-50%)
      const uploadId = await this.uploadImage(optimizationResult.optimizedUri, corrId, onProgress);

      onProgress({ type: 'UPLOAD_COMPLETE' });

      // Step 3: Start OCR processing (50-80%)
      const jobId = await this.startProcessing(uploadId, corrId);
      onProgress({ type: 'PROCESS_START', jobId });

      // Step 4: Poll for completion and handle classification (80-100%)
      const result = await this.pollJobStatus(jobId, corrId, onProgress);

      // Return processed receipt data
      return {
        imageUri: optimizationResult.optimizedUri,
        originalImageUri: imageUri,
        extractedText: result.extractedText,
        classification: result.classification,
        optimizationMetrics: optimizationResult.metrics,
        processedAt: new Date().toISOString(),
        confidence: result.confidence,
      };
    } catch (error) {
      this.handleError(error, onProgress);
      throw error;
    }
  }

  /**
   * Cancel the current OCR operation
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Optimize image for upload
   * @param imageUri Local image path
   * @param onProgress Progress callback
   * @returns Optimization result with new URI and metrics
   */
  private async optimizeImage(
    imageUri: string,
    onProgress: ProgressCallback
  ): Promise<OptimizationResult> {
    try {
      // Import ImageOptimizer dynamically to avoid circular dependencies
      const { ImageOptimizer } = await import('./ImageOptimizer');

      const startTime = Date.now();
      onProgress({ type: 'OPTIMIZE_PROGRESS', progress: 0.1 });

      // Get original file info
      const originalInfo = await FileSystem.getInfoAsync(imageUri);
      if (!originalInfo.exists) {
        throw this.createError('FILE_NOT_FOUND', 'Image file not found');
      }

      onProgress({ type: 'OPTIMIZE_PROGRESS', progress: 0.3 });

      // Optimize the image
      const optimizedResult = await ImageOptimizer.optimizeImage(imageUri, {
        quality: 0.8,
        maxWidth: 2048,
        maxHeight: 2048,
        format: 'jpeg',
      });

      onProgress({ type: 'OPTIMIZE_PROGRESS', progress: 0.7 });

      // Get optimized file info
      const optimizedInfo = await FileSystem.getInfoAsync(optimizedResult.uri);
      const processingTime = Date.now() - startTime;

      onProgress({ type: 'OPTIMIZE_PROGRESS', progress: 1.0 });

      const metrics: OptimizationMetrics = {
        originalSize: hasSize(originalInfo) ? originalInfo.size : 0,
        optimizedSize: hasSize(optimizedInfo) ? optimizedInfo.size : 0,
        originalDimensions: optimizedResult.originalDimensions,
        optimizedDimensions: optimizedResult.optimizedDimensions,
        reductionPercentage: optimizedResult.reductionPercentage,
        processingTime,
        format: 'jpeg',
      };

      return {
        optimizedUri: optimizedResult.uri,
        metrics,
      };
    } catch (error) {
      throw this.createError('OPTIMIZATION_FAILED', 'Failed to optimize image', error);
    }
  }

  /**
   * Upload image using chunked upload
   * @param imageUri Optimized image path
   * @param correlationId Correlation ID for tracking
   * @param onProgress Progress callback
   * @returns Upload ID
   */
  private async uploadImage(
    imageUri: string,
    correlationId: string,
    onProgress: ProgressCallback
  ): Promise<string> {
    try {
      // Create upload session
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const fileSize = hasSize(fileInfo) ? fileInfo.size : 0;

      const sessionResponse = await this.makeRequest<UploadSessionResponse>('/api/ocr/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
        body: JSON.stringify({
          filename: imageUri.split('/').pop() || 'image.jpg',
          fileSize,
          chunkSize: this.config.chunkSize,
        }),
      });

      onProgress({ type: 'UPLOAD_START', uploadId: sessionResponse.uploadId });

      // Upload in chunks
      await this.uploadInChunks(imageUri, sessionResponse.uploadId, correlationId, onProgress);

      return sessionResponse.uploadId;
    } catch (error) {
      throw this.createError('UPLOAD_FAILED', 'Failed to upload image', error);
    }
  }

  /**
   * Upload file in chunks
   * @param fileUri File path
   * @param uploadId Upload session ID
   * @param correlationId Correlation ID
   * @param onProgress Progress callback
   */
  private async uploadInChunks(
    fileUri: string,
    uploadId: string,
    correlationId: string,
    onProgress: ProgressCallback
  ): Promise<void> {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    const fileSize = hasSize(fileInfo) ? fileInfo.size : 0;
    const totalChunks = Math.ceil(fileSize / this.config.chunkSize);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      this.checkAborted();

      const start = chunkIndex * this.config.chunkSize;
      const end = Math.min(start + this.config.chunkSize, fileSize);

      // Create a temporary file for this chunk
      const tempChunkUri = `${FileSystem.cacheDirectory}chunk-${uploadId}-${chunkIndex}.jpg`;

      try {
        // Read chunk as base64
        const chunkData = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
          position: start,
          length: end - start,
        });

        // Write chunk data to temporary file
        await FileSystem.writeAsStringAsync(tempChunkUri, chunkData, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Create form data for React Native
        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());

        // Use Blob for React Native (requires react-native-blob-util or similar)
        const blob = {
          uri: `data:image/jpeg;base64,${chunkData}`,
          type: 'image/jpeg',
          name: `chunk-${chunkIndex}.jpg`,
        };

        formData.append('chunk', blob as any);

        // Upload the chunk
        await this.makeRequest('/api/ocr/chunk', {
          method: 'POST',
          headers: {
            'X-Correlation-ID': correlationId,
            // Don't set Content-Type - let FormData set it with boundaries
          },
          body: formData,
        });

        // Clean up temporary chunk file
        await FileSystem.deleteAsync(tempChunkUri, { idempotent: true });
      } catch (error) {
        // Clean up temporary file on error
        await FileSystem.deleteAsync(tempChunkUri, { idempotent: true });
        throw error;
      }

      // Update progress (20-50% range)
      const progress = (chunkIndex + 1) / totalChunks;
      onProgress({ type: 'UPLOAD_PROGRESS', progress });
    }
  }

  /**
   * Start OCR processing
   * @param uploadId Upload session ID
   * @param correlationId Correlation ID
   * @returns Job ID
   */
  private async startProcessing(uploadId: string, correlationId: string): Promise<string> {
    try {
      const response = await this.makeRequest<{ jobId: string }>('/api/ocr/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
        body: JSON.stringify({
          uploadId,
          correlationId,
        }),
      });

      return response.jobId;
    } catch (error) {
      throw this.createError('PROCESS_START_FAILED', 'Failed to start OCR processing', error);
    }
  }

  /**
   * Poll job status until completion
   * @param jobId Job ID
   * @param correlationId Correlation ID
   * @param onProgress Progress callback
   * @returns Processing result
   */
  private async pollJobStatus(
    jobId: string,
    correlationId: string,
    onProgress: ProgressCallback
  ): Promise<{
    extractedText: string;
    confidence: number;
    classification: AIClassifiedReceipt;
  }> {
    const startTime = Date.now();
    let lastStage: string | undefined;

    while (true) {
      this.checkAborted();

      // Check timeout
      if (Date.now() - startTime > this.config.timeout) {
        throw this.createError('TIMEOUT', 'OCR processing timed out');
      }

      try {
        const status = await this.makeRequest<JobStatusResponse>(`/api/ocr/status/${jobId}`, {
          method: 'GET',
          headers: {
            'X-Correlation-ID': correlationId,
          },
        });

        // Handle different stages
        if (status.stage && status.stage !== lastStage) {
          lastStage = status.stage;

          if (status.stage === 'extracting') {
            // Transition from processing to extracting
            onProgress({
              type: 'PROCESS_PROGRESS',
              progress: status.progress,
              stage: 'extracting',
            });
          } else if (status.stage === 'classifying') {
            // Handle text extraction completion
            if (status.result?.extractedText) {
              onProgress({
                type: 'EXTRACT_COMPLETE',
                text: status.result.extractedText,
                confidence: status.result.confidence,
              });
            }

            onProgress({ type: 'CLASSIFY_START' });
          }
        }

        // Update progress based on stage (50-100% range)
        if (status.stage === 'processing' || status.stage === 'extracting') {
          onProgress({
            type: 'PROCESS_PROGRESS',
            progress: status.progress,
            stage: status.stage,
          });
        } else if (status.stage === 'classifying') {
          onProgress({
            type: 'CLASSIFY_PROGRESS',
            progress: status.progress,
          });
        }

        // Check if completed
        if (status.status === 'completed' && status.result) {
          onProgress({
            type: 'CLASSIFY_COMPLETE',
            classification: status.result.classification,
          });

          return {
            extractedText: status.result.extractedText,
            confidence: status.result.confidence,
            classification: status.result.classification,
          };
        }

        // Check if failed
        if (status.status === 'failed') {
          const error = status.error || { code: 'UNKNOWN', message: 'Processing failed' };
          throw this.createError(error.code, error.message);
        }

        // Wait before next poll
        await this.sleep(this.config.pollInterval);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        // Handle polling errors
        console.warn('Job polling error:', error);
        await this.sleep(this.config.pollInterval);
      }
    }
  }

  /**
   * Make HTTP request with error handling
   * @param endpoint API endpoint
   * @param options Fetch options
   * @returns Response data
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw this.createError(
        errorData.code || 'NETWORK_ERROR',
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        { statusCode: response.status, ...errorData }
      );
    }

    return response.json();
  }

  /**
   * Create standardized OCR error
   * @param code Error code
   * @param message Error message
   * @param details Additional error details
   * @returns OCRError
   */
  private createError(code: string, message: string, details?: any): OCRError {
    const userMessage = ERROR_CODES[code as keyof typeof ERROR_CODES] || ERROR_CODES.UNKNOWN;

    const error: OCRError = {
      code,
      message,
      userMessage,
      retryable: this.isRetryableError(code),
      details,
    };

    return error;
  }

  /**
   * Check if error is retryable
   * @param code Error code
   * @returns True if retryable
   */
  private isRetryableError(code: string): boolean {
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR', 'RATE_LIMITED'];

    return retryableCodes.includes(code);
  }

  /**
   * Handle errors and dispatch appropriate actions
   * @param error Error object
   * @param onProgress Progress callback
   */
  private handleError(error: any, onProgress: ProgressCallback): void {
    let ocrError: OCRError;

    if (error?.code && error?.message) {
      // Already an OCRError
      ocrError = error;
    } else if (error instanceof Error) {
      if (error.name === 'AbortError') {
        // Operation was cancelled
        return;
      }

      ocrError = this.createError('UNKNOWN', error.message, { originalError: error });
    } else {
      ocrError = this.createError('UNKNOWN', 'An unexpected error occurred', {
        originalError: error,
      });
    }

    onProgress({ type: 'ERROR', error: ocrError });
  }

  /**
   * Check if operation was aborted
   */
  private checkAborted(): void {
    if (this.abortController?.signal.aborted) {
      throw new Error('Operation was cancelled');
    }
  }

  /**
   * Sleep utility
   * @param ms Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Default OCR service instance
 */
export const ocrService = new OCRService();
