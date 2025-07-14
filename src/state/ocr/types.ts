// state/ocr/types.ts - OCR State Machine Types

import { AIClassifiedReceipt, Receipt } from '../../types/ReceiptInterfaces';

/**
 * OCR Processing State Machine Types
 * Represents all possible states during the OCR workflow
 */
export type OCRState =
  | { status: 'idle' }
  | { status: 'capturing'; source: 'camera' | 'gallery' }
  | { status: 'optimizing'; progress: number; imageUri: string }
  | {
      status: 'uploading';
      progress: number;
      imageUri: string;
      optimizedUri: string;
      uploadId: string;
    }
  | {
      status: 'processing';
      progress: number;
      imageUri: string;
      optimizedUri: string;
      jobId: string;
    }
  | {
      status: 'extracting';
      progress: number;
      imageUri: string;
      optimizedUri: string;
      jobId: string;
    }
  | {
      status: 'classifying';
      progress: number;
      text: string;
      imageUri: string;
      optimizedUri: string;
    }
  | { status: 'reviewing'; data: ProcessedReceipt; imageUri: string; optimizedUri: string }
  | { status: 'editing'; data: ProcessedReceipt; changes: Partial<Receipt>; imageUri: string }
  | { status: 'saving'; data: Receipt; imageUri: string }
  | { status: 'complete'; receipt: Receipt }
  | { status: 'error'; error: OCRError; previousState: OCRState; canRetry: boolean };

/**
 * Context data that persists across state transitions
 */
export interface OCRContext {
  correlationId: string;
  startTime: number;
  retryCount: number;
  abortController?: AbortController;
  metrics: ProcessingMetrics;
}

/**
 * Processing metrics for analytics and monitoring
 */
export interface ProcessingMetrics {
  imageOptimizationTime?: number;
  uploadTime?: number;
  ocrProcessingTime?: number;
  classificationTime?: number;
  totalProcessingTime?: number;
  originalImageSize?: number;
  optimizedImageSize?: number;
  compressionRatio?: number;
  ocrConfidence?: number;
  classificationConfidence?: number;
}

/**
 * All possible actions that can be dispatched to the reducer
 */
export type OCRAction =
  // Capture actions
  | { type: 'START_CAPTURE'; source: 'camera' | 'gallery' }
  | { type: 'IMAGE_CAPTURED'; uri: string }

  // Optimization actions
  | { type: 'OPTIMIZE_START' }
  | { type: 'OPTIMIZE_PROGRESS'; progress: number }
  | { type: 'OPTIMIZE_COMPLETE'; optimizedUri: string; metrics: OptimizationMetrics }

  // Upload actions
  | { type: 'UPLOAD_START'; uploadId: string }
  | { type: 'UPLOAD_PROGRESS'; progress: number }
  | { type: 'UPLOAD_COMPLETE' }

  // Processing actions
  | { type: 'PROCESS_START'; jobId: string }
  | { type: 'PROCESS_PROGRESS'; progress: number; stage: 'uploading' | 'processing' | 'extracting' }
  | { type: 'EXTRACT_COMPLETE'; text: string; confidence: number }

  // Classification actions
  | { type: 'CLASSIFY_START' }
  | { type: 'CLASSIFY_PROGRESS'; progress: number }
  | { type: 'CLASSIFY_COMPLETE'; classification: AIClassifiedReceipt }

  // Review/Edit actions
  | { type: 'ENTER_REVIEW' }
  | { type: 'ENTER_EDIT' }
  | { type: 'UPDATE_FIELD'; field: keyof Receipt; value: any }
  | { type: 'CONFIRM_CHANGES' }
  | { type: 'DISCARD_CHANGES' }

  // Save actions
  | { type: 'SAVE_START' }
  | { type: 'SAVE_COMPLETE'; receipt: Receipt }

  // Control actions
  | { type: 'ERROR'; error: OCRError }
  | { type: 'RETRY' }
  | { type: 'CANCEL' }
  | { type: 'RESET' }
  | { type: 'UPDATE_METRICS'; metrics: Partial<ProcessingMetrics> };

/**
 * OCR Error structure matching backend error format
 */
export interface OCRError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  details?: any;
  statusCode?: number;
}

/**
 * Image optimization metrics
 */
export interface OptimizationMetrics {
  originalSize: number;
  optimizedSize: number;
  originalDimensions: { width: number; height: number };
  optimizedDimensions: { width: number; height: number };
  reductionPercentage: number;
  processingTime: number;
  format?: string;
}

/**
 * Processed receipt data before saving
 */
export interface ProcessedReceipt {
  imageUri: string;
  originalImageUri: string;
  extractedText: string;
  classification: AIClassifiedReceipt;
  optimizationMetrics?: OptimizationMetrics;
  processedAt: string;
  confidence: number;
}

/**
 * Complete state including context
 */
export interface OCRStateWithContext {
  state: OCRState;
  context: OCRContext;
}

/**
 * Helper type guards for state checking
 */
