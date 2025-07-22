// src/services/api/BackendOCRService.ts

import * as FileSystem from 'expo-file-system';

/**
 * API Response types
 */
export interface CreateUploadSessionResponse {
  uploadId: string;
  chunkSize: number;
  maxChunks: number;
  expiresAt: string;
}

export interface UploadChunkResponse {
  success: boolean;
  receivedChunks: number;
  totalChunks: number;
  complete: boolean;
}

export interface StartProcessingResponse {
  jobId: string;
  message: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage?: string;
  result?: {
    text: string;
    confidence: number;
    metadata?: any;
  };
  error?: string;
  processingTime?: number;
}

export interface CancelJobResponse {
  success: boolean;
  message: string;
  jobId?: string;
}

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (
  progress: number,
  chunkIndex: number,
  totalChunks: number
) => void;

/**
 * Processing progress callback
 */
export type ProcessingProgressCallback = (status: JobStatusResponse) => void;

/**
 * Service configuration
 */
export interface BackendOCRConfig {
  apiUrl: string;
  timeout: number;
  maxRetries: number;
  chunkSize: number;
  pollInterval: number;
  retryDelay: number;
  maxRetryDelay: number;
}

/**
 * Request options
 */
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  correlationId?: string;
  signal?: AbortSignal;
}

/**
 * File information for upload
 */
export interface FileInfo {
  uri: string;
  size: number;
  name: string;
  type: string;
}

/**
 * Error types
 */
export class BackendOCRError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number,
    public retryable: boolean = false,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'BackendOCRError';
  }
}

/**
 * Backend OCR Service
 * Aligned with trucking-logistics-ocr backend API
 */
export class BackendOCRService {
  private config: BackendOCRConfig;
  private activeRequests: Map<string, AbortController> = new Map();

  constructor(config?: Partial<BackendOCRConfig>) {
    this.config = {
      apiUrl: process.env.EXPO_PUBLIC_OCR_API_URL || 'http://localhost:3000',
      timeout: parseInt(process.env.EXPO_PUBLIC_OCR_TIMEOUT || '30000', 10),
      maxRetries: 3,
      chunkSize: 512 * 1024, // 512KB - smaller chunks for mobile
      pollInterval: 1000, // 1 second
      retryDelay: 1000, // 1 second
      maxRetryDelay: 10000, // 10 seconds
      ...config,
    };
  }

  /**
   * Create upload session with file metadata
   */
  async createUploadSession(
    fileInfo: FileInfo,
    options: RequestOptions = {}
  ): Promise<CreateUploadSessionResponse> {
    const correlationId = options.correlationId || this.generateCorrelationId();

    const requestBody = {
      filename: fileInfo.name,
      fileSize: fileInfo.size,
      chunkSize: this.config.chunkSize,
    };

    const response = await this.makeRequest<CreateUploadSessionResponse>(
      '/api/ocr/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
        body: JSON.stringify(requestBody),
      },
      options
    );

    this.logDevelopment('Upload session created', {
      uploadId: response.uploadId,
      correlationId,
      fileSize: fileInfo.size,
      chunkSize: response.chunkSize,
      maxChunks: response.maxChunks,
    });

