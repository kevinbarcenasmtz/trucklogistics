// src/hooks/useBackendOCR.tsx

import { useCallback, useEffect, useRef } from 'react';
import { OCRProcessingErrorUtils, useOCRProcessing } from '../context/OCRProcessingContext';
import { CameraFlowError, CameraFlowService } from '../services/camera/CameraFlowService';
import { ProcessedReceipt } from '../state/ocr/types';

/**
 * Backend OCR hook configuration
 */
export interface UseBackendOCRConfig {
  autoRetryAttempts?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}

/**
 * Processing result
 */
export interface ProcessingResult {
  processedReceipt: ProcessedReceipt;
  processingTime: number;
  uploadTime: number;
  totalTime: number;
}

/**
 * Hook return interface
 */
export interface UseBackendOCRReturn {
  // State properties
  readonly status: string;
  readonly stage?: string;
  readonly stageDescription?: string;
  readonly uploadProgress: number;
  readonly processingProgress: number;
  readonly totalProgress: number;
  readonly isProcessing: boolean;
  readonly isUploading: boolean;
  readonly isCompleted: boolean;
  readonly hasError: boolean;
  readonly error?: any;
  readonly canRetry: boolean;
  readonly canCancel: boolean;
  readonly jobId?: string;
  readonly uploadSessionId?: string;
  readonly startTimestamp?: number;
  readonly completedTimestamp?: number;

  // Action functions
  readonly processImage: (imageUri: string, correlationId?: string) => Promise<ProcessingResult>;
  readonly cancelProcessing: () => Promise<void>;
  readonly retryProcessing: (imageUri?: string) => Promise<ProcessingResult>;
  readonly resetProcessing: () => void;

  // Utility functions
  readonly getProcessingDuration: () => number;
  readonly getProgressDescription: () => string;
}

/**
 * useBackendOCR Hook
 * Bridge between BackendOCRService and OCRProcessingContext
 */
export function useBackendOCR(config: UseBackendOCRConfig = {}): UseBackendOCRReturn {
  const {
    autoRetryAttempts = 0,
    retryDelay = 2000,
    enableLogging = process.env.NODE_ENV === 'development',
  } = config;

  const {
    state,
    startProcessing,
    updateUploadProgress,
    completeUpload,
    startBackendProcessing,
    updateProcessingProgress,
    completeProcessing,
    setError,
    clearError,
    retryProcessing: resetForRetry,
    resetProcessing,
    cancelProcessing: cancelState,
  } = useOCRProcessing();

  // Service instance - persisted across re-renders
  const serviceRef = useRef<CameraFlowService | undefined>(undefined);
  const processingRequestRef = useRef<Promise<ProcessingResult> | null>(null);
  const lastImageUriRef = useRef<string | undefined>(undefined);
  const retryCountRef = useRef<number>(0);

  // Initialize service
  if (!serviceRef.current) {
    serviceRef.current = new CameraFlowService({
      optimizationEnabled: true,
      retryAttempts: 3,
      timeoutMs: 60000,
    });
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Temporarily disable automatic cancellation to avoid React Strict Mode issues
      // The service will be cleaned up when the actual component unmounts
      console.log('[useBackendOCR] Component unmounting (auto-cancel disabled for Strict Mode compatibility)');
    };
  }, []);

  // Progress callback aggregator
  const handleProgress = useCallback(
    (totalProgress: number, stage: string, description: string) => {
      if (enableLogging) {
        console.log('[useBackendOCR] Progress update:', {
          totalProgress,
          stage,
          description,
          timestamp: new Date().toISOString(),
        });
      }

      // Map workflow progress to context updates
      if (stage === 'uploading' || stage === 'upload_prep') {
        // Upload phase: 0-30% of total workflow maps to 0-100% upload progress
        const uploadProgress = Math.min(100, Math.max(0, (totalProgress / 30) * 100));
        updateUploadProgress(uploadProgress);

        if (totalProgress >= 30) {
          completeUpload();
        }
      } else if (stage === 'processing' || stage === 'extracting' || stage === 'classifying') {
        // Processing phase: 30-100% of total workflow maps to 0-100% processing progress
        const processingProgress = Math.min(100, Math.max(0, ((totalProgress - 30) / 70) * 100));
        updateProcessingProgress(processingProgress, stage as any, description);
      }
    },
    [enableLogging, updateUploadProgress, completeUpload, updateProcessingProgress]
  );

  // Cancellation check callback - Disabled for React Strict Mode compatibility
