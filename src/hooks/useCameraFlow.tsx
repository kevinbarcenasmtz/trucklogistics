// src/hooks/useCameraFlow.tsx

import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { useOCRProcessing } from '../context/OCRProcessingContext';
import { useReceiptDraft } from '../context/ReceiptDraftContext';
import { ReceiptDraftService } from '../services/camera/ReceiptDraftService';
import { ProcessedReceipt } from '../state/ocr/types';
import { useCameraFlow as useCameraFlowStore } from '../store/cameraFlowStore';
import { CameraFlowStep, FlowError } from '../types/cameraFlow';
import { Receipt } from '../types/ReceiptInterfaces';
import { useBackendOCR, ProcessingResult } from './useBackendOCR';

/**
 * Camera flow hook configuration
 */
export interface UseCameraFlowConfig {
  enableLogging?: boolean;
}

/**
 * Flow operation result
 */
export interface FlowOperationResult {
  success: boolean;
  flowId?: string;
  error?: string;
}

/**
 * Navigation result
 */
export interface NavigationResult {
  success: boolean;
  currentStep: CameraFlowStep;
  reason?: string;
}

/**
 * Processing result with flow context
 */
export interface FlowProcessingResult {
  success: boolean;
  processedReceipt?: ProcessedReceipt;
  flowId: string;
  processingTime?: number;
  error?: string;
}

/**
 * Save result
 */
export interface SaveResult {
  success: boolean;
  savedReceipt?: Receipt;
  receiptId?: string;
  error?: string;
}

/**
 * Enhanced camera flow hook return interface
 */
export interface UseCameraFlowReturn {
  // Flow state
  readonly hasActiveFlow: boolean;
  readonly currentFlow: any;
  readonly currentStep: CameraFlowStep;
  readonly flowId?: string;
  readonly canNavigateBack: boolean;
  readonly canNavigateForward: boolean;
  readonly isNavigationBlocked: boolean;
  readonly blockReason?: string;

  // Processing state
  readonly isProcessing: boolean;
  readonly processingProgress: number;
  readonly processingStage?: string;
  readonly processingError?: any;
  readonly canRetryProcessing: boolean;

  // Draft state
  readonly hasDraft: boolean;
  readonly isDraftDirty: boolean;
  readonly isDraftValid: boolean;
  readonly draftErrors: Record<string, any[]>;
  readonly isSaving: boolean;

  // Flow management functions
  readonly startFlow: (imageUri: string) => Promise<FlowOperationResult>;
  readonly processCurrentImage: () => Promise<FlowProcessingResult>;
  readonly saveCurrentReceipt: () => Promise<SaveResult>;
  readonly completeFlow: () => Promise<FlowOperationResult>;
  readonly cancelFlow: (reason?: string) => Promise<void>;
  readonly resetFlow: () => void;

  // Navigation functions
  readonly navigateToStep: (step: CameraFlowStep) => NavigationResult;
  readonly navigateBack: () => NavigationResult;
  readonly navigateNext: () => NavigationResult;

  // Data access functions
  readonly getCurrentImage: () => string | undefined;
  readonly getCurrentProcessedData: () => ProcessedReceipt | undefined;
  readonly getCurrentDraft: () => Receipt | undefined;
  readonly getFlowMetrics: () => any;

  // Error handling
  readonly clearError: () => void;
  readonly retryCurrentOperation: () => Promise<any>;

  // Utility functions
  readonly getStepProgress: () => number;
  readonly getOverallProgress: () => number;
  readonly canProceedToNext: () => boolean;
}

/**
 * Enhanced Camera Flow Hook - Phase 3 Zustand Store Only
 * Coordinates camera workflow using centralized Zustand state
 */
