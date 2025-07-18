// src/types/hook_types.ts

import { ProcessedReceipt } from '../state/ocr/types';
import { CameraFlow, CameraFlowStep } from './cameraFlow';
import { Receipt } from './ReceiptInterfaces';

/**
 * Camera flow hook return type
 * Central orchestration for camera workflow
 */
export interface UseCameraFlowReturn {
  // Flow state
  readonly hasActiveFlow: boolean;
  readonly currentFlow?: CameraFlow;
  readonly currentStep: CameraFlowStep;
  readonly flowId?: string;
  readonly canNavigateBack: boolean;
  readonly canNavigateForward: boolean;
  readonly isNavigationBlocked: boolean;
  readonly blockReason?: string;

  // Processing state
  readonly isProcessing: boolean;
  readonly processingProgress: number;
  readonly processingStage?: string;
  readonly processingError?: any;
  readonly canRetryProcessing: boolean;

  // Draft state
  readonly hasDraft: boolean;
  readonly isDraftDirty: boolean;
  readonly isDraftValid: boolean;
  readonly draftErrors: Record<string, any[]>;
  readonly isSaving: boolean;

  // Flow management functions
  readonly startFlow: (
    imageUri: string
  ) => Promise<{ success: boolean; flowId?: string; error?: string }>;
  readonly processCurrentImage: () => Promise<{
    success: boolean;
    processedReceipt?: ProcessedReceipt;
    flowId: string;
  }>;
  readonly saveCurrentReceipt: () => Promise<{
    success: boolean;
    savedReceipt?: Receipt;
    receiptId?: string;
    error?: string;
  }>;
  readonly completeFlow: () => Promise<{ success: boolean; flowId?: string; error?: string }>;
  readonly cancelFlow: (reason?: string) => Promise<void>;
  readonly resetFlow: () => void;

  // Navigation functions
  readonly navigateToStep: (step: CameraFlowStep) => {
    success: boolean;
    currentStep: CameraFlowStep;
    reason?: string;
  };
  readonly navigateBack: () => { success: boolean; currentStep: CameraFlowStep };
  readonly navigateNext: () => { success: boolean; currentStep: CameraFlowStep; reason?: string };

  // Data access functions
  readonly getCurrentImage: () => string | undefined;
  readonly getCurrentProcessedData: () => ProcessedReceipt | undefined;
  readonly getCurrentDraft: () => Receipt | undefined;
  readonly getFlowMetrics: () => any;

  // Error handling
  readonly clearError: () => void;
  readonly retryCurrentOperation: () => Promise<any>;

  // Utility functions
  readonly getStepProgress: () => number;
  readonly getOverallProgress: () => number;
  readonly canProceedToNext: () => boolean;
}

/**
 * Backend OCR hook return type
 * Processing operations interface
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
  readonly processImage: (
    imageUri: string,
    correlationId?: string
  ) => Promise<{
    processedReceipt: ProcessedReceipt;
    processingTime: number;
    uploadTime: number;
    totalTime: number;
  }>;
  readonly cancelProcessing: () => Promise<void>;
  readonly retryProcessing: (imageUri?: string) => Promise<{
    processedReceipt: ProcessedReceipt;
    processingTime: number;
    uploadTime: number;
    totalTime: number;
  }>;
  readonly resetProcessing: () => void;

  // Utility functions
  readonly getProcessingDuration: () => number;
  readonly getProgressDescription: () => string;
}

/**
 * Receipt draft hook return type
 * Draft management interface
 */
export interface UseReceiptDraftReturn {
  // State properties
  readonly draft?: Receipt;
  readonly originalData?: ProcessedReceipt;
  readonly isInitialized: boolean;
  readonly isDirty: boolean;
  readonly hasChanges: boolean;
  readonly isValid: boolean;
  readonly isSaving: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly lastSavedTimestamp?: number;
  readonly saveError?: string;

  // Field-specific state
  readonly fieldErrors: Record<string, any[]>;
  readonly fieldsWithErrors: string[];
  readonly modifiedFields: string[];
  readonly errorCount: number;
  readonly warningCount: number;

  // Action functions
  readonly updateField: (
    field: keyof Receipt,
    value: any,
    options?: {
      skipValidation?: boolean;
      skipAutoSave?: boolean;
    }
  ) => void;
  readonly updateMultipleFields: (
    updates: Partial<Receipt>,
    options?: {
      skipValidation?: boolean;
      skipAutoSave?: boolean;
    }
  ) => void;
  readonly validateField: (
    field: keyof Receipt,
    options?: {
      showWarnings?: boolean;
      validateCrossFields?: boolean;
    }
  ) => boolean;
  readonly validateAll: (options?: { showWarnings?: boolean }) => boolean;
  readonly saveChanges: (options?: {
    validateBeforeSave?: boolean;
    skipIfNotDirty?: boolean;
  }) => Promise<boolean>;
  readonly resetChanges: (options?: { confirmIfDirty?: boolean; clearHistory?: boolean }) => void;

  // History functions
  readonly undo: () => boolean;
  readonly redo: () => boolean;
  readonly clearHistory: () => void;

  // Error handling
  readonly clearFieldError: (field: keyof Receipt) => void;
  readonly clearAllErrors: () => void;
  readonly getFieldError: (field: keyof Receipt) => string | undefined;

  // Utility functions
  readonly getFieldValue: (field: keyof Receipt) => any;
  readonly isFieldModified: (field: keyof Receipt) => boolean;
  readonly isFieldValid: (field: keyof Receipt) => boolean;
  readonly getDraftSummary: () => any;
  readonly getValidationSummary: () => {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
    fieldsWithErrors: string[];
  };

  // Initialization
  readonly initializeFromProcessedData: (processedData: ProcessedReceipt) => void;
  readonly reinitialize: (draft?: Receipt) => void;
}

/**
 * Hook configuration types
 */
export interface UseCameraFlowConfig {
  enableAutoNavigation?: boolean;
  enableAutoSave?: boolean;
  autoSaveInterval?: number;
  enableLogging?: boolean;
}

export interface UseBackendOCRConfig {
  autoRetryAttempts?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}

export interface UseReceiptDraftConfig {
  enableAutoValidation?: boolean;
  enableAutoSave?: boolean;
  autoSaveDelay?: number;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  enableLogging?: boolean;
}

// Remove deprecated hook types
// OLD: UseOCRReturn, OCRHookConfig, etc.
