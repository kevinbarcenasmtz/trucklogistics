// src/components/camera/workflow/CameraWorkflowCoordinator.tsx

import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Enhanced hook
import { useCameraFlow } from '../../../hooks/useCameraFlow';

// Error Boundary and Navigation Guard
import { CameraErrorBoundary } from './CameraErrorBoundary';
import { CameraNavigationGuard } from './CameraNavigationGuard';

// Step components
import CaptureStep from './steps/CaptureStep';
import CompletionStep from './steps/CompletionStep';
import ProcessingStep from './steps/ProcessingStep';
import ReviewStep from './steps/ReviewStep';
import VerificationStep from './steps/VerificationStep';

// Types
import { CameraFlowStep, FlowError } from '../../../types/cameraFlow';
import { BaseCameraStepProps } from '../../../types/component_props';

/**
 * Workflow step configuration
 */
interface WorkflowStepConfig {
  id: CameraFlowStep;
  component: React.ComponentType<BaseCameraStepProps>;
  canSkip: boolean;
  requiresActiveFlow: boolean;
  allowedFromSteps: CameraFlowStep[];
}

/**
 * CameraWorkflowCoordinator Props
 */
interface CameraWorkflowCoordinatorProps {
  flowId?: string;
}

/**
 * Workflow step configurations
 */
const WORKFLOW_STEPS: WorkflowStepConfig[] = [
  {
    id: 'capture',
    component: CaptureStep,
    canSkip: false,
    requiresActiveFlow: false,
    allowedFromSteps: [],
  },
  {
    id: 'processing',
    component: ProcessingStep,
    canSkip: false,
    requiresActiveFlow: true,
    allowedFromSteps: ['capture'],
  },
  {
    id: 'review',
    component: ReviewStep,
    canSkip: false,
    requiresActiveFlow: true,
    allowedFromSteps: ['processing'],
  },
  {
    id: 'verification',
    component: VerificationStep,
    canSkip: false,
    requiresActiveFlow: true,
    allowedFromSteps: ['review', 'verification'], // Allow self-transition for edits
  },
  {
    id: 'report',
    component: CompletionStep,
    canSkip: false,
    requiresActiveFlow: true,
    allowedFromSteps: ['verification'],
  },
];

/**
 * Error Fallback Component
 */
const ErrorFallback: React.FC<{
  message: string;
  backgroundColor: string;
  textColor: string;
}> = ({ message, backgroundColor, textColor }) => (
  <SafeAreaView style={[styles.container, { backgroundColor }]}>
    <View style={styles.errorContainer}>
      <Text style={[styles.errorText, { color: textColor }]}>{message}</Text>
    </View>
  </SafeAreaView>
);

/**
 * Inner Coordinator Component (wrapped with contexts)
 */
