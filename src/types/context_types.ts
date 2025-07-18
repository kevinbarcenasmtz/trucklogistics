// src/types/context_types.ts - Phase 3 Context Types Only

import { CameraFlow, CameraFlowStep, FlowError } from './cameraFlow';
import { ProcessedReceipt, ProcessingStage, ProcessingError } from '../state/ocr/types';
import { Receipt } from './ReceiptInterfaces';

/**
 * OCR Processing Context State - Pure backend processing tracking
 */
export interface OCRProcessingContextState {
  readonly status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  readonly stage?: ProcessingStage;
  readonly stageDescription?: string;
  readonly uploadProgress: number;
  readonly processingProgress: number;
  readonly totalProgress: number;
  readonly jobId?: string;
  readonly uploadSessionId?: string;
  readonly error?: ProcessingError;
  readonly canRetry: boolean;
  readonly startTimestamp?: number;
  readonly completedTimestamp?: number;
  readonly isProcessing: boolean;
  readonly isUploading: boolean;
  readonly isCompleted: boolean;
  readonly hasError: boolean;
}

/**
 * Camera Flow Context State - Workflow orchestration
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
 * Receipt Draft Context State - Form state management
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
 * OCR Processing Context Value Interface
 */
export interface OCRProcessingContextValue {
  readonly state: OCRProcessingContextState;
  readonly dispatch: React.Dispatch<any>;
  readonly startProcessing: (uploadSessionId: string, jobId?: string) => void;
  readonly updateUploadProgress: (progress: number) => void;
  readonly completeUpload: () => void;
  readonly startBackendProcessing: (jobId: string) => void;
  readonly updateProcessingProgress: (progress: number, stage?: ProcessingStage, description?: string) => void;
  readonly completeProcessing: () => void;
  readonly setError: (error: ProcessingError) => void;
  readonly clearError: () => void;
  readonly retryProcessing: () => void;
  readonly resetProcessing: () => void;
  readonly cancelProcessing: () => void;
}

/**
 * Camera Flow Context Value Interface
 */
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

/**
 * Receipt Draft Context Value Interface
 */
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

// REMOVED ALL LEGACY CONTEXT TYPES:
// ❌ OCRContextValue - replaced by specific context values
// ❌ OCRState - replaced by specific context states
// ❌ OCRActionDispatch - replaced by context-specific dispatchers
// ❌ OCRProcessingState (old version) - replaced by new ProcessingContextState
// ❌ Legacy navigation context types
// ❌ Old route parameter types with JSON serialization