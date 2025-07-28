// src/components/camera/workflow/CameraWorkflowCoordinator.tsx

import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCameraFlow } from '../../../hooks/useCameraFlow';
import { CameraErrorBoundary } from './CameraErrorBoundary';
import { CameraNavigationGuard } from './CameraNavigationGuard';

import CaptureStep from './steps/CaptureStep';
import CompletionStep from './steps/CompletionStep';
import ProcessingStep from './steps/ProcessingStep';
import ReviewStep from './steps/ReviewStep';
import VerificationStep from './steps/VerificationStep';

import { CameraFlowStep } from '../../../types/cameraFlow';
import { BaseCameraStepProps } from '../../../types/component_props';

interface WorkflowStepConfig {
  id: CameraFlowStep;
  component: React.ComponentType<BaseCameraStepProps>;
  canSkip: boolean;
  requiresActiveFlow: boolean;
  allowedFromSteps: CameraFlowStep[];
}

interface CameraWorkflowCoordinatorProps {
  flowId?: string;
}

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
    allowedFromSteps: ['capture', 'review'],
  },
  {
    id: 'review',
    component: ReviewStep,
    canSkip: false,
    requiresActiveFlow: true,
    allowedFromSteps: ['processing', 'verification'],
  },
  {
    id: 'verification',
    component: VerificationStep,
    canSkip: false,
    requiresActiveFlow: true,
    allowedFromSteps: ['review'],
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
 * Pure functions for step validation - no useCallback needed
 */
const validateStepRequirements = (
  step: CameraFlowStep,
  hasActiveFlow: boolean,
  currentFlow: any
): boolean => {
  const stepConfig = WORKFLOW_STEPS.find(s => s.id === step);

  if (!stepConfig) return false;
  if (step === 'capture') return true;
  if (stepConfig.requiresActiveFlow && !hasActiveFlow) return false;

  switch (step) {
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
};

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
 * Step Error Handler Component - extracted from complex logic
 */
const StepErrorHandler: React.FC<{
  currentStep: CameraFlowStep;
  hasActiveFlow: boolean;
  currentFlow: any; // Add this prop
  onRestart: () => void;
}> = ({ currentStep, hasActiveFlow, currentFlow, onRestart }) => {
  const { t } = useTranslation();

  const shouldShowError = useMemo(() => {
    if (currentStep === 'capture') return false;
    // Pass the actual currentFlow instead of null
    return !validateStepRequirements(currentStep, hasActiveFlow, currentFlow);
  }, [currentStep, hasActiveFlow, currentFlow]);

  if (shouldShowError) {
    // Show error immediately - no useEffect needed
    Alert.alert(
      t('error.title', 'Something went wrong'),
      t('error.invalidStepMessage', 'Invalid workflow step. Please restart the process.'),
      [
        {
          text: t('common.restart', 'Restart'),
          onPress: onRestart,
        },
      ]
    );
  }

  return null;
};
/**
 * Hardware Back Button Handler - extracted component
 */
const HardwareBackHandler: React.FC<{
  canNavigateBack: boolean;
  isNavigationBlocked: boolean;
  currentStep: CameraFlowStep;
  onBack: () => void;
  onCancel: () => void;
}> = ({ canNavigateBack, isNavigationBlocked, currentStep, onBack, onCancel }) => {
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canNavigateBack && !isNavigationBlocked) {
        onBack();
        return true;
      } else if (currentStep === 'capture') {
        onCancel();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [canNavigateBack, isNavigationBlocked, currentStep, onBack, onCancel]);

  return null;
};

/**
 * Inner Coordinator Component - simplified with store-only rendering
 */
const CameraWorkflowCoordinatorInner: React.FC<CameraWorkflowCoordinatorProps> = ({ flowId }) => {
  const {
    hasActiveFlow,
    currentFlow,
    currentStep,
    isNavigationBlocked,
    canNavigateBack,
    cancelFlow,
    navigateBack,
  } = useCameraFlow();

  const { backgroundColor } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();

  // Computed values instead of useState/useEffect
  const currentStepConfig = useMemo(
    () => WORKFLOW_STEPS.find(s => s.id === currentStep),
    [currentStep]
  );

  const StepComponent = currentStepConfig?.component;

  // Simplified handlers - components manage their own navigation now
  const handleCancel = useCallback(() => {
    Alert.alert(
      t('camera.cancelTitle', 'Cancel Process'),
      t('camera.cancelMessage', 'Are you sure you want to cancel? All progress will be lost.'),
      [
        { text: t('common.no', 'No'), style: 'cancel' },
        { 
          text: t('common.yes', 'Yes'), 
          style: 'destructive',
          onPress: () => cancelFlow('user_cancelled')
        }
      ]
    );
  }, [cancelFlow, t]);

  const handleBack = useCallback(() => {
    if (canNavigateBack) {
      navigateBack();
    }
  }, [canNavigateBack, navigateBack]);

  const handleRestart = useCallback(() => {
    router.replace('/camera');
  }, [router]);

  // Development logging - explicit function call, not useEffect
  if (__DEV__ && flowId) {
    console.log('[CameraWorkflowCoordinator] Initialized with flowId:', flowId);
  }

  if (__DEV__ && hasActiveFlow) {
    console.log('[CameraWorkflowCoordinator] Active flow state:', {
      id: currentFlow?.id,
      step: currentStep,
      hasImage: !!currentFlow?.imageUri,
      hasOCR: !!currentFlow?.ocrResult,
      hasDraft: !!currentFlow?.receiptDraft,
    });
  }

  // Early return for invalid step - no useState needed
  if (!StepComponent) {
    return (
      <ErrorFallback
        message={t(
          'error.invalidStepMessage',
          'Invalid workflow step. Please restart the process.'
        )}
        backgroundColor={backgroundColor}
        textColor={'#000000'}
      />
    );
  }

  return (
    <>
      <StepErrorHandler
        currentStep={currentStep}
        hasActiveFlow={hasActiveFlow}
        currentFlow={currentFlow}
        onRestart={handleRestart}
      />
      <HardwareBackHandler
        canNavigateBack={canNavigateBack}
        isNavigationBlocked={isNavigationBlocked}
        currentStep={currentStep}
        onBack={handleBack}
        onCancel={handleCancel}
      />
      <CameraNavigationGuard targetStep={currentStep}>
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
          <StepComponent
            flowId={currentFlow?.id || ''}
            testID={`camera-step-${currentStep}`}
          />
        </SafeAreaView>
      </CameraNavigationGuard>
    </>
  );
};

/**
 * Main Coordinator Component
 */
export const CameraWorkflowCoordinator: React.FC<CameraWorkflowCoordinatorProps> = ({ flowId }) => {
  return (
    <CameraErrorBoundary
      fallbackStep="capture"
      onError={(error, errorInfo) => {
        console.error('[CameraWorkflowCoordinator] Component error boundary triggered:', error);

        if (__DEV__) {
          console.error('[CameraWorkflowCoordinator] Error info:', errorInfo);
          console.error('[CameraWorkflowCoordinator] Component stack:', errorInfo?.componentStack);
        }
      }}
    >
      <CameraWorkflowCoordinatorInner flowId={flowId} />
    </CameraErrorBoundary>
  );
};

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