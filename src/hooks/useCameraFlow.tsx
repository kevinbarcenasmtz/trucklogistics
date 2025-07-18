// src/hooks/useCameraFlow.tsx

import { useCallback, useEffect, useRef } from 'react';
import { useCameraFlow as useCameraFlowContext } from '../context/CameraFlowContext';
import { useOCRProcessing } from '../context/OCRProcessingContext';
import { useReceiptDraft } from '../context/ReceiptDraftContext';
import { ReceiptDraftService } from '../services/camera/ReceiptDraftService';
import { ProcessedReceipt } from '../state/ocr/types';
import { CameraFlowStep, FlowError } from '../types/cameraFlow';
import { Receipt } from '../types/ReceiptInterfaces';
import { useBackendOCR } from './useBackendOCR';

/**
 * Camera flow hook configuration
 */
export interface UseCameraFlowConfig {
  enableAutoNavigation?: boolean;
  enableAutoSave?: boolean;
  autoSaveInterval?: number;
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
 * useCameraFlow Hook
 * Central orchestration point for entire camera workflow
 */
export function useCameraFlow(config: UseCameraFlowConfig = {}): UseCameraFlowReturn {
  const {
    enableAutoNavigation = true,
    enableAutoSave = false,
    autoSaveInterval = 30000, // 30 seconds
    enableLogging = process.env.NODE_ENV === 'development',
  } = config;

  // Context hooks
  const flowContext = useCameraFlowContext();
  const ocrProcessingContext = useOCRProcessing();
  const receiptDraftContext = useReceiptDraft();

  // Service hooks
  const backendOCR = useBackendOCR({
    autoRetryAttempts: 2,
    retryDelay: 1000,
    enableLogging,
  });

  // Services
  const draftServiceRef = useRef<ReceiptDraftService | undefined>(undefined);
  const autoSaveTimerRef = useRef<number | undefined>(undefined);

  // Initialize draft service
  if (!draftServiceRef.current) {
    draftServiceRef.current = new ReceiptDraftService({
      requiredFields: ['date', 'type', 'amount', 'vehicle'],
      amountMinimum: 0.01,
      amountMaximum: 999999.99,
      dateRangeMonths: 12,
    });
  }

  // Auto-save functionality
  useEffect(() => {
    if (
      enableAutoSave &&
      receiptDraftContext.state.isDirty &&
      !receiptDraftContext.state.isSaving
    ) {
      autoSaveTimerRef.current = setTimeout(() => {
        if (receiptDraftContext.state.isDirty) {
          // Trigger auto-save (implement based on your save strategy)
          if (enableLogging) {
            console.log('[useCameraFlow] Auto-save triggered');
          }
        }
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    enableAutoSave,
    receiptDraftContext.state.isDirty,
    receiptDraftContext.state.isSaving,
    autoSaveInterval,
    enableLogging,
  ]);

  // Development logging
  useEffect(() => {
    if (enableLogging) {
      console.log('[useCameraFlow] State updated:', {
        hasActiveFlow: flowContext.state.hasActiveFlow,
        currentStep: flowContext.state.activeFlow?.currentStep,
        isProcessing: ocrProcessingContext.state.isProcessing,
        processingProgress: ocrProcessingContext.state.totalProgress,
        hasDraft: receiptDraftContext.state.isInitialized,
        isDraftDirty: receiptDraftContext.state.isDirty,
        timestamp: new Date().toISOString(),
      });
    }
  }, [flowContext.state, ocrProcessingContext.state, receiptDraftContext.state, enableLogging]);

  // Start new flow
  const startFlow = useCallback(
    async (imageUri: string): Promise<FlowOperationResult> => {
      try {
        if (enableLogging) {
          console.log('[useCameraFlow] Starting new flow:', { imageUri });
        }

        // Reset all contexts
        flowContext.resetSession();
        ocrProcessingContext.resetProcessing();
        receiptDraftContext.clearDraft();

        // Create new flow
        const flowId = flowContext.createFlow(imageUri);

        if (enableLogging) {
          console.log('[useCameraFlow] Flow started successfully:', { flowId });
        }

        return {
          success: true,
          flowId,
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
    },
    [flowContext, ocrProcessingContext, receiptDraftContext, enableLogging]
  );

  // Process current image
  const processCurrentImage = useCallback(async (): Promise<FlowProcessingResult> => {
    const currentFlow = flowContext.state.activeFlow;
    if (!currentFlow) {
      throw new Error('No active flow to process');
    }

    if (!currentFlow.imageUri) {
      throw new Error('No image URI in current flow');
    }

    try {
      if (enableLogging) {
        console.log('[useCameraFlow] Processing current image:', {
          flowId: currentFlow.id,
          imageUri: currentFlow.imageUri,
        });
      }

      // Update flow to processing step
      flowContext.updateCurrentStep('processing', 'auto');

      // Process image using backend OCR
      const result = await backendOCR.processImage(currentFlow.imageUri, currentFlow.id);

      // Update flow with processed data
      flowContext.updateFlowData({
        ocrResult: result.processedReceipt,
      });

      // Initialize draft context with processed data
      receiptDraftContext.initializeDraft(result.processedReceipt);

      if (enableLogging) {
        console.log('[useCameraFlow] Image processing completed:', {
          flowId: currentFlow.id,
          processingTime: result.processingTime,
        });
      }

      return {
        success: true,
        processedReceipt: result.processedReceipt,
        flowId: currentFlow.id,
        processingTime: result.processingTime,
      };
    } catch (error) {
      const flowError: FlowError = {
        step: 'processing',
        code: 'PROCESSING_FAILED',
        message: error instanceof Error ? error.message : 'Processing failed',
        userMessage: 'Failed to process image. Please try again.',
        timestamp: Date.now(),
        retryable: true,
        context: { flowId: currentFlow.id, imageUri: currentFlow.imageUri },
      };

      flowContext.addError(flowError);

      if (enableLogging) {
        console.error('[useCameraFlow] Image processing failed:', error);
      }

      return {
        success: false,
        flowId: currentFlow.id,
      };
    }
  }, [flowContext, backendOCR, receiptDraftContext, enableLogging]);

  // Save current receipt
  const saveCurrentReceipt = useCallback(async (): Promise<SaveResult> => {
    const currentFlow = flowContext.state.activeFlow;
    const draftState = receiptDraftContext.state;

    if (!currentFlow) {
      return { success: false, error: 'No active flow' };
    }

    if (!draftState.draft) {
      return { success: false, error: 'No draft to save' };
    }

    try {
      if (enableLogging) {
        console.log('[useCameraFlow] Saving current receipt:', {
          flowId: currentFlow.id,
          isDirty: draftState.isDirty,
        });
      }

      // Validate draft before saving
      const validation = draftServiceRef.current!.validateReceipt(draftState.draft);
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
      const finalReceipt = draftServiceRef.current!.transformToFinalReceipt(draftState.draft);

      // Here you would typically call your save service/API
      // For now, we'll simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update flow with saved receipt
      flowContext.updateFlowData({
        receiptDraft: finalReceipt,
      });

      // Complete save
      receiptDraftContext.saveSuccess();

      if (enableLogging) {
        console.log('[useCameraFlow] Receipt saved successfully:', {
          receiptId: finalReceipt.id,
          flowId: currentFlow.id,
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
        console.error('[useCameraFlow] Save receipt failed:', error);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [flowContext, receiptDraftContext, enableLogging]);

  // Complete flow
  const completeFlow = useCallback(async (): Promise<FlowOperationResult> => {
    const currentFlow = flowContext.state.activeFlow;
    if (!currentFlow) {
      return { success: false, error: 'No active flow to complete' };
    }

    try {
      if (enableLogging) {
        console.log('[useCameraFlow] Completing flow:', { flowId: currentFlow.id });
      }

      // Ensure all data is saved
      if (receiptDraftContext.state.isDirty) {
        const saveResult = await saveCurrentReceipt();
        if (!saveResult.success) {
          return { success: false, error: `Save failed: ${saveResult.error}` };
        }
      }

      // Complete the flow
      flowContext.completeFlow();

      // Clean up contexts
      ocrProcessingContext.resetProcessing();
      receiptDraftContext.clearDraft();

      if (enableLogging) {
        console.log('[useCameraFlow] Flow completed successfully:', { flowId: currentFlow.id });
      }

      return {
        success: true,
        flowId: currentFlow.id,
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
  }, [flowContext, receiptDraftContext, ocrProcessingContext, saveCurrentReceipt, enableLogging]);

  // Cancel flow
  const cancelFlow = useCallback(
    async (reason?: string): Promise<void> => {
      try {
        if (enableLogging) {
          console.log('[useCameraFlow] Cancelling flow:', { reason });
        }

        // Cancel any active processing
        if (ocrProcessingContext.state.isProcessing) {
          await backendOCR.cancelProcessing();
        }

        // Cancel flow context
        flowContext.cancelFlow(reason);

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
    },
    [flowContext, ocrProcessingContext, receiptDraftContext, backendOCR, enableLogging]
  );

  // Reset flow
  const resetFlow = useCallback(() => {
    if (enableLogging) {
      console.log('[useCameraFlow] Resetting flow');
    }

    flowContext.resetSession();
    ocrProcessingContext.resetProcessing();
    receiptDraftContext.clearDraft();
  }, [flowContext, ocrProcessingContext, receiptDraftContext, enableLogging]);

  // Navigate to step
  const navigateToStep = useCallback(
    (step: CameraFlowStep): NavigationResult => {
      const currentFlow = flowContext.state.activeFlow;
      if (!currentFlow) {
        return {
          success: false,
          currentStep: 'capture',
          reason: 'No active flow',
        };
      }

      if (flowContext.state.navigationBlocked) {
        return {
          success: false,
          currentStep: currentFlow.currentStep,
          reason: flowContext.state.blockReason || 'Navigation blocked',
        };
      }

      const success = flowContext.navigateToStep(step);

      if (enableLogging) {
        console.log('[useCameraFlow] Navigate to step:', {
          step,
          success,
          currentStep: flowContext.state.activeFlow?.currentStep,
        });
      }

      return {
        success,
        currentStep: flowContext.state.activeFlow?.currentStep || 'capture',
        reason: success ? undefined : 'Navigation not allowed',
      };
    },
    [flowContext, enableLogging]
  );

  // Move this useEffect block to after navigateToStep is defined (around line 470, after the navigateToStep function)
  useEffect(() => {
    if (
      enableAutoNavigation &&
      ocrProcessingContext.state.isCompleted &&
      flowContext.state.activeFlow?.currentStep === 'processing'
    ) {
      if (enableLogging) {
        console.log('[useCameraFlow] Auto-navigating to review after processing completion');
      }

      navigateToStep('review');
    }
  }, [
    enableAutoNavigation,
    ocrProcessingContext.state.isCompleted,
    flowContext.state.activeFlow?.currentStep,
    enableLogging,
    navigateToStep,
  ]);

  // Navigate back
  const navigateBack = useCallback((): NavigationResult => {
    const success = flowContext.navigateBack();

    if (enableLogging) {
      console.log('[useCameraFlow] Navigate back:', {
        success,
        currentStep: flowContext.state.activeFlow?.currentStep,
      });
    }

    return {
      success,
      currentStep: flowContext.state.activeFlow?.currentStep || 'capture',
    };
  }, [flowContext, enableLogging]);

  // Navigate next
  const navigateNext = useCallback((): NavigationResult => {
    const currentFlow = flowContext.state.activeFlow;
    if (!currentFlow) {
      return {
        success: false,
        currentStep: 'capture',
        reason: 'No active flow',
      };
    }

    const stepOrder: CameraFlowStep[] = [
      'capture',
      'processing',
      'review',
      'verification',
      'report',
    ];
    const currentIndex = stepOrder.indexOf(currentFlow.currentStep);
    const nextStep = stepOrder[currentIndex + 1];

    if (!nextStep) {
      return {
        success: false,
        currentStep: currentFlow.currentStep,
        reason: 'Already at last step',
      };
    }

    return navigateToStep(nextStep);
  }, [flowContext, navigateToStep]);

  // Data access functions
  const getCurrentImage = useCallback((): string | undefined => {
    return flowContext.state.activeFlow?.imageUri;
  }, [flowContext.state.activeFlow]);

  const getCurrentProcessedData = useCallback((): ProcessedReceipt | undefined => {
    return flowContext.state.activeFlow?.ocrResult;
  }, [flowContext.state.activeFlow]);

  const getCurrentDraft = useCallback((): Receipt | undefined => {
    return receiptDraftContext.state.draft;
  }, [receiptDraftContext.state.draft]);

  const getFlowMetrics = useCallback(() => {
    return flowContext.state.activeFlow?.metrics;
  }, [flowContext.state.activeFlow]);

  // Error handling
  const clearError = useCallback(() => {
    flowContext.clearError();
    ocrProcessingContext.clearError();
    receiptDraftContext.clearAllErrors();
  }, [flowContext, ocrProcessingContext, receiptDraftContext]);

  const retryCurrentOperation = useCallback(async () => {
    const currentFlow = flowContext.state.activeFlow;
    if (!currentFlow) {
      throw new Error('No active flow for retry');
    }

    switch (currentFlow.currentStep) {
      case 'processing':
        return processCurrentImage();
      case 'verification':
        return saveCurrentReceipt();
      default:
        throw new Error(`No retry operation available for step: ${currentFlow.currentStep}`);
    }
  }, [flowContext.state.activeFlow, processCurrentImage, saveCurrentReceipt]);

  // Utility functions
  const getStepProgress = useCallback((): number => {
    const currentFlow = flowContext.state.activeFlow;
    if (!currentFlow) return 0;

    const stepOrder: CameraFlowStep[] = [
      'capture',
      'processing',
      'review',
      'verification',
      'report',
    ];
    const currentIndex = stepOrder.indexOf(currentFlow.currentStep);
    return ((currentIndex + 1) / stepOrder.length) * 100;
  }, [flowContext.state.activeFlow]);

  const getOverallProgress = useCallback((): number => {
    const stepProgress = getStepProgress();
    const processingProgress = ocrProcessingContext.state.totalProgress;

    // If we're in processing step, use processing progress
    if (flowContext.state.activeFlow?.currentStep === 'processing') {
      return processingProgress;
    }

    return stepProgress;
  }, [getStepProgress, ocrProcessingContext.state.totalProgress, flowContext.state.activeFlow]);

  const canProceedToNext = useCallback((): boolean => {
    const currentFlow = flowContext.state.activeFlow;
    if (!currentFlow) return false;

    switch (currentFlow.currentStep) {
      case 'capture':
        return !!currentFlow.imageUri;
      case 'processing':
        return !!currentFlow.ocrResult && ocrProcessingContext.state.isCompleted;
      case 'review':
        return !!currentFlow.ocrResult;
      case 'verification':
        return receiptDraftContext.state.isValid && !receiptDraftContext.state.isDirty;
      case 'report':
        return false; // Last step
      default:
        return false;
    }
  }, [
    flowContext.state.activeFlow,
    ocrProcessingContext.state.isCompleted,
    receiptDraftContext.state,
  ]);

  return {
    // Flow state
    hasActiveFlow: flowContext.state.hasActiveFlow,
    currentFlow: flowContext.state.activeFlow,
    currentStep: flowContext.state.activeFlow?.currentStep || 'capture',
    flowId: flowContext.state.activeFlow?.id,
    canNavigateBack: flowContext.state.canNavigateBack,
    canNavigateForward: flowContext.state.canNavigateForward,
    isNavigationBlocked: flowContext.state.navigationBlocked,
    blockReason: flowContext.state.blockReason,

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
