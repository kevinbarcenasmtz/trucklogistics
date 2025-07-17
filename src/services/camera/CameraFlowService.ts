// src/services/camera/CameraFlowService.ts

import * as FileSystem from 'expo-file-system';
import { BackendOCRService, BackendOCRError, FileInfo } from '../api/BackendOCRService';
import { ProcessedReceipt, OptimizationMetrics } from '../../state/ocr/types';
import { AIClassifiedReceipt } from '../../types/ReceiptInterfaces';

/**
 * Progress update callback for workflow orchestration
 */
export type WorkflowProgressCallback = (
  totalProgress: number,
  stage: string,
  description: string
) => void;

/**
 * Workflow cancellation callback
 */
export type WorkflowCancellationCallback = () => boolean;

/**
 * Workflow configuration
 */
export interface CameraFlowConfig {
  maxFileSize: number; // bytes
  supportedFormats: string[];
  optimizationEnabled: boolean;
  retryAttempts: number;
  timeoutMs: number;
}

/**
 * Workflow result
 */
export interface WorkflowResult {
  processedReceipt: ProcessedReceipt;
  processingTime: number;
  uploadTime: number;
  totalTime: number;
}

/**
 * Workflow error with context
 */
export class CameraFlowError extends Error {
  constructor(
    public code: string,
    message: string,
    public stage: string,
    public retryable: boolean = false,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'CameraFlowError';
  }
}

/**
 * Camera Flow Service
 * Orchestrates the complete image processing workflow
 */
export class CameraFlowService {
  private config: CameraFlowConfig;
  private backendService: BackendOCRService;
  private isProcessing: boolean = false;
  private currentJobId?: string;
  private currentUploadId?: string;

  constructor(config?: Partial<CameraFlowConfig>) {
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB default
      supportedFormats: ['image/jpeg', 'image/png', 'image/jpg'],
      optimizationEnabled: true,
      retryAttempts: 3,
      timeoutMs: 60000, // 60 seconds
      ...config,
    };

