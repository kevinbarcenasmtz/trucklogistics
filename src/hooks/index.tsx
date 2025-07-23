// src/hooks/index.ts - Phase 3 Hook Exports Only

// === CORE CAMERA FLOW HOOKS ===
export { useBackendOCR } from './useBackendOCR';
export { default as useCameraFlow } from './useCameraFlow';
export { useReceiptDraft } from './useReceiptDraft';

// === CONTEXT HOOKS ===
export { useOCRProcessing } from '../context/OCRProcessingContext';
export { useReceiptDraft as useReceiptDraftContext } from '../context/ReceiptDraftContext';

// === UTILITY HOOKS ===
export { useGuardedNavigation } from '../components/camera/workflow/CameraNavigationGuard';
export { useAppTheme } from './useAppTheme';

// === HOOK TYPES ===
export type {
  FlowOperationResult,
  FlowProcessingResult,
  NavigationResult,
  SaveResult,
  UseCameraFlowConfig,
  UseCameraFlowReturn,
} from './useCameraFlow';

export type { UseBackendOCRConfig, UseBackendOCRReturn } from './useBackendOCR';

export type { UseReceiptDraftConfig, UseReceiptDraftReturn } from './useReceiptDraft';