// src/types/context_types.ts

import { CameraFlow, CameraFlowStep, FlowError } from './cameraFlow';
import { ProcessedReceipt } from '../state/ocr/types';
import { Receipt } from './ReceiptInterfaces';

/**
 * OCR Processing Context state and actions
 * Pure backend processing state tracking
 */
export interface OCRProcessingContextState {
  readonly status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  readonly stage?: 'initializing' | 'uploading_chunks' | 'combining_chunks' | 'extracting_text' | 'classifying_data' | 'finalizing';
  readonly stageDescription?: string;
  readonly uploadProgress: number;
  readonly processingProgress: number;
  readonly totalProgress: number;
  readonly jobId?: string;
  readonly uploadSessionId?: string;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly userMessage: string;
    readonly retryable: boolean;
    readonly timestamp: number;
    readonly context?: Record<string, any>;
  };
  readonly canRetry: boolean;
  readonly startTimestamp?: number;
  readonly completedTimestamp?: number;
  readonly isProcessing: boolean;
  readonly isUploading: boolean;
  readonly isCompleted: boolean;
  readonly hasError: boolean;
}

/**
 * Camera Flow Context state and actions
 * Workflow orchestration state
 */
export interface CameraFlowContextState {
  readonly activeFlow?: CameraFlow;
  readonly hasActiveFlow: boolean;
  readonly flows: Record<string, CameraFlow>;
  readonly flowHistory: string[];
  readonly canNavigateBack: boolean;
  readonly canNavigateForward: boolean;
  readonly navigationBlocked: boolean;
  readonly blockReason?: string;
  readonly persistedFlows: string[];
  readonly autoSaveEnabled: boolean;
  readonly sessionMetrics: {
    readonly totalFlows: number;
    readonly completedFlows: number;
    readonly abandonedFlows: number;
    readonly averageCompletionTime: number;
  };
}

/**
 * Receipt Draft Context state and actions
 * Form state management
 */
export interface ReceiptDraftContextState {
  readonly draft?: Receipt;
  readonly originalData?: ProcessedReceipt;
  readonly modifiedFields: Set<keyof Receipt>;
  readonly isDirty: boolean;
  readonly hasChanges: boolean;
  readonly fieldErrors: Record<string, {
    readonly code: string;
    readonly message: string;
    readonly severity: 'error' | 'warning';
  }[]>;
  readonly formValidation?: {
    readonly isValid: boolean;
    readonly fieldErrors: Record<string, any[]>;
    readonly hasErrors: boolean;
    readonly hasWarnings: boolean;
  };
  readonly isValid: boolean;
  readonly isSaving: boolean;
  readonly lastSavedTimestamp?: number;
  readonly saveError?: string;
  readonly history: Receipt[];
  readonly historyIndex: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly isInitialized: boolean;
}

/**
 * Context value interfaces with actions
 */
export interface OCRProcessingContextValue {
  readonly state: OCRProcessingContextState;
  readonly dispatch: React.Dispatch<any>;
  readonly startProcessing: (uploadSessionId: string, jobId?: string) => void;
  readonly updateUploadProgress: (progress: number) => void;
  readonly completeUpload: () => void;
  readonly startBackendProcessing: (jobId: string) => void;
  readonly updateProcessingProgress: (progress: number, stage?: any, description?: string) => void;
  readonly completeProcessing: () => void;
  readonly setError: (error: any) => void;
  readonly clearError: () => void;
  readonly retryProcessing: () => void;
  readonly resetProcessing: () => void;
  readonly cancelProcessing: () => void;
}

export interface CameraFlowContextValue {
  readonly state: CameraFlowContextState;
  readonly dispatch: React.Dispatch<any>;
  readonly createFlow: (imageUri: string, flowId?: string) => string;
  readonly setActiveFlow: (flowId: string) => void;
  readonly updateCurrentStep: (step: CameraFlowStep, reason?: string) => void;
  readonly updateFlowData: (data: Partial<Pick<CameraFlow, 'ocrResult' | 'receiptDraft'>>) => void;
  readonly completeFlow: () => void;
  readonly cancelFlow: (reason?: string) => void;
  readonly navigateToStep: (step: CameraFlowStep) => boolean;
  readonly navigateBack: () => boolean;
  readonly blockNavigation: (reason: string) => void;
  readonly unblockNavigation: () => void;
  readonly addError: (error: FlowError) => void;
  readonly clearError: () => void;
  readonly persistFlow: (flowId: string) => void;
  readonly restoreFlows: (flows: CameraFlow[]) => void;
  readonly cleanupFlows: () => void;
  readonly resetSession: () => void;
}

export interface ReceiptDraftContextValue {
  readonly state: ReceiptDraftContextState;
  readonly dispatch: React.Dispatch<any>;
  readonly initializeDraft: (originalData: ProcessedReceipt, draft?: Receipt) => void;
  readonly updateField: (field: keyof Receipt, value: any) => void;
  readonly updateMultipleFields: (updates: Partial<Receipt>) => void;
  readonly validateField: (field: keyof Receipt, result: any) => void;
  readonly validateForm: (result: any) => void;
  readonly clearFieldError: (field: keyof Receipt) => void;
  readonly clearAllErrors: () => void;
  readonly startSave: () => void;
  readonly saveSuccess: () => void;
  readonly saveError: (error: string) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly resetToOriginal: () => void;
  readonly clearDraft: () => void;
}

// Remove deprecated context types
// OLD: OCRContextValue, OCRState, etc.