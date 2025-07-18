// src/context/OCRProcessingContext.tsx

import React, { createContext, useCallback, useContext, useReducer } from 'react';

/**
 * Processing stages that match backend OCR pipeline stages
 */
export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

/**
 * Detailed processing stage descriptions from backend
 */
export type ProcessingStage =
  | 'initializing'
  | 'uploading_chunks'
  | 'combining_chunks'
  | 'extracting_text'
  | 'classifying_data'
  | 'finalizing';

/**
 * Error object with code and user-friendly message
 */
export interface ProcessingError {
  readonly code: string;
  readonly message: string;
  readonly userMessage: string;
  readonly retryable: boolean;
  readonly timestamp: number;
  readonly context?: Record<string, any>;
}

/**
 * OCR Processing State
 * Pure state tracking for backend OCR operations
 */
export interface OCRProcessingState {
  // Status tracking
  readonly status: ProcessingStatus;
  readonly stage?: ProcessingStage;
  readonly stageDescription?: string;

  // Progress tracking (0-100)
  readonly uploadProgress: number;
  readonly processingProgress: number;
  readonly totalProgress: number;

  // Backend operation tracking
  readonly jobId?: string;
  readonly uploadSessionId?: string;

  // Error handling
  readonly error?: ProcessingError;
  readonly canRetry: boolean;

  // Timing
  readonly startTimestamp?: number;
  readonly completedTimestamp?: number;

  // Utility flags
  readonly isProcessing: boolean;
  readonly isUploading: boolean;
  readonly isCompleted: boolean;
  readonly hasError: boolean;
}

/**
 * Action types for state transitions
 */
export type OCRProcessingAction =
  | { type: 'START_PROCESSING'; uploadSessionId: string; jobId?: string }
  | { type: 'UPDATE_UPLOAD_PROGRESS'; progress: number }
  | { type: 'UPLOAD_COMPLETE' }
  | { type: 'START_BACKEND_PROCESSING'; jobId: string }
  | {
      type: 'UPDATE_PROCESSING_PROGRESS';
      progress: number;
      stage?: ProcessingStage;
      description?: string;
    }
  | { type: 'PROCESSING_COMPLETE' }
  | { type: 'PROCESSING_ERROR'; error: ProcessingError }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RETRY_PROCESSING' }
  | { type: 'RESET_PROCESSING' }
  | { type: 'CANCEL_PROCESSING' };

/**
 * Initial state
 */
const initialState: OCRProcessingState = {
  status: 'idle',
  uploadProgress: 0,
  processingProgress: 0,
  totalProgress: 0,
  canRetry: false,
  isProcessing: false,
  isUploading: false,
  isCompleted: false,
  hasError: false,
};

/**
 * Calculate total progress from upload and processing progress
 * Upload phase: 0-30% of total
 * Processing phase: 30-100% of total
 */
function calculateTotalProgress(
  uploadProgress: number,
  processingProgress: number,
  status: ProcessingStatus
): number {
  if (status === 'idle') return 0;
  if (status === 'complete') return 100;
  if (status === 'error') return 0;

  if (status === 'uploading') {
    return Math.round(uploadProgress * 0.3); // Upload is 30% of total
  }

  if (status === 'processing') {
    const uploadPhase = 30; // Upload phase complete
    const processingPhase = Math.round(processingProgress * 0.7); // Processing is 70% of total
    return uploadPhase + processingPhase;
  }

  return 0;
}

/**
 * OCR Processing State Reducer
 * Handles all state transitions with immutable updates
 */
