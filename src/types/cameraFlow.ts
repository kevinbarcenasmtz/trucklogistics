// src/types/cameraFlow.ts
import { ProcessedReceipt } from '../state/ocr/types';
import { Receipt } from './ReceiptInterfaces';

/**
 * Camera workflow step definitions
 */
export type CameraFlowStep = 'capture' | 'processing' | 'review' | 'verification' | 'report';

/**
 * Navigation transition types
 */
export type FlowTransition = {
  from: CameraFlowStep;
  to: CameraFlowStep;
  reason: 'user_action' | 'auto_advance' | 'error_recovery' | 'retry';
  timestamp: number;
};

/**
 * Step validation requirements
 */
export interface StepRequirements {
  capture: {
    required: [];
    optional: [];
  };
  processing: {
    required: ['imageUri'];
    optional: [];
  };
  review: {
    required: ['imageUri', 'ocrResult'];
    optional: [];
  };
  verification: {
    required: ['imageUri', 'ocrResult'];
    optional: ['receiptDraft'];
  };
  report: {
    required: ['imageUri', 'receiptDraft'];
    optional: ['ocrResult'];
  };
}

/**
 * Flow error context
 */
export interface FlowError {
  readonly step: CameraFlowStep;
  readonly code: string;
  readonly message: string;
  readonly userMessage: string;
  readonly timestamp: number;
  readonly retryable: boolean;
  readonly context?: Record<string, any>;
}

/**
 * Flow analytics data
 */
export interface FlowMetrics {
  readonly stepDurations: Partial<Record<CameraFlowStep, number>>;
  readonly totalDuration: number;
  readonly retryCount: number;
  readonly errorCount: number;
  readonly completionRate: number;
  readonly abandonmentStep?: CameraFlowStep;
}

/**
 * Complete flow state
 */
export interface CameraFlow {
  readonly id: string;
  readonly imageUri: string;
  readonly currentStep: CameraFlowStep;
  readonly timestamp: number;
  readonly isComplete: boolean;
  
  // Flow data
  readonly ocrResult?: ProcessedReceipt;
  readonly receiptDraft?: Partial<Receipt>;
  
  // Navigation tracking
  readonly stepHistory: CameraFlowStep[];
  readonly transitions: FlowTransition[];
  
  // Error handling
  readonly lastError?: FlowError;
  readonly errorHistory: FlowError[];
  
  // Analytics
  readonly metrics: FlowMetrics;
}

/**
 * Navigation guard result
 */
export interface NavigationGuardResult {
  allowed: boolean;
  reason?: string;
  suggestedAction?: {
    type: 'redirect' | 'retry' | 'cancel';
    target?: CameraFlowStep;
    message?: string;
  };
}

/**
 * Step component props interface
 */
export interface CameraStepProps {
  flowId: string;
  onNext: (data?: any) => void;
  onBack: () => void;
  onCancel: () => void;
  onError: (error: FlowError) => void;
  onRetry?: () => void;
}

/**
 * Navigation action types
 */
export type NavigationAction = 
  | { type: 'ADVANCE'; step: CameraFlowStep; data?: any }
  | { type: 'GO_BACK' }
  | { type: 'RETRY'; step?: CameraFlowStep }
  | { type: 'CANCEL'; reason?: string }
  | { type: 'ERROR'; error: FlowError }
  | { type: 'COMPLETE'; receipt: Receipt };

/**
 * Flow state selectors
 */
export interface FlowSelectors {
  canAdvanceTo: (step: CameraFlowStep) => boolean;
  canGoBack: () => boolean;
  getRequiredData: (step: CameraFlowStep) => string[];
  getMissingData: (step: CameraFlowStep) => string[];
  getPreviousStep: () => CameraFlowStep | null;
  getNextStep: () => CameraFlowStep | null;
  getStepProgress: () => number;
  hasErrors: () => boolean;
  canRetry: () => boolean;
}

/**
 * Step configuration
 */
export interface StepConfig {
  id: CameraFlowStep;
  title: string;
  description?: string;
  canSkip?: boolean;
  autoAdvance?: boolean;
  maxRetries?: number;
  timeout?: number;
  validation?: (flow: CameraFlow) => NavigationGuardResult;
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  steps: StepConfig[];
  allowBackNavigation: boolean;
  enableAnalytics: boolean;
  maxFlowDuration: number;
  autoCleanupAfter: number;
}

/**
 * Type guards for flow validation
 */
export const FlowTypeGuards = {
  hasImageUri: (flow: CameraFlow): flow is CameraFlow & { imageUri: string } => {
    return !!flow.imageUri;
  },
  
  hasOCRResult: (flow: CameraFlow): flow is CameraFlow & { ocrResult: ProcessedReceipt } => {
    return !!flow.ocrResult;
  },
  
  hasReceiptDraft: (flow: CameraFlow): flow is CameraFlow & { receiptDraft: Partial<Receipt> } => {
    return !!flow.receiptDraft;
  },
  
  isStep: (flow: CameraFlow, step: CameraFlowStep): boolean => {
    return flow.currentStep === step;
  },
  
  hasVisitedStep: (flow: CameraFlow, step: CameraFlowStep): boolean => {
    return flow.stepHistory.includes(step);
  },
  
  hasErrors: (flow: CameraFlow): boolean => {
    return flow.errorHistory.length > 0 || !!flow.lastError;
  },
  
  canRetry: (flow: CameraFlow): boolean => {
    return !!flow.lastError?.retryable;
  },
};

/**
 * Flow step order and relationships
 */
export const FLOW_STEP_ORDER: CameraFlowStep[] = [
  'capture',
  'processing', 
  'review',
  'verification',
  'report'
];

export const STEP_RELATIONSHIPS: Record<CameraFlowStep, {
  previous?: CameraFlowStep;
  next?: CameraFlowStep;
  allowedFrom: CameraFlowStep[];
}> = {
  capture: {
    next: 'processing',
    allowedFrom: [],
  },
  processing: {
    previous: 'capture',
    next: 'review',
    allowedFrom: ['capture'],
  },
  review: {
    previous: 'processing',
    next: 'verification',
    allowedFrom: ['processing', 'verification'],
  },
  verification: {
    previous: 'review',
    next: 'report',
    allowedFrom: ['review', 'report'],
  },
  report: {
    previous: 'verification',
    allowedFrom: ['verification'],
  },
};