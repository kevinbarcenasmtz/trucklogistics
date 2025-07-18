// src/components/index.ts - Phase 3 Component Exports Only

// === CAMERA WORKFLOW COMPONENTS ===
export { default as CameraWorkflowCoordinator } from './camera/workflow/CameraWorkflowCoordinator';

// === CAMERA STEP COMPONENTS (Phase 3) ===
export { default as CaptureStep } from './camera/workflow/steps/CaptureStep';
export { default as CompletionStep } from './camera/workflow/steps/CompletionStep';
export { default as ProcessingStep } from './camera/workflow/steps/ProcessingStep';
export { default as ReviewStep } from './camera/workflow/steps/ReviewStep';
export { default as VerificationStep } from './camera/workflow/steps/VerificationStep';

// === CAMERA UI COMPONENTS ===
export * from './camera/CameraUIComponents';
export * from './camera/ImageDetailComponents';
export * from './camera/ReportComponents';
export * from './camera/VerificationComponents';

// === WORKFLOW UTILITIES ===
export { CameraErrorBoundary } from './camera/workflow/CameraErrorBoundary';
export {
  CameraNavigationGuard,
  useGuardedNavigation,
} from './camera/workflow/CameraNavigationGuard';
export { StepTransition } from './camera/workflow/StepTransition';

// REMOVED LEGACY COMPONENT EXPORTS:
// ❌ Old OCR components that used legacy contexts
// ❌ Deprecated camera components with JSON serialization
// ❌ Legacy step components with old state management
// ❌ Unused UI components
// ❌ Components with development hacks
