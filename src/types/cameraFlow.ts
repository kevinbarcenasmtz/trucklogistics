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
  readonly receiptDraft?: Receipt;

  // Navigation tracking
  stepHistory: CameraFlowStep[];
  readonly transitions: FlowTransition[];

  // Error handling
  readonly lastError?: FlowError;
  readonly errorHistory: FlowError[];

  // Analytics
  metrics: FlowMetrics;
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
 * Type guards for flow validation
 */
export const FlowTypeGuards = {
  hasImageUri: (flow: CameraFlow): flow is CameraFlow & { imageUri: string } => {
    return !!flow.imageUri && flow.imageUri.length > 0;
  },

  hasOCRResult: (flow: CameraFlow): flow is CameraFlow & { ocrResult: ProcessedReceipt } => {
    return !!flow.ocrResult;
  },

  hasReceiptDraft: (flow: CameraFlow): flow is CameraFlow & { receiptDraft: Receipt } => {
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
  'report',
];

export const STEP_RELATIONSHIPS: Record<
  CameraFlowStep,
  {
    previous?: CameraFlowStep;
    next?: CameraFlowStep;
    canSkipTo?: CameraFlowStep[];
  }
> = {
  capture: {
    next: 'processing',
  },
  processing: {
    previous: 'capture',
    next: 'review',
  },
  review: {
    previous: 'processing',
    next: 'verification',
  },
  verification: {
    previous: 'review',
    next: 'report',
  },
  report: {
    previous: 'verification',
  },
};