    return response;
  }

  /**
   * Upload file in chunks with progress callbacks
   */
  async uploadFileChunks(
    fileUri: string,
    uploadId: string,
    totalChunks: number,
    onProgress?: UploadProgressCallback,
    options: RequestOptions = {}
  ): Promise<void> {
    const correlationId = options.correlationId || this.generateCorrelationId();
    const abortController = new AbortController();
    const requestKey = `upload_${uploadId}`;

    this.activeRequests.set(requestKey, abortController);

    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists || !('size' in fileInfo)) {
        throw new BackendOCRError('FILE_NOT_FOUND', 'File not found or inaccessible');
      }

      const fileSize = fileInfo.size;
      let uploadedBytes = 0;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        // Check if cancelled
        if (abortController.signal.aborted) {
          throw new BackendOCRError('CANCELLED', 'Upload cancelled');
        }

        const start = chunkIndex * this.config.chunkSize;
        const end = Math.min(start + this.config.chunkSize, fileSize);
        const chunkSize = end - start;

        // Read chunk as base64
        const base64Data = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
          position: start,
          length: chunkSize,
        });

        // Create form data for multipart upload
        const formData = new FormData();
        
        // Convert base64 to blob for proper file upload
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/octet-stream' });
        
        // Append chunk data
        formData.append('chunk', blob, `chunk-${chunkIndex}`);
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());

        // Upload chunk with retry logic
        const chunkResponse = await this.makeRequest<UploadChunkResponse>(
          '/api/ocr/chunk',
          {
            method: 'POST',
            headers: {
              'X-Correlation-ID': correlationId,
              // Don't set Content-Type for FormData - let browser set it with boundary
            },
            body: formData,
            signal: abortController.signal,
          },
          {
            ...options,
            retries: 2, // Fewer retries for chunks
          }
        );

        uploadedBytes += chunkSize;
        const progress = Math.round((uploadedBytes / fileSize) * 100);

        // Call progress callback
        onProgress?.(progress, chunkIndex + 1, totalChunks);

        this.logDevelopment('Chunk uploaded', {
          chunkIndex: chunkIndex + 1,
          totalChunks,
          progress,
          uploadId,
          correlationId,
        });

        // Check if upload is complete
        if (chunkResponse.complete) {
          this.logDevelopment('File upload complete', {
            uploadId,
            totalChunks,
            uploadedBytes,
            correlationId,
          });
          break;
        }
      }
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  /**
   * Start OCR processing job
   */
  async startProcessing(
    uploadId: string,
    options: RequestOptions = {}
  ): Promise<StartProcessingResponse> {
    const correlationId = options.correlationId || this.generateCorrelationId();

    const response = await this.makeRequest<StartProcessingResponse>(
      '/api/ocr/process',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
        body: JSON.stringify({ uploadId }),
      },
      options
    );

    this.logDevelopment('Processing started', {
      jobId: response.jobId,
      uploadId,
      correlationId,
    });

    return response;
  }

  /**
   * Get job status
   */
  async getJobStatus(
    jobId: string,
    options: RequestOptions = {}
  ): Promise<JobStatusResponse> {
    const correlationId = options.correlationId || this.generateCorrelationId();

    const response = await this.makeRequest<JobStatusResponse>(
      `/api/ocr/status/${jobId}`,
      {
        method: 'GET',
        headers: {
          'X-Correlation-ID': correlationId,
        },
      },
      options
    );

    return response;
  }

  /**
   * Poll job status until completion
   */
  async pollJobStatus(
    jobId: string,
    onProgress?: ProcessingProgressCallback,
    options: RequestOptions = {}
  ): Promise<JobStatusResponse> {
    const correlationId = options.correlationId || this.generateCorrelationId();
    const abortController = new AbortController();
    const requestKey = `poll_${jobId}`;

    this.activeRequests.set(requestKey, abortController);

    try {
      let attempts = 0;
      const maxAttempts = 60; // Maximum 60 seconds of polling

      while (attempts < maxAttempts) {
        // Check if cancelled
        if (abortController.signal.aborted) {
          throw new BackendOCRError('CANCELLED', 'Polling cancelled');
        }

        const status = await this.getJobStatus(jobId, {
          ...options,
          correlationId,
          signal: abortController.signal,
        });

        // Call progress callback
        onProgress?.(status);

        // Check if complete
        if (status.status === 'completed' || status.status === 'failed') {
          this.logDevelopment('Job completed', {
            jobId,
            status: status.status,
            attempts,
            correlationId,
          });
          return status;
        }

        // Wait before next poll
        await this.delay(this.config.pollInterval);
        attempts++;
      }

      throw new BackendOCRError(
        'TIMEOUT',
        'Processing timeout - job took too long',
        undefined,
        true
      );
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(
    jobId: string,
    options: RequestOptions = {}
  ): Promise<CancelJobResponse> {
    const correlationId = options.correlationId || this.generateCorrelationId();

    const response = await this.makeRequest<CancelJobResponse>(
      `/api/ocr/job/${jobId}`,
      {
        method: 'DELETE',
        headers: {
          'X-Correlation-ID': correlationId,
        },
      },
      options
    );

    this.logDevelopment('Job cancelled', {
      jobId,
      correlationId,
    });

    return response;
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests(): void {
    this.activeRequests.forEach((controller, key) => {
      controller.abort();
      this.logDevelopment('Request cancelled', { requestKey: key });
    });
    this.activeRequests.clear();
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    init: RequestInit,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`;
    const timeout = options.timeout || this.config.timeout;
    const maxRetries = options.retries ?? this.config.maxRetries;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Merge abort signals
        if (options.signal) {
          options.signal.addEventListener('abort', () => controller.abort());
        }

        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          throw new BackendOCRError(
            errorData.error?.code || 'API_ERROR',
            errorData.error?.message || `HTTP ${response.status}`,
            response.status,
            this.isRetryableError(response.status),
            errorData
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        // Don't retry if cancelled
        if (error instanceof Error && error.name === 'AbortError') {
          throw new BackendOCRError('CANCELLED', 'Request cancelled');
        }

        // Don't retry non-retryable errors
        if (error instanceof BackendOCRError && !error.retryable) {
          throw error;
        }

        // Calculate retry delay with exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(
            this.config.retryDelay * Math.pow(2, attempt),
            this.config.maxRetryDelay
          );
          
          this.logDevelopment('Retrying request', {
            endpoint,
            attempt: attempt + 1,
            maxRetries,
            delay,
            error: lastError.message,
          });

          await this.delay(delay);
        }
      }
    }

    throw new BackendOCRError(
      'MAX_RETRIES',
      `Failed after ${maxRetries} retries: ${lastError?.message}`,
      undefined,
      false,
      { originalError: lastError?.message }
    );
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(status: number): boolean {
    return status >= 500 || status === 429 || status === 408;
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Development logging
   */
  private logDevelopment(message: string, data?: any): void {
    if (__DEV__) {
      console.log(`[BackendOCRService] ${message}`, data || '');
    }
  }
}

// Export singleton instance
export const backendOCRService = new BackendOCRService();