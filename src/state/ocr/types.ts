// src/state/ocr/types.ts - Phase 3 Clean Types Only

import { AIClassifiedReceipt } from '../../types/ReceiptInterfaces';

/**
 * Processing stage definitions for backend OCR operations
 */
export type ProcessingStage =
  | 'initializing'
  | 'uploading_chunks'
  | 'combining_chunks'
  | 'extracting_text'
  | 'classifying_data'
  | 'finalizing';

/**
 * Processing status definitions
 */
export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

/**
 * Optimization metrics from backend processing
 */
export interface OptimizationMetrics {
  readonly originalSize: number;
  readonly optimizedSize: number;
  readonly compressionRatio: number;
  readonly processingTime: number;
  readonly qualityScore: number;
  // Add these missing properties that are used in the code
  readonly originalDimensions?: { width: number; height: number };
  readonly optimizedDimensions?: { width: number; height: number };
  readonly reductionPercentage?: number;
  readonly format?: string;
}

/**
 * Processed receipt result from backend
 */
export interface ProcessedReceipt {
  readonly imageUri: string;
  readonly originalImageUri: string;
  readonly extractedText: string;
  readonly classification: AIClassifiedReceipt;
  readonly optimizationMetrics: OptimizationMetrics;
  readonly processedAt: string;
  readonly confidence: number;
}

/**
 * Processing error structure for OCR operations
 */
export interface ProcessingError {
  readonly code: string;
  readonly message: string;
  readonly userMessage: string;
  readonly retryable: boolean;
  readonly timestamp: number;
  readonly context?: Record<string, any>;
}

// REMOVED ALL LEGACY TYPES:
// ❌ OCRAction - replaced by context-specific actions
// ❌ OCRState - replaced by context-specific states
// ❌ OCRStateWithContext - no longer needed with new architecture
// ❌ ERROR_CODES - moved to context-specific error handling
// ❌ OCRContextValue - replaced by specific context values
// ❌ Legacy processing types that used JSON serialization