function ocrProcessingReducer(
  state: OCRProcessingState,
  action: OCRProcessingAction
): OCRProcessingState {
  const timestamp = Date.now();

  switch (action.type) {
    case 'START_PROCESSING':
      return {
        ...state,
        status: 'uploading',
        uploadSessionId: action.uploadSessionId,
        jobId: action.jobId,
        uploadProgress: 0,
        processingProgress: 0,
        totalProgress: 0,
        startTimestamp: timestamp,
        completedTimestamp: undefined,
        error: undefined,
        canRetry: false,
        isProcessing: true,
        isUploading: true,
        isCompleted: false,
        hasError: false,
      };

    case 'UPDATE_UPLOAD_PROGRESS':
      const uploadProgress = Math.max(0, Math.min(100, action.progress));
      return {
        ...state,
        uploadProgress,
        totalProgress: calculateTotalProgress(
          uploadProgress,
          state.processingProgress,
          state.status
        ),
      };

    case 'UPLOAD_COMPLETE':
      return {
        ...state,
        uploadProgress: 100,
        isUploading: false,
        totalProgress: calculateTotalProgress(100, state.processingProgress, state.status),
      };

    case 'START_BACKEND_PROCESSING':
      return {
        ...state,
        status: 'processing',
        jobId: action.jobId,
        processingProgress: 0,
        stage: 'extracting_text',
        stageDescription: 'Extracting text from image...',
        isUploading: false,
        totalProgress: calculateTotalProgress(100, 0, 'processing'),
      };

    case 'UPDATE_PROCESSING_PROGRESS':
      const processingProgress = Math.max(0, Math.min(100, action.progress));
      return {
        ...state,
        processingProgress,
        stage: action.stage || state.stage,
        stageDescription: action.description || state.stageDescription,
        totalProgress: calculateTotalProgress(
          state.uploadProgress,
          processingProgress,
          state.status
        ),
      };

    case 'PROCESSING_COMPLETE':
      return {
        ...state,
        status: 'complete',
        processingProgress: 100,
        totalProgress: 100,
        completedTimestamp: timestamp,
        isProcessing: false,
        isCompleted: true,
        stage: 'finalizing',
        stageDescription: 'Processing complete',
      };

    case 'PROCESSING_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.error,
        canRetry: action.error.retryable,
        isProcessing: false,
        isUploading: false,
        hasError: true,
        stageDescription: `Error: ${action.error.userMessage}`,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: undefined,
        hasError: false,
        canRetry: false,
      };

    case 'RETRY_PROCESSING':
      return {
        ...initialState,
        uploadSessionId: state.uploadSessionId, // Preserve session if available
      };

    case 'RESET_PROCESSING':
      return initialState;

    case 'CANCEL_PROCESSING':
      return {
        ...state,
        status: 'idle',
        isProcessing: false,
        isUploading: false,
        canRetry: false,
        stageDescription: 'Processing cancelled',
      };

    default:
      if (process.env.NODE_ENV === 'development') {
        console.warn('Unknown OCRProcessingAction:', action);
      }
      return state;
  }
}

/**
 * Context Value Interface
 */
export interface OCRProcessingContextValue {
  readonly state: OCRProcessingState;
  readonly dispatch: React.Dispatch<OCRProcessingAction>;

  // Convenience methods
  readonly startProcessing: (uploadSessionId: string, jobId?: string) => void;
  readonly updateUploadProgress: (progress: number) => void;
  readonly completeUpload: () => void;
  readonly startBackendProcessing: (jobId: string) => void;
  readonly updateProcessingProgress: (
    progress: number,
    stage?: ProcessingStage,
    description?: string
  ) => void;
  readonly completeProcessing: () => void;
  readonly setError: (error: ProcessingError) => void;
  readonly clearError: () => void;
  readonly retryProcessing: () => void;
  readonly resetProcessing: () => void;
  readonly cancelProcessing: () => void;
}

/**
 * OCR Processing Context
 */
const OCRProcessingContext = createContext<OCRProcessingContextValue | null>(null);

/**
 * OCR Processing Provider Props
 */
export interface OCRProcessingProviderProps {
  children: React.ReactNode;
}

/**
 * OCR Processing Provider Component
 * Provides pure state management for backend OCR operations
 */
