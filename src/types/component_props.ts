// src/types/component_props.ts

import { ProcessedReceipt } from '../state/ocr/types';
import { CameraFlow, CameraFlowStep, FlowError } from './cameraFlow';
import { Receipt } from './ReceiptInterfaces';

/**
 * Base props that every camera step component receives
 * Replaces old OCR context prop drilling
 */
export interface BaseCameraStepProps {
  /** Current active flow ID */
  flowId: string;
  /** Navigation function to next step */
  onNext: (data?: Partial<CameraFlow>) => void;
  /** Navigation function to previous step */
  onBack: () => void;
  /** Cancel entire workflow */
  onCancel: () => void;
  /** Handle step-specific errors */
  onError: (error: FlowError) => void;
  /** Optional custom styling */
  style?: any;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Capture step specific props
 */
export interface CaptureStepProps extends BaseCameraStepProps {
  /** Whether camera is ready */
  cameraReady?: boolean;
  /** Camera permissions granted */
  hasPermissions?: boolean;
  /** Auto-start capture */
  autoStart?: boolean;
}

/**
 * Processing step specific props
 */
export interface ProcessingStepProps extends BaseCameraStepProps {
  /** Current image being processed */
  imageUri: string;
  /** Processing progress (0-100) */
  progress: number;
  /** Current processing stage */
  stage?: string;
  /** Stage description */
  stageDescription?: string;
  /** Whether processing can be cancelled */
  canCancel: boolean;
}

/**
 * Review step specific props
 */
export interface ReviewStepProps extends BaseCameraStepProps {
  /** Processed receipt data */
  processedData: ProcessedReceipt;
  /** Original image URI */
  imageUri: string;
  /** Whether data can be edited */
  editable?: boolean;
  /** Confidence score display */
  showConfidence?: boolean;
}

/**
 * Verification step specific props
 */
export interface VerificationStepProps extends BaseCameraStepProps {
  /** Current receipt draft */
  draft: Receipt;
  /** Original processed data for comparison */
  originalData: ProcessedReceipt;
  /** Whether draft is valid */
  isValid: boolean;
  /** Whether draft has unsaved changes */
  isDirty: boolean;
  /** Validation errors by field */
  fieldErrors: Record<string, any[]>;
}

/**
 * Completion step specific props
 */
export interface CompletionStepProps extends BaseCameraStepProps {
  /** Final saved receipt */
  savedReceipt: Receipt;
  /** Processing metrics */
  metrics?: any;
  /** Whether to show detailed summary */
  showDetails?: boolean;
  /** Custom success message */
  successMessage?: string;
}

/**
 * Workflow coordinator props
 */
export interface CameraWorkflowCoordinatorProps {
  /** Optional initial flow ID */
  flowId?: string;
  /** Custom error boundary */
  errorBoundary?: React.ComponentType<any>;
  /** Theme configuration */
  theme?: any;
  /** Analytics tracking */
  enableAnalytics?: boolean;
  /** Development mode features */
  devMode?: boolean;
}

/**
 * Step component configuration
 */
export interface StepComponentConfig {
  /** Step identifier */
  id: CameraFlowStep;
  /** React component */
  component: React.ComponentType<BaseCameraStepProps>;
  /** Whether step can be skipped */
  canSkip: boolean;
  /** Step validation function */
  validation: (flow: CameraFlow) => boolean;
  /** Step title for UI */
  title: string;
  /** Step description */
  description?: string;
  /** Estimated duration in seconds */
  estimatedDuration?: number;
}

/**
 * Error boundary props for camera workflow
 */
export interface CameraErrorBoundaryProps {
  /** Child components */
  children: React.ReactNode;
  /** Custom error fallback component */
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  /** Error reporting callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Recovery actions */
  enableRecovery?: boolean;
}

/**
 * Navigation guard component props
 */
export interface CameraNavigationGuardProps {
  /** Child components */
  children: React.ReactNode;
  /** Current flow state */
  currentFlow?: CameraFlow;
  /** Guard validation function */
  canNavigate: (fromStep: CameraFlowStep, toStep: CameraFlowStep) => boolean;
  /** Block navigation callback */
  onNavigationBlocked?: (reason: string) => void;
}
