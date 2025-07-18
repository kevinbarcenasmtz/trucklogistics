// src/index.ts - Phase 3 Clean Barrel Exports

// === CORE CONTEXTS (Phase 3) ===
export {
  CameraFlowProvider,
  CameraFlowStateGuards,
  useCameraFlow as useCameraFlowContext,
} from './context/CameraFlowContext';

export {
  OCRProcessingErrorUtils,
  OCRProcessingProvider,
  OCRProcessingStateGuards,
  useOCRProcessing,
} from './context/OCRProcessingContext';

export {
  ReceiptDraftProvider,
  useReceiptDraft as useReceiptDraftContext,
} from './context/ReceiptDraftContext';

// === ENHANCED HOOKS (Phase 3) ===
export { useBackendOCR } from './hooks/useBackendOCR';
export { default as useCameraFlow } from './hooks/useCameraFlow';
export { useReceiptDraft } from './hooks/useReceiptDraft';

// === SERVICES (Phase 3) ===
export { BackendOCRService } from './services/api/BackendOCRService';
export { CameraFlowService } from './services/camera/CameraFlowService';
export { ReceiptDraftService } from './services/camera/ReceiptDraftService';

// === CORE TYPES ===
export type {
  CameraFlow,
  CameraFlowStep,
  FlowError,
  FlowMetrics,
  NavigationGuardResult as FlowNavigationGuardResult,
} from './types/cameraFlow';

export type {
  OptimizationMetrics,
  ProcessedReceipt,
  ProcessingError,
  ProcessingStage,
  ProcessingStatus,
} from './state/ocr/types';

export type {
  CameraRouteConfig,
  CameraStackParamList,
  NavigationGuardResult,
} from './types/camera_navigation';

export type {
  CameraFlowContextState,
  CameraFlowContextValue,
  OCRProcessingContextState,
  OCRProcessingContextValue,
  ReceiptDraftContextState,
  ReceiptDraftContextValue,
} from './types/context_types';

// === UI COMPONENTS (Phase 3) ===
export { CameraErrorBoundary } from './components/camera/workflow/CameraErrorBoundary';
export {
  CameraNavigationGuard,
  useGuardedNavigation,
} from './components/camera/workflow/CameraNavigationGuard';
export { default as CameraWorkflowCoordinator } from './components/camera/workflow/CameraWorkflowCoordinator';

// === UTILITIES ===
export { NavigationUtils, RouteTypeGuards } from './types/camera_navigation';

// REMOVED ALL LEGACY EXPORTS:
// ❌ OCRProvider, useOCR - old context system
// ❌ OCRService - old monolithic service
// ❌ OCRProcessingService - duplicate functionality
// ❌ Legacy OCR types and interfaces
// ❌ Deprecated navigation types with JSON serialization
// ❌ Old component exports that used legacy contexts
// ❌ Legacy utility functions
// ❌ Deprecated error handling exports
// ❌ Old test utilities and mocks