export const OCRStateGuards = {
  isProcessing: (state: OCRState): boolean => {
    return [
      'optimizing',
      'uploading',
      'processing',
      'extracting',
      'classifying',
      'saving',
    ].includes(state.status);
  },

  canCancel: (state: OCRState): boolean => {
    return state.status !== 'idle' && state.status !== 'complete' && state.status !== 'saving';
  },

  hasImage: (state: OCRState): state is OCRState & { imageUri: string } => {
    return 'imageUri' in state && !!state.imageUri;
  },

  hasText: (state: OCRState): state is OCRState & { text: string } => {
    return 'text' in state && !!state.text;
  },

  hasData: (state: OCRState): state is OCRState & { data: ProcessedReceipt } => {
    return 'data' in state && !!state.data;
  },

  isError: (state: OCRState): state is Extract<OCRState, { status: 'error' }> => {
    return state.status === 'error';
  },
};

/**
 * Error code constants matching backend
 */
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'Connection error. Please check your internet and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  CANCELLED: 'Operation cancelled.',

  // Validation errors
  VALIDATION_ERROR: 'Invalid data provided.',
  FILE_TOO_LARGE: 'Image file is too large. Maximum size is 10MB.',
  INVALID_FILE_TYPE: 'Invalid image format. Please use JPEG or PNG.',

  // Processing errors
  OCR_FAILED: 'Failed to read receipt. Please try with a clearer image.',
  CLASSIFICATION_FAILED: 'Failed to understand receipt content.',
  OPTIMIZATION_FAILED: 'Failed to process image.',

  // Server errors
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  RESOURCE_NOT_FOUND: 'Resource not found.',

  // Client errors
  UNKNOWN: 'An unexpected error occurred.',
  IMAGE_QUALITY: 'Image quality issues detected.',
} as const;

/**
 * Action creator helper functions
 */
export const OCRActions = {
  startCapture: (source: 'camera' | 'gallery'): OCRAction => ({
    type: 'START_CAPTURE',
    source,
  }),

  imageCaptured: (uri: string): OCRAction => ({
    type: 'IMAGE_CAPTURED',
    uri,
  }),

  optimizeProgress: (progress: number): OCRAction => ({
    type: 'OPTIMIZE_PROGRESS',
    progress,
  }),

  optimizeComplete: (optimizedUri: string, metrics: OptimizationMetrics): OCRAction => ({
    type: 'OPTIMIZE_COMPLETE',
    optimizedUri,
    metrics,
  }),

  uploadStart: (uploadId: string): OCRAction => ({
    type: 'UPLOAD_START',
    uploadId,
  }),

  uploadProgress: (progress: number): OCRAction => ({
    type: 'UPLOAD_PROGRESS',
    progress,
  }),

  processStart: (jobId: string): OCRAction => ({
    type: 'PROCESS_START',
    jobId,
  }),

  processProgress: (
    progress: number,
    stage: 'uploading' | 'processing' | 'extracting'
  ): OCRAction => ({
    type: 'PROCESS_PROGRESS',
    progress,
    stage,
  }),

  extractComplete: (text: string, confidence: number): OCRAction => ({
    type: 'EXTRACT_COMPLETE',
    text,
    confidence,
  }),

  classifyComplete: (classification: AIClassifiedReceipt): OCRAction => ({
    type: 'CLASSIFY_COMPLETE',
    classification,
  }),

  updateField: (field: keyof Receipt, value: any): OCRAction => ({
    type: 'UPDATE_FIELD',
    field,
    value,
  }),

  error: (error: OCRError): OCRAction => ({
    type: 'ERROR',
    error,
  }),

  retry: (): OCRAction => ({
    type: 'RETRY',
  }),

  cancel: (): OCRAction => ({
    type: 'CANCEL',
  }),

  reset: (): OCRAction => ({
    type: 'RESET',
  }),

  updateMetrics: (metrics: Partial<ProcessingMetrics>): OCRAction => ({
    type: 'UPDATE_METRICS',
    metrics,
  }),
};

/**
 * Selectors for accessing state data
 */
export const OCRSelectors = {
  getProgress: (state: OCRStateWithContext): number => {
    switch (state.state.status) {
      case 'optimizing':
        return state.state.progress * 0.2; // 20%
      case 'uploading':
        return 0.2 + state.state.progress * 0.3; // 20-50%
      case 'processing':
      case 'extracting':
        return 0.5 + state.state.progress * 0.3; // 50-80%
      case 'classifying':
        return 0.8 + state.state.progress * 0.2; // 80-100%
      case 'reviewing':
      case 'editing':
        return 1.0; // 100%
      default:
        return 0;
    }
  },

  getProcessingTime: (state: OCRStateWithContext): number => {
    if (state.context.startTime === 0) return 0;
    return Date.now() - state.context.startTime;
  },

  getImageUri: (state: OCRStateWithContext): string | null => {
    if (OCRStateGuards.hasImage(state.state)) {
      return state.state.imageUri;
    }
    return null;
  },

  getOptimizedImageUri: (state: OCRStateWithContext): string | null => {
    if ('optimizedUri' in state.state) {
      return state.state.optimizedUri;
    }
    return null;
  },

  canRetry: (state: OCRStateWithContext): boolean => {
    return state.state.status === 'error' && state.state.canRetry && state.context.retryCount < 3;
  },
};
