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
  status: 'pending' | 'active';
  estimatedDuration?: number;
}

export interface JobStatusResponse {
  jobId: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress: number;
  stage?: 'uploading' | 'processing' | 'extracting' | 'classifying';
  stageDescription?: string;
  result?: {
    extractedText: string;
    confidence: number;
    classification: any;
  };
  error?: {
    code: string;
    message: string;
  };
  processingTime?: number;
}

export interface CancelJobResponse {
  success: boolean;
  jobId: string;
  message: string;
}

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (progress: number, chunkIndex: number, totalChunks: number) => void;

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
 * Performance metrics
 */
export interface RequestMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  retryCount: number;
  bytesTransferred?: number;
}

/**
 * Backend OCR Service
 * Clean API client for all backend OCR endpoints
 */
export class BackendOCRService {
  private config: BackendOCRConfig;
  private activeRequests: Map<string, AbortController> = new Map();

  constructor(config?: Partial<BackendOCRConfig>) {
    this.config = {
      apiUrl: process.env.EXPO_PUBLIC_OCR_API_URL || 'http://localhost:3000',
      timeout: parseInt(process.env.EXPO_PUBLIC_OCR_TIMEOUT || '30000', 10),
      maxRetries: 3,
      chunkSize: 1024 * 1024, // 1MB
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
      fileName: fileInfo.name,
      fileSize: fileInfo.size,
      fileType: fileInfo.type,
      chunkSize: this.config.chunkSize,
    };

    const response = await this.makeRequest<CreateUploadSessionResponse>(
      '/api/ocr/upload/session',
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
      // Get file info to validate size
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

        // Read chunk
        const chunkData = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
          position: start,
          length: chunkSize,
        });

        // Create form data for chunk upload
        const formData = new FormData();
        formData.append('chunk', chunkData);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('uploadId', uploadId);

        // Upload chunk with retry logic
        const chunkResponse = await this.makeRequest<UploadChunkResponse>(
          '/api/ocr/upload/chunk',
          {
            method: 'POST',
            headers: {
              'X-Correlation-ID': correlationId,
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
   * Poll job status with configurable interval
   */
  async pollJobStatus(
    jobId: string,
    onProgress?: (status: JobStatusResponse) => void,
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

        this.logDevelopment('Job status polled', {
          jobId,
          status: status.status,
          progress: status.progress,
          stage: status.stage,
          correlationId,
        });

        // Check if job is complete
        if (status.status === 'completed' || status.status === 'failed') {
          return status;
        }

        // Wait before next poll
        await this.delay(this.config.pollInterval);
        attempts++;
      }

      throw new BackendOCRError(
        'POLLING_TIMEOUT',
        'Job status polling timed out',
        undefined,
        true
      );
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  /**
   * Get job status (single request)
   */
  async getJobStatus(
    jobId: string,
    options: RequestOptions = {}
  ): Promise<JobStatusResponse> {
    const correlationId = options.correlationId || this.generateCorrelationId();

    return await this.makeRequest<JobStatusResponse>(
      `/api/ocr/status/${jobId}`,
      {
        method: 'GET',
        headers: {
          'X-Correlation-ID': correlationId,
        },
        signal: options.signal,
      },
      options
    );
  }

  /**
   * Cancel active job
   */
  async cancelJob(
    jobId: string,
    options: RequestOptions = {}
  ): Promise<CancelJobResponse> {
    const correlationId = options.correlationId || this.generateCorrelationId();

    // Cancel any active requests for this job
    const pollRequestKey = `poll_${jobId}`;
    const pollController = this.activeRequests.get(pollRequestKey);
    if (pollController) {
      pollController.abort();
      this.activeRequests.delete(pollRequestKey);
    }

    const response = await this.makeRequest<CancelJobResponse>(
      `/api/ocr/cancel/${jobId}`,
      {
        method: 'POST',
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
   * Make HTTP request with retry logic and error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    requestInit: RequestInit,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`;
    const timeout = options.timeout || this.config.timeout;
    const maxRetries = options.retries ?? this.config.maxRetries;
    const correlationId = options.correlationId || this.generateCorrelationId();
    
    let lastError: Error = new Error('Unknown error occurred');
    let retryCount = 0;

    const metrics: RequestMetrics = {
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      retryCount: 0,
    };

    while (retryCount <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Combine signals if provided
        const combinedSignal = options.signal 
          ? this.combineAbortSignals([controller.signal, options.signal])
          : controller.signal;

        const requestOptions: RequestInit = {
          ...requestInit,
          signal: combinedSignal,
        };

        this.logDevelopment('Making request', {
          method: requestInit.method,
          url,
          attempt: retryCount + 1,
          maxRetries: maxRetries + 1,
          correlationId,
        });

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.retryCount = retryCount;

        // Handle HTTP errors
        if (!response.ok) {
          const errorText = await response.text();
          let errorData: any = {};
          
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }

          const isRetryableStatus = response.status >= 500 || response.status === 429;
          
          throw new BackendOCRError(
            errorData.code || `HTTP_${response.status}`,
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            isRetryableStatus,
            { url, correlationId, metrics }
          );
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        let data: T;
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text() as any;
        }

        // Validate response structure
        if (!this.validateResponse(data)) {
          throw new BackendOCRError(
            'INVALID_RESPONSE',
            'Invalid response format from server',
            response.status,
            false,
            { url, correlationId, data }
          );
        }

        this.logDevelopment('Request successful', {
          url,
          correlationId,
          duration: metrics.duration,
          retryCount: metrics.retryCount,
        });

        return data;

      } catch (error) {
        lastError = error as Error;
        retryCount++;

        // Don't retry if it's an abort signal
        if (error instanceof Error && error.name === 'AbortError') {
          throw new BackendOCRError('CANCELLED', 'Request was cancelled');
        }

        // Don't retry for non-retryable errors
        if (error instanceof BackendOCRError && !error.retryable) {
          throw error;
        }

        // Don't retry if we've exceeded max retries
        if (retryCount > maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.config.retryDelay * Math.pow(2, retryCount - 1),
          this.config.maxRetryDelay
        );

        this.logDevelopment('Request failed, retrying', {
          url,
          error: error instanceof Error ? error.message : String(error),
          retryCount,
          maxRetries,
          delayMs: delay,
          correlationId,
        });

        await this.delay(delay);
      }
    }

    // All retries exhausted
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.retryCount = retryCount;

    if (lastError instanceof BackendOCRError) {
      throw lastError;
    }

    throw new BackendOCRError(
      'MAX_RETRIES_EXCEEDED',
      `Request failed after ${maxRetries + 1} attempts: ${lastError.message}`,
      undefined,
      false,
      { url, correlationId, metrics, lastError: lastError.message }
    );
  }

  /**
   * Validate API response structure
   */
  private validateResponse(data: any): boolean {
    if (data === null || data === undefined) return false;
    if (typeof data === 'string') return true; // Text responses are valid
    if (typeof data === 'object') return true; // JSON responses are valid
    return false;
  }

  /**
   * Combine multiple abort signals
   */
  private combineAbortSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    
    signals.forEach(signal => {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', () => controller.abort());
      }
    });
    
    return controller.signal;
  }

  /**
   * Generate correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility for retries and polling
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Development logging
   */
  private logDevelopment(message: string, data?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[BackendOCRService] ${message}`, data || '');
    }
  }

  /**
   * Get active request count
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  /**
   * Check if service has active requests
   */
  hasActiveRequests(): boolean {
    return this.activeRequests.size > 0;
  }
}

export default BackendOCRService;