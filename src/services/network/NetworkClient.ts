// src/services/network/NetworkClient.ts

import * as FileSystem from 'expo-file-system';
import { generateCorrelationId } from '../../utils/correlation';

/**
 * Network client configuration
 */
interface NetworkConfig {
  baseUrl: string;
  timeout: number;
  chunkSize: number;
  maxRetries: number;
  retryDelay: number;
}

/**
 * HTTP response interface
 */
interface NetworkResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

/**
 * Upload progress callback
 */
type ProgressCallback = (loaded: number, total: number) => void;

/**
 * Request options
 */
interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  correlationId?: string;
  signal?: AbortSignal;
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
    classification: any;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Network error class
 */
class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Robust network client with chunked upload support
 */
export class NetworkClient {
  private config: NetworkConfig;

  constructor(config?: Partial<NetworkConfig>) {
    this.config = {
      baseUrl: process.env.EXPO_PUBLIC_OCR_API_URL || 'http://localhost:3000',
      timeout: 60000, // 60 seconds
      chunkSize: 1048576, // 1MB
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      ...config,
    };
  }

  /**
   * Create upload session
   */
  async createUploadSession(
    filename: string,
    fileSize: number,
    correlationId?: string,
    signal?: AbortSignal
  ): Promise<UploadSessionResponse> {
    const response = await this.post<UploadSessionResponse>(
      '/api/ocr/upload',
      {
        filename,
        fileSize,
        chunkSize: this.config.chunkSize,
      },
      { correlationId, signal }
    );

    return response.data;
  }

  /**
   * Upload file in chunks with progress tracking
   */
  async uploadFileChunked(
    filePath: string,
    uploadId: string,
    onProgress?: ProgressCallback,
    correlationId?: string,
    signal?: AbortSignal
  ): Promise<void> {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists || !('size' in fileInfo)) {
      throw new NetworkError('File not found or invalid');
    }

    const fileSize = fileInfo.size;
    const totalChunks = Math.ceil(fileSize / this.config.chunkSize);
    let uploadedBytes = 0;

    // Upload chunks sequentially
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (signal?.aborted) {
        throw new NetworkError('Upload cancelled', undefined, 'CANCELLED');
      }

      const start = chunkIndex * this.config.chunkSize;
      const end = Math.min(start + this.config.chunkSize, fileSize);
      const chunkSize = end - start;

      // Read chunk
      const chunkData = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
        position: start,
        length: chunkSize,
      });

      // Upload chunk with retry
      await this.uploadChunk(uploadId, chunkIndex, chunkData, totalChunks, correlationId, signal);

      uploadedBytes += chunkSize;
      onProgress?.(uploadedBytes, fileSize);
    }
  }

  /**
   * Upload single chunk
   */
  private async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunkData: string,
    totalChunks: number,
    correlationId?: string,
    signal?: AbortSignal
  ): Promise<void> {
    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());

    // Convert base64 to blob for React Native
    // React Native FormData expects an object with uri, type, and name
    formData.append('chunk', {
      uri: `data:image/jpeg;base64,${chunkData}`,
      type: 'image/jpeg',
      name: `chunk-${chunkIndex}.jpg`,
    } as any);

    await this.postFormData('/api/ocr/chunk', formData, {
      correlationId,
      signal,
    });
  }

  /**
   * Start OCR processing
   */
  async startProcessing(
    uploadId: string,
    correlationId?: string,
    signal?: AbortSignal
  ): Promise<{ jobId: string }> {
    const response = await this.post<{ jobId: string }>(
      '/api/ocr/process',
      { uploadId },
      { correlationId, signal }
    );

    return response.data;
  }

  /**
   * Get job status
   */
  async getJobStatus(
    jobId: string,
    correlationId?: string,
    signal?: AbortSignal
  ): Promise<JobStatusResponse> {
    const response = await this.get<JobStatusResponse>(`/api/ocr/status/${jobId}`, {
      correlationId,
      signal,
    });

    return response.data;
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<NetworkResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  /**
   * Generic POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<NetworkResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  /**
   * POST with FormData
   */
  async postFormData<T>(
    endpoint: string,
    formData: FormData,
    options: RequestOptions = {}
  ): Promise<NetworkResponse<T>> {
    const headers = {
      ...options.headers,
      // Don't set Content-Type for FormData - let browser set it with boundary
    };

    return this.request<T>('POST', endpoint, formData, {
      ...options,
      headers,
    });
  }

  /**
   * Core request method with retry logic
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<NetworkResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const correlationId = options.correlationId || generateCorrelationId();

    const headers: Record<string, string> = {
      'X-Correlation-ID': correlationId,
      ...options.headers,
    };

    // Only set Content-Type for JSON data
    if (data && !(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    let lastError: Error;

    // Retry logic
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      if (options.signal?.aborted) {
        throw new NetworkError('Request cancelled', undefined, 'CANCELLED');
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          options.timeout || this.config.timeout
        );

        // Combine timeout signal with user signal
        const combinedSignal = this.combineSignals([controller.signal, options.signal]);

        const response = await fetch(url, {
          method,
          headers,
          body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
          signal: combinedSignal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const isRetryable = response.status >= 500 || response.status === 429;
          const errorText = await response.text();

          throw new NetworkError(
            `HTTP ${response.status}: ${errorText}`,
            response.status,
            response.status.toString(),
            isRetryable
          );
        }

        const responseData = await response.json();
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        return {
          data: responseData,
          status: response.status,
          headers: responseHeaders,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry if cancelled or not retryable
        if (
          options.signal?.aborted ||
          (error instanceof NetworkError && !error.retryable) ||
          attempt === this.config.maxRetries
        ) {
          break;
        }

        // Wait before retry
        await this.delay(this.config.retryDelay * Math.pow(2, attempt));
      }
    }

    throw lastError!;
  }

  /**
   * Combine multiple abort signals
   */
  private combineSignals(signals: (AbortSignal | undefined)[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
      if (signal?.aborted) {
        controller.abort();
        break;
      }

      signal?.addEventListener('abort', () => controller.abort());
    }

    return controller.signal;
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const networkClient = new NetworkClient();