export const OCRProcessingProvider: React.FC<OCRProcessingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(ocrProcessingReducer, initialState);

  // Convenience action creators
  const startProcessing = useCallback((uploadSessionId: string, jobId?: string) => {
    dispatch({ type: 'START_PROCESSING', uploadSessionId, jobId });
  }, []);

  const updateUploadProgress = useCallback((progress: number) => {
    dispatch({ type: 'UPDATE_UPLOAD_PROGRESS', progress });
  }, []);

  const completeUpload = useCallback(() => {
    dispatch({ type: 'UPLOAD_COMPLETE' });
  }, []);

  const startBackendProcessing = useCallback((jobId: string) => {
    dispatch({ type: 'START_BACKEND_PROCESSING', jobId });
  }, []);

  const updateProcessingProgress = useCallback(
    (progress: number, stage?: ProcessingStage, description?: string) => {
      dispatch({ type: 'UPDATE_PROCESSING_PROGRESS', progress, stage, description });
    },
    []
  );

  const completeProcessing = useCallback(() => {
    dispatch({ type: 'PROCESSING_COMPLETE' });
  }, []);

  const setError = useCallback((error: ProcessingError) => {
    dispatch({ type: 'PROCESSING_ERROR', error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const retryProcessing = useCallback(() => {
    dispatch({ type: 'RETRY_PROCESSING' });
  }, []);

  const resetProcessing = useCallback(() => {
    dispatch({ type: 'RESET_PROCESSING' });
  }, []);

  const cancelProcessing = useCallback(() => {
    dispatch({ type: 'CANCEL_PROCESSING' });
  }, []);

  // Development logging
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[OCRProcessingContext] State updated:', {
        status: state.status,
        stage: state.stage,
        uploadProgress: state.uploadProgress,
        processingProgress: state.processingProgress,
        totalProgress: state.totalProgress,
        isProcessing: state.isProcessing,
        hasError: state.hasError,
        timestamp: new Date().toISOString(),
      });
    }
  }, [state]);

  const contextValue: OCRProcessingContextValue = {
    state,
    dispatch,
    startProcessing,
    updateUploadProgress,
    completeUpload,
    startBackendProcessing,
    updateProcessingProgress,
    completeProcessing,
    setError,
    clearError,
    retryProcessing,
    resetProcessing,
    cancelProcessing,
  };

  return (
    <OCRProcessingContext.Provider value={contextValue}>{children}</OCRProcessingContext.Provider>
  );
};

/**
 * Custom hook to use OCR Processing Context
 * @throws Error if used outside of OCRProcessingProvider
 */
export function useOCRProcessing(): OCRProcessingContextValue {
  const context = useContext(OCRProcessingContext);

  if (!context) {
    throw new Error('useOCRProcessing must be used within an OCRProcessingProvider');
  }

  return context;
}

/**
 * Type guards for state checking
 */
export const OCRProcessingStateGuards = {
  isIdle: (state: OCRProcessingState): boolean => state.status === 'idle',
  isUploading: (state: OCRProcessingState): boolean => state.status === 'uploading',
  isProcessing: (state: OCRProcessingState): boolean => state.status === 'processing',
  isComplete: (state: OCRProcessingState): boolean => state.status === 'complete',
  hasError: (state: OCRProcessingState): boolean => state.status === 'error',
  canCancel: (state: OCRProcessingState): boolean => state.isProcessing || state.isUploading,
  canRetry: (state: OCRProcessingState): boolean => state.hasError && state.canRetry,
  hasJobId: (state: OCRProcessingState): state is OCRProcessingState & { jobId: string } =>
    typeof state.jobId === 'string' && state.jobId.length > 0,
  hasSessionId: (
    state: OCRProcessingState
  ): state is OCRProcessingState & { uploadSessionId: string } =>
    typeof state.uploadSessionId === 'string' && state.uploadSessionId.length > 0,
};

/**
 * Helper utilities for error creation
 */
export const OCRProcessingErrorUtils = {
  createError: (
    code: string,
    message: string,
    userMessage: string,
    retryable: boolean = false,
    context?: Record<string, any>
  ): ProcessingError => ({
    code,
    message,
    userMessage,
    retryable,
    timestamp: Date.now(),
    context,
  }),

  createNetworkError: (message: string, context?: Record<string, any>): ProcessingError =>
    OCRProcessingErrorUtils.createError(
      'NETWORK_ERROR',
      message,
      'Connection error. Please check your internet and try again.',
      true,
      context
    ),

  createServerError: (message: string, context?: Record<string, any>): ProcessingError =>
    OCRProcessingErrorUtils.createError(
      'SERVER_ERROR',
      message,
      'Server error. Please try again later.',
      true,
      context
    ),

  createValidationError: (message: string, context?: Record<string, any>): ProcessingError =>
    OCRProcessingErrorUtils.createError(
      'VALIDATION_ERROR',
      message,
      'Invalid data provided. Please try again.',
      false,
      context
    ),

  createTimeoutError: (message: string, context?: Record<string, any>): ProcessingError =>
    OCRProcessingErrorUtils.createError(
      'TIMEOUT_ERROR',
      message,
      'Request timed out. Please try again.',
      true,
      context
    ),
};

export default OCRProcessingProvider;
