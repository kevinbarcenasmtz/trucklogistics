// src/types/component_props.ts

import { CameraFlowStep } from './cameraFlow';

/**
 * Simplified base props - components get everything else from store
 */
export interface BaseCameraStepProps {
  /** Current active flow ID */
  flowId: string;
  /** Test ID for testing */
  testID?: string;
  /** Optional custom styling */
  style?: any;
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
  validation: (flow: any) => boolean;
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
  currentFlow?: any;
  /** Guard validation function */
  canNavigate: (fromStep: CameraFlowStep, toStep: CameraFlowStep) => boolean;
  /** Block navigation callback */
  onNavigationBlocked?: (reason: string) => void;
}