export function useCameraFlow(config: UseCameraFlowConfig = {}): UseCameraFlowReturn {
  const { enableLogging = __DEV__ } = config;

  const router = useRouter();

  // Zustand store - single source of truth
  const store = useCameraFlowStore();

  // Other contexts (NOT flow management)
  const ocrProcessingContext = useOCRProcessing();
  const receiptDraftContext = useReceiptDraft();
  const backendOCR = useBackendOCR();

  // Navigation lock to prevent concurrent navigation
  const isNavigating = useRef(false);

  // Draft service instance - Fixed: Only use valid ValidationConfig properties
  const draftServiceRef = useRef(new ReceiptDraftService({
    requiredFields: ['date', 'type', 'amount', 'vehicle'],
    amountMinimum: 0.01,
    amountMaximum: 999999.99,
    dateRangeMonths: 12,
    locationMaxLength: 100,
    vendorNameMaxLength: 100,
  }));

  // Start flow - pure store operation
  const startFlow = useCallback(async (imageUri: string): Promise<FlowOperationResult> => {
    try {
      if (enableLogging) {
        console.log('[useCameraFlow] Starting new flow with imageUri:', !!imageUri);
      }

      const newFlow = await store.startFlow(imageUri);
      
      return {
        success: true,
        flowId: newFlow.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start flow';
      
      if (enableLogging) {
        console.error('[useCameraFlow] Start flow failed:', error);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [store, enableLogging]);

  // Process current image
  const processCurrentImage = useCallback(async (): Promise<FlowProcessingResult> => {
    if (!store.activeFlow) {
      return { 
        success: false, 
        flowId: '',
        error: 'No active flow'
      };
    }

    try {
      if (enableLogging) {
        console.log('[useCameraFlow] Processing image for flow:', store.activeFlow.id);
      }

      const result: ProcessingResult = await backendOCR.processImage(store.activeFlow.imageUri);
      
      if (result.processedReceipt) {
        // Update store with OCR result
        store.updateFlow({ ocrResult: result.processedReceipt });
        
        // Initialize draft from processed data
        const draft = draftServiceRef.current.createDraftFromProcessedData(result.processedReceipt);
        receiptDraftContext.initializeDraft(result.processedReceipt, draft);

        return {
          success: true,
          processedReceipt: result.processedReceipt,
          flowId: store.activeFlow.id,
          processingTime: result.processingTime,
        };
      }

      throw new Error('Processing failed - no receipt data');
    } catch (error) {
      const flowError: FlowError = {
        step: store.activeFlow.currentStep,
        code: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Processing failed',
        userMessage: 'Failed to process image. Please try again.',
        timestamp: Date.now(),
        retryable: true,
        context: { flowId: store.activeFlow.id, imageUri: store.activeFlow.imageUri },
      };

      store.recordError(flowError);

      if (enableLogging) {
        console.error('[useCameraFlow] Image processing failed:', error);
      }

      return {
        success: false,
        flowId: store.activeFlow.id,
        error: error instanceof Error ? error.message : 'Processing failed',
      };
    }
  }, [store, backendOCR, receiptDraftContext, enableLogging]);

  // Save current receipt
  const saveCurrentReceipt = useCallback(async (): Promise<SaveResult> => {
    if (!store.activeFlow) {
      return { success: false, error: 'No active flow' };
    }

    if (!receiptDraftContext.state.draft) {
      return { success: false, error: 'No draft to save' };
    }

    try {
      if (enableLogging) {
        console.log('[useCameraFlow] Saving current receipt:', {
          flowId: store.activeFlow.id,
          isDirty: receiptDraftContext.state.isDirty,
        });
      }

      // Validate draft before saving
      const validation = draftServiceRef.current.validateReceipt(receiptDraftContext.state.draft);
      if (!validation.isValid) {
        receiptDraftContext.validateForm(validation);
        return {
          success: false,
          error: `Validation failed: ${Object.keys(validation.fieldErrors).length} errors`,
        };
      }

      // Start save operation
      receiptDraftContext.startSave();

      // Transform draft to final receipt
      const finalReceipt = draftServiceRef.current.transformToFinalReceipt(receiptDraftContext.state.draft);

      // Simulate save (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update store with saved receipt
      store.updateFlow({ receiptDraft: finalReceipt });

      // Complete save
      receiptDraftContext.saveSuccess();

      if (enableLogging) {
        console.log('[useCameraFlow] Receipt saved successfully:', {
          receiptId: finalReceipt.id,
          flowId: store.activeFlow.id,
        });
      }

      return {
        success: true,
        savedReceipt: finalReceipt,
        receiptId: finalReceipt.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      receiptDraftContext.saveError(errorMessage);

      if (enableLogging) {
        console.error('[useCameraFlow] Save failed:', error);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [store, receiptDraftContext, enableLogging]);

  // Complete flow
  const completeFlow = useCallback(async (): Promise<FlowOperationResult> => {
    if (!store.activeFlow) {
      return { success: false, error: 'No active flow' };
    }

    try {
      if (enableLogging) {
        console.log('[useCameraFlow] Completing flow:', store.activeFlow.id);
      }

      // Ensure receipt is saved before completion
      if (receiptDraftContext.state.isDirty) {
        const saveResult = await saveCurrentReceipt();
        if (!saveResult.success) {
          return { success: false, error: saveResult.error };
        }
      }

      await store.completeFlow();

      if (enableLogging) {
        console.log('[useCameraFlow] Flow completed successfully');
      }

      return {
        success: true,
        flowId: store.activeFlow.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Complete flow failed';

      if (enableLogging) {
        console.error('[useCameraFlow] Complete flow failed:', error);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [store, receiptDraftContext, saveCurrentReceipt, enableLogging]);

  // Cancel flow
  const cancelFlow = useCallback(async (reason?: string): Promise<void> => {
    try {
      if (enableLogging) {
        console.log('[useCameraFlow] Cancelling flow:', { reason });
      }

      // Cancel any active processing
      if (ocrProcessingContext.state.isProcessing) {
        await backendOCR.cancelProcessing();
      }

      // Cancel flow in store
      store.cancelFlow();

      // Reset all contexts
      ocrProcessingContext.resetProcessing();
      receiptDraftContext.clearDraft();

      if (enableLogging) {
        console.log('[useCameraFlow] Flow cancelled successfully');
      }
    } catch (error) {
      if (enableLogging) {
        console.error('[useCameraFlow] Cancel flow failed:', error);
      }
      // Don't throw - cancellation should always succeed from user perspective
    }
  }, [store, ocrProcessingContext, receiptDraftContext, backendOCR, enableLogging]);

  // Reset flow
  const resetFlow = useCallback(() => {
    if (enableLogging) {
      console.log('[useCameraFlow] Resetting flow');
    }

    store.resetActiveFlow();
    ocrProcessingContext.resetProcessing();
    receiptDraftContext.clearDraft();
  }, [store, ocrProcessingContext, receiptDraftContext, enableLogging]);

  // Navigate to step - pure calculation, no useEffect
  const navigateToStep = useCallback((step: CameraFlowStep): NavigationResult => {
    if (isNavigating.current) {
      console.warn('[useCameraFlow] Navigation already in progress');
      return {
        success: false,
        currentStep: store.activeFlow?.currentStep || 'capture',
        reason: 'Navigation in progress',
      };
    }

    if (enableLogging) {
      console.log('[useCameraFlow] Attempting to navigate to step:', step);
    }

    // Set navigation lock
    isNavigating.current = true;

    // Check if navigation is allowed
    if (!store.canNavigateToStep(step)) {
      isNavigating.current = false;
      return {
        success: false,
        currentStep: store.activeFlow?.currentStep || 'capture',
        reason: 'Navigation not allowed',
      };
    }

    // Update store step
    store.updateFlow({ currentStep: step });
    store.recordTransition(step, 'user_action');

    // Perform router navigation
    switch (step) {
      case 'capture':
        router.push('/camera');
        break;
      case 'processing':
      case 'review':
        router.push(`/camera/imagedetails?flowId=${store.activeFlow?.id}`);
        break;
      case 'verification':
        router.push(`/camera/verification?flowId=${store.activeFlow?.id}`);
        break;
      case 'report':
        router.push(`/camera/report?flowId=${store.activeFlow?.id}`);
        break;
    }

    isNavigating.current = false;

    return {
      success: true,
      currentStep: step,
    };
  }, [store, router, enableLogging]);

  // Navigate back - simple calculation
  const navigateBack = useCallback((): NavigationResult => {
    if (!store.activeFlow) {
      return {
        success: false,
        currentStep: 'capture',
        reason: 'No active flow',
      };
    }

    const stepOrder: CameraFlowStep[] = ['capture', 'processing', 'review', 'verification', 'report'];
    const currentIndex = stepOrder.indexOf(store.activeFlow.currentStep);
    
    if (currentIndex <= 0) {
      return {
        success: false,
        currentStep: store.activeFlow.currentStep,
        reason: 'Already at first step',
      };
    }

    const previousStep = stepOrder[currentIndex - 1];
    return navigateToStep(previousStep);
  }, [store, navigateToStep]);

  // Navigate next - simple calculation  
  const navigateNext = useCallback((): NavigationResult => {
    if (!store.activeFlow) {
      return {
        success: false,
        currentStep: 'capture',
        reason: 'No active flow',
      };
    }

    const stepOrder: CameraFlowStep[] = ['capture', 'processing', 'review', 'verification', 'report'];
    const currentIndex = stepOrder.indexOf(store.activeFlow.currentStep);
    
    if (currentIndex >= stepOrder.length - 1) {
      return {
        success: false,
        currentStep: store.activeFlow.currentStep,
        reason: 'Already at last step',
      };
    }

    const nextStep = stepOrder[currentIndex + 1];
    return navigateToStep(nextStep);
  }, [store, navigateToStep]);

  // Pure calculation functions
  const getCurrentImage = useCallback(() => store.activeFlow?.imageUri, [store.activeFlow]);
  const getCurrentProcessedData = useCallback(() => store.activeFlow?.ocrResult, [store.activeFlow]);
  const getCurrentDraft = useCallback(() => receiptDraftContext.state.draft, [receiptDraftContext.state.draft]);
  const getFlowMetrics = useCallback(() => store.activeFlow?.metrics, [store.activeFlow]);

  const clearError = useCallback(() => {
    store.clearError();
    ocrProcessingContext.clearError();
    receiptDraftContext.clearAllErrors();
  }, [store, ocrProcessingContext, receiptDraftContext]);

  const retryCurrentOperation = useCallback(async () => {
    if (!store.activeFlow) {
      throw new Error('No active flow for retry');
    }

    switch (store.activeFlow.currentStep) {
      case 'processing':
        return processCurrentImage();
      case 'verification':
        return saveCurrentReceipt();
      default:
        throw new Error(`No retry operation available for step: ${store.activeFlow.currentStep}`);
    }
  }, [store.activeFlow, processCurrentImage, saveCurrentReceipt]);

  const getStepProgress = useCallback((): number => {
    if (!store.activeFlow) return 0;

    const stepOrder: CameraFlowStep[] = ['capture', 'processing', 'review', 'verification', 'report'];
    const currentIndex = stepOrder.indexOf(store.activeFlow.currentStep);
    return ((currentIndex + 1) / stepOrder.length) * 100;
  }, [store.activeFlow]);

  const getOverallProgress = useCallback((): number => {
    const stepProgress = getStepProgress();
    const processingProgress = ocrProcessingContext.state.totalProgress;

    if (store.activeFlow?.currentStep === 'processing') {
      return processingProgress;
    }

    return stepProgress;
  }, [getStepProgress, ocrProcessingContext.state.totalProgress, store.activeFlow]);

  const canProceedToNext = useCallback((): boolean => {
    if (!store.activeFlow) return false;

    switch (store.activeFlow.currentStep) {
      case 'capture':
        return !!store.activeFlow.imageUri;
      case 'processing':
        return !!store.activeFlow.ocrResult && ocrProcessingContext.state.isCompleted;
      case 'review':
        return !!store.activeFlow.ocrResult;
      case 'verification':
        return receiptDraftContext.state.isValid && !receiptDraftContext.state.isDirty;
      case 'report':
        return false; // Last step
      default:
        return false;
    }
  }, [store.activeFlow, ocrProcessingContext.state.isCompleted, receiptDraftContext.state]);

  return {
    // Flow state - all from Zustand store
    hasActiveFlow: !!store.activeFlow,
    currentFlow: store.activeFlow,
    currentStep: store.activeFlow?.currentStep || 'capture',
    flowId: store.activeFlow?.id,
    canNavigateBack: !!store.activeFlow && store.activeFlow.currentStep !== 'capture',
    canNavigateForward: canProceedToNext(),
    isNavigationBlocked: false, // Simplified - no blocking in Phase 3
    blockReason: undefined,

    // Processing state
    isProcessing: ocrProcessingContext.state.isProcessing,
    processingProgress: ocrProcessingContext.state.totalProgress,
    processingStage: ocrProcessingContext.state.stage,
    processingError: ocrProcessingContext.state.error,
    canRetryProcessing: ocrProcessingContext.state.canRetry,

    // Draft state
    hasDraft: receiptDraftContext.state.isInitialized,
    isDraftDirty: receiptDraftContext.state.isDirty,
    isDraftValid: receiptDraftContext.state.isValid,
    draftErrors: receiptDraftContext.state.fieldErrors,
    isSaving: receiptDraftContext.state.isSaving,

    // Flow management functions
    startFlow,
    processCurrentImage,
    saveCurrentReceipt,
    completeFlow,
    cancelFlow,
    resetFlow,

    // Navigation functions
    navigateToStep,
    navigateBack,
    navigateNext,

    // Data access functions
    getCurrentImage,
    getCurrentProcessedData,
    getCurrentDraft,
    getFlowMetrics,

    // Error handling
    clearError,
    retryCurrentOperation,

    // Utility functions
    getStepProgress,
    getOverallProgress,
    canProceedToNext,
  };
}

export default useCameraFlow;