    this.backendService = new BackendOCRService();
  }

  /**
   * Process image through complete OCR workflow
   */
  async processImage(
    imageUri: string,
    onProgress?: WorkflowProgressCallback,
    onCancellationCheck?: WorkflowCancellationCallback,
    correlationId?: string
  ): Promise<WorkflowResult> {
    if (this.isProcessing) {
      throw new CameraFlowError(
        'ALREADY_PROCESSING',
        'Another processing operation is already in progress',
        'initialization',
        false
      );
    }

    this.isProcessing = true;
    const startTime = Date.now();
    let uploadStartTime = 0;
    let uploadEndTime = 0;
    let processingStartTime = 0;
    let processingEndTime = 0;

    try {
      // Stage 1: File validation and preparation (0-5%)
      onProgress?.(0, 'validation', 'Validating image file...');
      
      const fileInfo = await this.validateAndPrepareFile(imageUri);
      
      if (onCancellationCheck?.()) {
        throw new CameraFlowError('CANCELLED', 'Operation cancelled by user', 'validation');
      }

      onProgress?.(5, 'validation', 'File validation complete');

      // Stage 2: Image optimization (5-10%)
      onProgress?.(5, 'optimization', 'Optimizing image...');
      
      const { optimizedUri, optimizationMetrics } = await this.optimizeImage(imageUri, fileInfo);
      
      if (onCancellationCheck?.()) {
        throw new CameraFlowError('CANCELLED', 'Operation cancelled by user', 'optimization');
      }

      onProgress?.(10, 'optimization', 'Image optimization complete');

      // Stage 3: Upload preparation (10-15%)
      onProgress?.(10, 'upload_prep', 'Preparing upload session...');
      
      uploadStartTime = Date.now();
      const optimizedFileInfo = await this.getFileInfo(optimizedUri);
      const uploadSession = await this.backendService.createUploadSession(optimizedFileInfo, {
        correlationId,
      });

      this.currentUploadId = uploadSession.uploadId;
      
      if (onCancellationCheck?.()) {
        throw new CameraFlowError('CANCELLED', 'Operation cancelled by user', 'upload_prep');
      }

      onProgress?.(15, 'upload_prep', 'Upload session created');

      // Stage 4: File upload (15-30%)
      onProgress?.(15, 'uploading', 'Uploading image...');
      
      await this.backendService.uploadFileChunks(
        optimizedUri,
        uploadSession.uploadId,
        uploadSession.maxChunks,
        (uploadProgress, chunkIndex, totalChunks) => {
          // Map upload progress to 15-30% of total workflow
          const workflowProgress = 15 + (uploadProgress * 0.15);
          onProgress?.(
            workflowProgress,
            'uploading',
            `Uploading chunk ${chunkIndex}/${totalChunks}...`
          );
        },
        { correlationId }
      );

      uploadEndTime = Date.now();
      
      if (onCancellationCheck?.()) {
        throw new CameraFlowError('CANCELLED', 'Operation cancelled by user', 'uploading');
      }

      onProgress?.(30, 'uploading', 'Upload complete');

      // Stage 5: Start backend processing (30-35%)
      onProgress?.(30, 'processing_start', 'Starting OCR processing...');
      
      processingStartTime = Date.now();
      const processingJob = await this.backendService.startProcessing(uploadSession.uploadId, {
        correlationId,
      });

      this.currentJobId = processingJob.jobId;
      
      if (onCancellationCheck?.()) {
        throw new CameraFlowError('CANCELLED', 'Operation cancelled by user', 'processing_start');
      }

      onProgress?.(35, 'processing_start', 'OCR processing started');

      // Stage 6: Monitor processing progress (35-95%)
      onProgress?.(35, 'processing', 'Processing image...');
      
      const processingResult = await this.backendService.pollJobStatus(
        processingJob.jobId,
        (status) => {
          if (onCancellationCheck?.()) {
            // Don't throw here, let the polling handle it
            return;
          }

          // Map backend progress to 35-95% of total workflow
          const backendProgress = status.progress || 0;
          const workflowProgress = 35 + (backendProgress * 0.6);
          
          const stageDescription = this.mapBackendStageToDescription(
            status.stage,
            status.stageDescription
          );
          
          onProgress?.(workflowProgress, status.stage || 'processing', stageDescription);
        },
        { correlationId }
      );

      processingEndTime = Date.now();

      if (processingResult.status === 'failed') {
        throw new CameraFlowError(
          processingResult.error?.code || 'PROCESSING_FAILED',
          processingResult.error?.message || 'OCR processing failed',
          'processing',
          true,
          { jobId: processingJob.jobId }
        );
      }

      if (!processingResult.result) {
        throw new CameraFlowError(
          'NO_RESULT',
          'Processing completed but no result was returned',
          'processing',
          true,
          { jobId: processingJob.jobId }
        );
      }

      if (onCancellationCheck?.()) {
        throw new CameraFlowError('CANCELLED', 'Operation cancelled by user', 'processing');
      }

      onProgress?.(95, 'finalizing', 'Finalizing results...');

      // Stage 7: Transform result to app format (95-100%)
      const processedReceipt = await this.transformBackendResult(
        processingResult.result,
        optimizedUri,
        imageUri,
        optimizationMetrics
      );

      const endTime = Date.now();
      
      onProgress?.(100, 'complete', 'Processing complete');

      return {
        processedReceipt,
        uploadTime: uploadEndTime - uploadStartTime,
        processingTime: processingEndTime - processingStartTime,
        totalTime: endTime - startTime,
      };

    } catch (error) {
      if (error instanceof CameraFlowError) {
        throw error;
      }

      if (error instanceof BackendOCRError) {
        throw new CameraFlowError(
          error.code,
          error.message,
          'backend_service',
          error.retryable,
          error.context
        );
      }

      throw new CameraFlowError(
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred',
        'unknown',
        false,
        { originalError: error }
      );
    } finally {
      this.isProcessing = false;
      this.currentJobId = undefined;
      this.currentUploadId = undefined;
    }
  }

  /**
   * Cancel current processing operation
   */
  async cancelProcessing(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    try {
      // Cancel backend job if exists
      if (this.currentJobId) {
        await this.backendService.cancelJob(this.currentJobId);
      }

      // Cancel all active requests
      this.backendService.cancelAllRequests();
    } catch (error) {
      // Log but don't throw - cancellation should always succeed
      this.logDevelopment('Error during cancellation', {
        error: error instanceof Error ? error.message : String(error),
        jobId: this.currentJobId,
        uploadId: this.currentUploadId,
      });
    } finally {
      this.isProcessing = false;
      this.currentJobId = undefined;
      this.currentUploadId = undefined;
    }
  }

  /**
   * Check if service is currently processing
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Get current job information
   */
  getCurrentJobInfo(): { jobId?: string; uploadId?: string } {
    return {
      jobId: this.currentJobId,
      uploadId: this.currentUploadId,
    };
  }

  /**
   * Validate and prepare file for processing
   */
  private async validateAndPrepareFile(imageUri: string): Promise<FileInfo> {
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new CameraFlowError(
        'FILE_NOT_FOUND',
        'Image file not found',
        'validation',
        false,
        { imageUri }
      );
    }

    if (!('size' in fileInfo)) {
      throw new CameraFlowError(
        'FILE_SIZE_UNKNOWN',
        'Unable to determine file size',
        'validation',
        false,
        { imageUri }
      );
    }

    // Check file size
    if (fileInfo.size > this.config.maxFileSize) {
      throw new CameraFlowError(
        'FILE_TOO_LARGE',
        `File size (${Math.round(fileInfo.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(this.config.maxFileSize / 1024 / 1024)}MB)`,
        'validation',
        false,
        { fileSize: fileInfo.size, maxSize: this.config.maxFileSize }
      );
    }

    // Extract file information
    const fileName = imageUri.split('/').pop() || 'image.jpg';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = this.getMimeTypeFromExtension(fileExtension);

    // Validate file format
    if (!this.config.supportedFormats.includes(mimeType)) {
      throw new CameraFlowError(
        'UNSUPPORTED_FORMAT',
        `File format ${fileExtension} is not supported`,
        'validation',
        false,
        { format: fileExtension, supportedFormats: this.config.supportedFormats }
      );
    }

    return {
      uri: imageUri,
      size: fileInfo.size,
      name: fileName,
      type: mimeType,
    };
  }

  /**
   * Optimize image for better OCR results
   */
  private async optimizeImage(
    imageUri: string,
    fileInfo: FileInfo
  ): Promise<{ optimizedUri: string; optimizationMetrics: OptimizationMetrics }> {
    if (!this.config.optimizationEnabled) {
      return {
        optimizedUri: imageUri,
        optimizationMetrics: {
          originalSize: fileInfo.size,
          optimizedSize: fileInfo.size,
          originalDimensions: { width: 0, height: 0 },
          optimizedDimensions: { width: 0, height: 0 },
          reductionPercentage: 0,
          processingTime: 0,
        },
      };
    }

    const startTime = Date.now();

    try {
      // For now, we'll just return the original image
      // In a real implementation, you would use expo-image-manipulator
      // or similar to resize, compress, and optimize the image
      
      const processingTime = Date.now() - startTime;

      return {
        optimizedUri: imageUri,
        optimizationMetrics: {
          originalSize: fileInfo.size,
          optimizedSize: fileInfo.size,
          originalDimensions: { width: 0, height: 0 },
          optimizedDimensions: { width: 0, height: 0 },
          reductionPercentage: 0,
          processingTime,
        },
      };
    } catch (error) {
      throw new CameraFlowError(
        'OPTIMIZATION_FAILED',
        `Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'optimization',
        false,
        { originalError: error }
      );
    }
  }

  /**
   * Get file information
   */
  private async getFileInfo(uri: string): Promise<FileInfo> {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists || !('size' in fileInfo)) {
      throw new CameraFlowError(
        'FILE_INFO_ERROR',
        'Unable to get file information',
        'file_info',
        false,
        { uri }
      );
    }

    const fileName = uri.split('/').pop() || 'image.jpg';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = this.getMimeTypeFromExtension(fileExtension);

    return {
      uri,
      size: fileInfo.size,
      name: fileName,
      type: mimeType,
    };
  }

  /**
   * Transform backend result to app format
   */
  private async transformBackendResult(
    backendResult: any,
    optimizedUri: string,
    originalUri: string,
    optimizationMetrics: OptimizationMetrics
  ): Promise<ProcessedReceipt> {
    try {
      const classification: AIClassifiedReceipt = {
        date: backendResult.classification?.date || new Date().toISOString().split('T')[0],
        type: backendResult.classification?.type || 'Other',
        amount: backendResult.classification?.amount || '0.00',
        vehicle: backendResult.classification?.vehicle || '',
        vendorName: backendResult.classification?.vendorName || '',
        location: backendResult.classification?.location || '',
        confidence: backendResult.classification?.confidence || {},
      };

      return {
        imageUri: optimizedUri,
        originalImageUri: originalUri,
        extractedText: backendResult.extractedText || '',
        classification,
        optimizationMetrics,
        processedAt: new Date().toISOString(),
        confidence: backendResult.confidence || 0,
      };
    } catch (error) {
      throw new CameraFlowError(
        'RESULT_TRANSFORMATION_FAILED',
        'Failed to transform backend result to app format',
        'transformation',
        false,
        { backendResult, error }
      );
    }
  }

  /**
   * Map backend stage to user-friendly description
   */
  private mapBackendStageToDescription(stage?: string, description?: string): string {
    if (description) return description;

    switch (stage) {
      case 'uploading':
        return 'Uploading image...';
      case 'processing':
        return 'Processing image...';
      case 'extracting':
        return 'Extracting text from image...';
      case 'classifying':
        return 'Analyzing receipt data...';
      default:
        return 'Processing...';
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };

    return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
  }

  /**
   * Development logging
   */
  private logDevelopment(message: string, data?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CameraFlowService] ${message}`, data || '');
    }
  }
}

export default CameraFlowService;