// src/types/index.ts

// Core domain types
export * from './cameraFlow';
export * from './ReceiptInterfaces';

// Navigation types - explicit exports to avoid conflicts
export type {
  CameraRouteConfig,
  CameraStackParamList,
  NavigationUtils,
  NavigationGuardResult as RouteNavigationGuardResult,
  RouteTypeGuards,
} from './camera_navigation';

// Component types - simplified after prop cleanup
export type {
  BaseCameraStepProps,
  CameraWorkflowCoordinatorProps,
  StepComponentConfig,
  CameraErrorBoundaryProps,
  CameraNavigationGuardProps,
} from './component_props';

// Hook types
export * from './hook_types';

// Context types
// export * from './context_types';

// Service types
export type {
  BackendOCRError,
  CancelJobResponse,
  CreateUploadSessionResponse,
  FileInfo,
  JobStatusResponse,
  StartProcessingResponse,
  UploadChunkResponse,
} from '../services/api/BackendOCRService';

export type { CameraFlowError, WorkflowResult } from '../services/camera/CameraFlowService';

export type {
  FieldValidationError,
  FieldValidationResult,
  FormValidationResult,
} from '../context/ReceiptDraftContext';

export type { DraftComparison, FieldDifference } from '../services/camera/ReceiptDraftService';

// Processing state types
export type { OptimizationMetrics, ProcessedReceipt, ProcessingError } from '../state/ocr/types';

/**
 * Type utility helpers
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

/**
 * Common component prop patterns
 */
export interface BaseComponentProps {
  testID?: string;
  style?: any;
  disabled?: boolean;
}

export interface LoadingComponentProps extends BaseComponentProps {
  loading?: boolean;
  loadingText?: string;
}

export interface ErrorComponentProps extends BaseComponentProps {
  error?: Error | string;
  onRetry?: () => void;
  showRetry?: boolean;
}