const checkCancellation = useCallback(() => {
  // Disable automatic cancellation to avoid React Strict Mode issues
  // User can still manually cancel via UI
  return false;
}, []);

  // Main processing function
  const processImage = useCallback(
    async (imageUri: string, correlationId?: string): Promise<ProcessingResult> => {
      if (state.isProcessing) {
        throw new Error('Processing is already in progress');
      }

      if (!imageUri) {
        throw new Error('Image URI is required');
      }

      // Clear any previous errors
      clearError();
      lastImageUriRef.current = imageUri;
      retryCountRef.current = 0;

      try {
        if (enableLogging) {
          console.log('[useBackendOCR] Starting image processing:', {
            imageUri,
            correlationId,
            timestamp: new Date().toISOString(),
          });
        }

        // Start processing state
        const sessionId = correlationId || `session_${Date.now()}`;
        startProcessing(sessionId);

        // Create processing promise
        const processingPromise = serviceRef.current!.processImage(
          imageUri,
          handleProgress,
          checkCancellation,
          correlationId
        );

        processingRequestRef.current = processingPromise;

        // Wait for completion
        const result = await processingPromise;

        // Update state with job ID if available
        const jobInfo = serviceRef.current!.getCurrentJobInfo();
        if (jobInfo.jobId) {
          startBackendProcessing(jobInfo.jobId);
        }

        // Complete processing
        completeProcessing();

        if (enableLogging) {
          console.log('[useBackendOCR] Processing completed successfully:', {
            processingTime: result.processingTime,
            uploadTime: result.uploadTime,
            totalTime: result.totalTime,
          });
        }

        return result;
      } catch (error) {
        if (enableLogging) {
          console.error('[useBackendOCR] Processing failed:', error);
        }

        // Handle different error types
        let processingError;

        if (error instanceof CameraFlowError) {
          processingError = OCRProcessingErrorUtils.createError(
            error.code,
            error.message,
            error.message,
            error.retryable,
            { stage: error.stage, ...error.context }
          );
        } else if (error instanceof Error) {
          if (error.message.includes('cancelled') || error.message.includes('abort')) {
            processingError = OCRProcessingErrorUtils.createError(
              'CANCELLED',
              'Processing was cancelled',
              'Processing was cancelled',
              false
            );
          } else if (error.message.includes('timeout')) {
            processingError = OCRProcessingErrorUtils.createTimeoutError(error.message, {
              imageUri,
              correlationId,
            });
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            processingError = OCRProcessingErrorUtils.createNetworkError(error.message, {
              imageUri,
              correlationId,
            });
          } else {
            processingError = OCRProcessingErrorUtils.createError(
              'PROCESSING_ERROR',
              error.message,
              'An error occurred while processing the image',
              true,
              { imageUri, correlationId }
            );
          }
        } else {
          processingError = OCRProcessingErrorUtils.createError(
            'UNKNOWN_ERROR',
            'Unknown error occurred',
            'An unexpected error occurred',
            true,
            { imageUri, correlationId, error }
          );
        }

        setError(processingError);

        // Auto-retry logic
        if (processingError.retryable && retryCountRef.current < autoRetryAttempts) {
          retryCountRef.current++;

          if (enableLogging) {
            console.log('[useBackendOCR] Auto-retrying:', {
              attempt: retryCountRef.current,
              maxAttempts: autoRetryAttempts,
              delay: retryDelay,
            });
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));

          // Retry
          return processImage(imageUri, correlationId);
        }

        throw error;
      } finally {
        processingRequestRef.current = null;
      }
    },
    [
      state.isProcessing,
      clearError,
      enableLogging,
      startProcessing,
      handleProgress,
      checkCancellation,
      startBackendProcessing,
      completeProcessing,
      setError,
      autoRetryAttempts,
      retryDelay,
    ]
  );

  // Cancel processing function
  const cancelProcessing = useCallback(async (): Promise<void> => {
    if (!state.isProcessing) {
      return;
    }

    try {
      if (enableLogging) {
        console.log('[useBackendOCR] Cancelling processing...');
      }

      // Cancel service operations
      if (serviceRef.current) {
        await serviceRef.current.cancelProcessing();
      }

      // Update state
      cancelState();

      if (enableLogging) {
        console.log('[useBackendOCR] Processing cancelled successfully');
      }
    } catch (error) {
      if (enableLogging) {
        console.error('[useBackendOCR] Cancel processing failed:', error);
      }
      // Don't throw - cancellation should always succeed from user perspective
    }
  }, [state.isProcessing, enableLogging, cancelState]);

  // Retry processing function
  const retryProcessing = useCallback(
    async (imageUri?: string): Promise<ProcessingResult> => {
      if (state.isProcessing) {
        throw new Error('Cannot retry while processing is in progress');
      }

      const targetImageUri = imageUri || lastImageUriRef.current;
      if (!targetImageUri) {
        throw new Error('No image URI available for retry');
      }

      if (enableLogging) {
        console.log('[useBackendOCR] Retrying processing:', {
          imageUri: targetImageUri,
          previousError: state.error?.code,
        });
      }

      // Reset state for retry
      resetForRetry();
      retryCountRef.current = 0;

      // Process again
      return processImage(targetImageUri);
    },
    [state.isProcessing, state.error, enableLogging, resetForRetry, processImage]
  );

  // Reset processing function
  const resetProcessingState = useCallback(() => {
    if (enableLogging) {
      console.log('[useBackendOCR] Resetting processing state');
    }

    resetProcessing();
    lastImageUriRef.current = undefined;
    retryCountRef.current = 0;
    processingRequestRef.current = null;
  }, [enableLogging, resetProcessing]);

  // Utility functions
  const getProcessingDuration = useCallback((): number => {
    if (!state.startTimestamp) return 0;

    const endTime = state.completedTimestamp || Date.now();
    return endTime - state.startTimestamp;
  }, [state.startTimestamp, state.completedTimestamp]);

  const getProgressDescription = useCallback((): string => {
    if (state.stageDescription) {
      return state.stageDescription;
    }

    if (state.hasError && state.error) {
      return state.error.userMessage;
    }

    switch (state.status) {
      case 'idle':
        return 'Ready to process';
      case 'uploading':
        return `Uploading... ${state.uploadProgress}%`;
      case 'processing':
        return `Processing... ${state.processingProgress}%`;
      case 'complete':
        return 'Processing complete';
      case 'error':
        return 'Processing failed';
      default:
        return 'Processing...';
    }
  }, [state]);

  // Development logging for state changes
  useEffect(() => {
    if (enableLogging) {
      console.log('[useBackendOCR] State updated:', {
        status: state.status,
        stage: state.stage,
        uploadProgress: state.uploadProgress,
        processingProgress: state.processingProgress,
        totalProgress: state.totalProgress,
        isProcessing: state.isProcessing,
        hasError: state.hasError,
        error: state.error?.code,
        timestamp: new Date().toISOString(),
      });
    }
  }, [state, enableLogging]);

  return {
    // State properties
    status: state.status,
    stage: state.stage,
    stageDescription: state.stageDescription,
    uploadProgress: state.uploadProgress,
    processingProgress: state.processingProgress,
    totalProgress: state.totalProgress,
    isProcessing: state.isProcessing,
    isUploading: state.isUploading,
    isCompleted: state.isCompleted,
    hasError: state.hasError,
    error: state.error,
    canRetry: state.canRetry,
    canCancel: state.isProcessing || state.isUploading,
    jobId: state.jobId,
    uploadSessionId: state.uploadSessionId,
    startTimestamp: state.startTimestamp,
    completedTimestamp: state.completedTimestamp,

    // Action functions
    processImage,
    cancelProcessing,
    retryProcessing,
    resetProcessing: resetProcessingState,

    // Utility functions
    getProcessingDuration,
    getProgressDescription,
  };
}

export default useBackendOCR;