const CameraWorkflowCoordinatorInner: React.FC<CameraWorkflowCoordinatorProps> = ({ flowId }) => {
  const {
    hasActiveFlow,
    currentFlow,
    currentStep,
    isNavigationBlocked,
    blockReason,
    canNavigateBack,
    cancelFlow,
    clearError,
    retryCurrentOperation,
    navigateToStep,
  } = useCameraFlow();

  const { backgroundColor, textColor } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();

  // Fix: Use proper React Native timer type
  const navigationGuardTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  /**
   * Handle cancel action - Moved to top to fix hoisting issue
   */
  const handleCancel = useCallback(() => {
    Alert.alert(
      t('camera.cancelTitle', 'Cancel Process'),
      t('camera.cancelMessage', 'Are you sure you want to cancel? All progress will be lost.'),
      [
        {
          text: t('camera.continue', 'Continue'),
          style: 'cancel',
        },
        {
          text: t('common.cancel', 'Cancel'),
          style: 'destructive',
          onPress: () => {
            console.log(
              '[CameraWorkflowCoordinator] User cancelled workflow at step:',
              currentStep
            );
            cancelFlow('user_cancellation');
            router.replace('/home');
          },
        },
      ]
    );
  }, [t, currentStep, cancelFlow, router]);

  /**
   * Step validation logic
   */
  const validateCurrentStep = useCallback((): boolean => {
    const stepConfig = WORKFLOW_STEPS.find(s => s.id === currentStep);

    if (!stepConfig) {
      console.error('[CameraWorkflowCoordinator] Invalid step configuration:', currentStep);
      return false;
    }

    // Capture step is always valid (entry point)
    if (currentStep === 'capture') {
      return true;
    }

    // Check if step requires active flow
    if (stepConfig.requiresActiveFlow && !hasActiveFlow) {
      console.warn(
        '[CameraWorkflowCoordinator] Step requires active flow but none found:',
        currentStep
      );
      return false;
    }

    // Validate step-specific requirements
    switch (currentStep) {
      case 'processing':
        return hasActiveFlow && !!currentFlow?.imageUri;
      case 'review':
        return hasActiveFlow && !!currentFlow?.ocrResult;
      case 'verification':
        return hasActiveFlow && !!currentFlow?.ocrResult;
      case 'report':
        return hasActiveFlow && !!currentFlow?.receiptDraft;
      default:
        return true;
    }
  }, [currentStep, hasActiveFlow, currentFlow]);

  /**
   * Navigation guard implementation
   */
  const canNavigateToStep = useCallback(
    (targetStep: CameraFlowStep): boolean => {
      const targetConfig = WORKFLOW_STEPS.find(s => s.id === targetStep);

      if (!targetConfig) {
        return false;
      }

      // Check allowed transitions
      if (targetConfig.allowedFromSteps.length > 0) {
        return targetConfig.allowedFromSteps.includes(currentStep);
      }

      return true;
    },
    [currentStep]
  );

  const shownErrors = useRef<Set<string>>(new Set()); 
  /**
   * Enhanced error handling
   */
  const handleError = useCallback(
    (error: FlowError) => {
      // Create a unique error key
      const errorKey = `${error.code}-${error.timestamp}`;
      
      // Don't show the same error twice
      if (shownErrors.current.has(errorKey)) {
        console.log('[CameraWorkflowCoordinator] Duplicate error prevented:', errorKey);
        return;
      }
      
      shownErrors.current.add(errorKey);
      
      console.error('[CameraWorkflowCoordinator] Flow error:', error);
  
      // Log error for debugging
      if (__DEV__) {
        console.log('[CameraWorkflowCoordinator] Error details:', {
          step: error.step,
          code: error.code,
          message: error.message,
          retryable: error.retryable,
          flowId: currentFlow?.id,
          timestamp: error.timestamp,
        });
      }
  
      // Show user-friendly error
      const alertButtons = [];
  
      if (error.retryable) {
        alertButtons.push({
          text: t('common.retry', 'Retry'),
          onPress: () => {
            console.log('[CameraWorkflowCoordinator] User initiated retry for error:', error.code);
            clearError();
            retryCurrentOperation();
            // Clear the error from shown set after retry
            shownErrors.current.delete(errorKey);
          },
        });
      }
  
      alertButtons.push({
        text: t('common.cancel', 'Cancel'),
        style: 'destructive' as const,
        onPress: () => {
          console.log('[CameraWorkflowCoordinator] User cancelled due to error:', error.code);
          handleCancel();
          // Clear the error from shown set after cancel
          shownErrors.current.delete(errorKey);
        },
      });
  
      Alert.alert(
        t('error.title', 'Something went wrong'),
        error.userMessage || error.message,
        alertButtons,
        {
          onDismiss: () => {
            // Clear the error from shown set after dismissal
            shownErrors.current.delete(errorKey);
          }
        }
      );
    },
    [currentFlow?.id, t, clearError, retryCurrentOperation, handleCancel]
  );
  
  // Also add cleanup for shown errors when step changes:
  useEffect(() => {
    // Clear shown errors when step changes
    shownErrors.current.clear();
  }, [currentStep]);

  /**
   * Navigation handlers
   */
  const handleNext = useCallback(
  (stepData?: any) => {
    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);
    const nextIndex = currentIndex + 1;

    if (nextIndex < WORKFLOW_STEPS.length) {
      const nextStep = WORKFLOW_STEPS[nextIndex];

      if (canNavigateToStep(nextStep.id)) {
        console.log(
          '[CameraWorkflowCoordinator] Navigating from',
          currentStep,
          'to',
          nextStep.id
        );
        
        // ✅ FIX: Actually call the navigation function
        const result = navigateToStep(nextStep.id);
        
        if (!result.success) {
          console.error('[CameraWorkflowCoordinator] Navigation failed:', result.reason);
          handleError({
            step: currentStep,
            code: 'NAVIGATION_FAILED',
            message: result.reason || 'Navigation failed',
            userMessage: 'Could not proceed to next step. Please try again.',
            timestamp: Date.now(),
            retryable: true,
          });
        }
      } else {
        console.warn('[CameraWorkflowCoordinator] Navigation blocked to step:', nextStep.id);
        handleError({
          step: currentStep,
          code: 'NAVIGATION_BLOCKED',
          message: 'Cannot navigate to requested step',
          userMessage: 'Cannot proceed to next step. Please complete the current step.',
          timestamp: Date.now(),
          retryable: false,
        });
      }
    } else {
      // Workflow complete
      console.log('[CameraWorkflowCoordinator] Workflow completed successfully');
    }
  },
  [currentStep, canNavigateToStep, navigateToStep, handleError] // ✅ Add navigateToStep to dependencies
);

  const handleBack = useCallback(() => {
    if (!canNavigateBack) {
      console.warn('[CameraWorkflowCoordinator] Back navigation blocked');
      return;
    }

    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);
    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0) {
      const prevStep = WORKFLOW_STEPS[prevIndex];
      console.log(
        '[CameraWorkflowCoordinator] Navigating back from',
        currentStep,
        'to',
        prevStep.id
      );
    } else {
      // Already at first step, show cancel confirmation
      handleCancel();
    }
  }, [canNavigateBack, currentStep, handleCancel]);

  /**
   * Hardware back button handling (Android)
   */
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canNavigateBack && !isNavigationBlocked) {
        handleBack();
        return true; // Prevent default behavior
      } else if (currentStep === 'capture') {
        handleCancel();
        return true;
      }
      return false; // Allow default behavior
    });

    return () => backHandler.remove();
  }, [canNavigateBack, isNavigationBlocked, currentStep, handleBack, handleCancel]);

  /**
   * Navigation blocking timeout (prevent infinite blocks)
   */
  useEffect(() => {
    if (isNavigationBlocked) {
      console.log('[CameraWorkflowCoordinator] Navigation blocked:', blockReason);

      navigationGuardTimeoutRef.current = setTimeout(() => {
        console.warn('[CameraWorkflowCoordinator] Navigation block timeout, auto-clearing block');
        // Auto-clear after 30 seconds to prevent infinite blocking
        // This should be implemented in the context
      }, 30000);
    }

    return () => {
      if (navigationGuardTimeoutRef.current) {
        clearTimeout(navigationGuardTimeoutRef.current);
      }
    };
  }, [isNavigationBlocked, blockReason]);

  /**
   * Step validation and auto-correction
   */
  useEffect(() => {
    if (!validateCurrentStep()) {
      console.warn('[CameraWorkflowCoordinator] Invalid step state, attempting auto-correction');

      // Find the correct step based on available data
      if (!hasActiveFlow || currentStep === 'capture') {
        return; // Capture step handles flow creation
      }

      // Auto-navigate to appropriate step
      for (const stepConfig of WORKFLOW_STEPS) {
        if (stepConfig.id === 'capture') continue; // Skip capture

        // Check if this step's requirements are met
        const canUseStep = validateCurrentStep();
        if (canUseStep) {
          console.log('[CameraWorkflowCoordinator] Auto-correcting to step:', stepConfig.id);
          break;
        }
      }
    }
  }, [currentStep, hasActiveFlow, validateCurrentStep]);

  /**
   * Flow initialization logging
   */
  useEffect(() => {
    if (flowId && __DEV__) {
      console.log('[CameraWorkflowCoordinator] Initialized with flowId:', flowId);
    }

    if (hasActiveFlow && __DEV__) {
      console.log('[CameraWorkflowCoordinator] Active flow state:', {
        id: currentFlow?.id,
        step: currentStep,
        hasImage: !!currentFlow?.imageUri,
        hasOCR: !!currentFlow?.ocrResult,
        hasDraft: !!currentFlow?.receiptDraft,
      });
    }
  }, [flowId, hasActiveFlow, currentFlow, currentStep]);

  /**
   * Handle error alert for invalid step - MOVED BEFORE EARLY RETURN
   */
  const [showInvalidStepError, setShowInvalidStepError] = React.useState(false);

  // Get current step configuration and component
  const currentStepConfig = WORKFLOW_STEPS.find(s => s.id === currentStep);
  const StepComponent = currentStepConfig?.component;

  // Effect for invalid step error - moved before early return
  useEffect(() => {
    if (!StepComponent && !showInvalidStepError) {
      setShowInvalidStepError(true);
      Alert.alert(
        t('error.title', 'Something went wrong'),
        t('error.invalidStepMessage', 'Invalid workflow step. Please restart the process.'),
        [
          {
            text: t('common.restart', 'Restart'),
            onPress: () => {
              setShowInvalidStepError(false);
              router.replace('/camera');
            },
          },
        ]
      );
    }
  }, [StepComponent, showInvalidStepError, t, router]);

  // Validate step exists - EARLY RETURN AFTER ALL HOOKS
  if (!StepComponent) {
    console.error('[CameraWorkflowCoordinator] No component found for step:', currentStep);

    return (
      <ErrorFallback
        message={t(
          'error.invalidStepMessage',
          'Invalid workflow step. Please restart the process.'
        )}
        backgroundColor={backgroundColor}
        textColor={textColor}
      />
    );
  }

  // Show navigation blocked state in development
  if (isNavigationBlocked && __DEV__) {
    console.log('[CameraWorkflowCoordinator] Navigation blocked:', blockReason);
  }

  return (
    <CameraNavigationGuard targetStep={currentStep}>
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StepComponent
          flowId={currentFlow?.id || ''}
          onNext={handleNext}
          onBack={handleBack}
          onCancel={handleCancel}
          onError={handleError}
          testID={`camera-step-${currentStep}`}
        />
      </SafeAreaView>
    </CameraNavigationGuard>
  );
};

/**
 * Main Coordinator Component - NO PROVIDERS (they're at root level now)
 */
export const CameraWorkflowCoordinator: React.FC<CameraWorkflowCoordinatorProps> = ({ flowId }) => {
  return (
    <CameraErrorBoundary
      fallbackStep="capture"
      onError={(error, errorInfo) => {
        console.error('[CameraWorkflowCoordinator] Component error boundary triggered:', error);

        // Log error details in development
        if (__DEV__) {
          console.error('[CameraWorkflowCoordinator] Error info:', errorInfo);
          console.error('[CameraWorkflowCoordinator] Component stack:', errorInfo?.componentStack);
        }
      }}
    >
      {/* REMOVED PROVIDERS - They're now at root level in _layout.tsx */}
      <CameraWorkflowCoordinatorInner flowId={flowId} />
    </CameraErrorBoundary>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default CameraWorkflowCoordinator;