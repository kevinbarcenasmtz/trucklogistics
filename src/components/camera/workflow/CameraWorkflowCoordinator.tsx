import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { useCameraFlow } from '../../../store/cameraFlowStore';
import { CameraErrorBoundary } from './CameraErrorBoundary';
import { CameraNavigationGuard } from './CameraNavigationGuard';
import { FlowError, WorkflowStep } from './types';

// Import all step components
import CaptureStep from './steps/CaptureStep';
import CompletionStep from './steps/CompletionStep';
import ProcessingStep from './steps/ProcessingStep';
import ReviewStep from './steps/ReviewStep';
import VerificationStep from './steps/VerificationStep';

interface CameraWorkflowCoordinatorProps {
  flowId?: string;
}

export const CameraWorkflowCoordinator: React.FC<CameraWorkflowCoordinatorProps> = ({ flowId }) => {
const { activeFlow, updateFlow, cancelFlow } = useCameraFlow();
  const { backgroundColor } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();

  // Workflow configuration
  const WORKFLOW_STEPS: WorkflowStep[] = [
    {
      id: 'capture',
      component: CaptureStep,
      canSkip: false,
      validation: () => true,
    },
    {
      id: 'processing',
      component: ProcessingStep,
      canSkip: false,
      validation: f => !!f.imageUri,
    },
    {
      id: 'review',
      component: ReviewStep,
      canSkip: false,
      validation: f => !!f.ocrResult,
    },
    {
      id: 'verification',
      component: VerificationStep,
      canSkip: false,
      validation: f => !!f.ocrResult,
    },
    {
      id: 'report',
      component: CompletionStep,
      canSkip: false,
      validation: f => !!f.receiptDraft,
    },
  ];

  // Initialize flow if needed
  useEffect(() => {
    if (flowId && (!activeFlow || activeFlow.id !== flowId)) {
      // Flow ID provided but no matching active flow - this might be invalid
      console.warn('Flow ID provided but no matching active flow found:', flowId);
    }

    // If no active flow and no flowId, we should be in capture step
    if (!activeFlow && !flowId) {
      // This is a fresh start - let the capture step handle flow creation
      console.log('Fresh workflow start - no active flow');
    }
  }, [flowId, activeFlow]);

  // Determine current step
  const currentStep = activeFlow?.currentStep || 'capture';
  const currentStepConfig = WORKFLOW_STEPS.find(s => s.id === currentStep);
  const StepComponent = currentStepConfig?.component;

  // Validate current step
  const isStepValid =
    currentStepConfig && activeFlow
      ? currentStepConfig.validation(activeFlow)
      : currentStep === 'capture'; // Capture step is always valid to start

  // Navigation handlers
  const handleNext = (data?: Partial<import('@/src/types/cameraFlow').CameraFlow>) => {
    if (data) {
      updateFlow(data);
    }

    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);
    const nextIndex = currentIndex + 1;

    if (nextIndex < WORKFLOW_STEPS.length) {
      const nextStep = WORKFLOW_STEPS[nextIndex];
      updateFlow({ currentStep: nextStep.id });
    } else {
      // Workflow complete
      console.log('Workflow completed');
    }
  };

  const handleBack = () => {
    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);
    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0) {
      const prevStep = WORKFLOW_STEPS[prevIndex];
      updateFlow({ currentStep: prevStep.id });
    } else {
      // Already at first step, cancel the flow
      handleCancel();
    }
  };

  const handleCancel = () => {
    Alert.alert(
      t('camera.cancelTitle', 'Cancel Process'),
      t('camera.cancelMessage', 'Are you sure you want to cancel? All progress will be lost.'),
      [
        { text: t('camera.continue', 'Continue'), style: 'cancel' },
        {
          text: t('common.cancel', 'Cancel'),
          style: 'destructive',
          onPress: () => {
            cancelFlow();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleError = (error: FlowError) => {
    console.error('Workflow error:', error);

    // Create complete FlowError for flow store
    const completeError: import('@/src/types/cameraFlow').FlowError = {
      step: error.step,
      code: error.code,
      message: error.message,
      userMessage: error.message, // Use same message as user message
      timestamp: Date.now(),
      retryable: error.retry || false,
    };

    // Update flow with error
    updateFlow({ lastError: completeError });

    // Show user-friendly error
    Alert.alert(t('error.title', 'Something went wrong'), error.message, [
      ...(error.retry
        ? [
            {
              text: t('common.retry', 'Retry'),
              onPress: () => {
                // Clear error and retry current step
                updateFlow({ lastError: undefined });
              },
            },
          ]
        : []),
      {
        text: t('common.cancel', 'Cancel'),
        style: 'destructive',
        onPress: handleCancel,
      },
    ]);
  };

  // Handle invalid step state
  if (!isStepValid && currentStep !== 'capture') {
    console.warn('Invalid step state, redirecting to appropriate step');

    // Find the earliest valid step
    for (const step of WORKFLOW_STEPS) {
      if (step.validation(activeFlow || ({} as any))) {
        updateFlow({ currentStep: step.id });
        break;
      }
    }

    // If no valid step found, go back to capture
    if (!WORKFLOW_STEPS.some(s => s.validation(activeFlow || ({} as any)))) {
      updateFlow({ currentStep: 'capture' });
    }

    return <View style={[styles.container, { backgroundColor }]} />;
  }

  // Render step component if available
  if (!StepComponent) {
    console.error('No component found for step:', currentStep);
    return <View style={[styles.container, { backgroundColor }]} />;
  }

  return (
    <CameraErrorBoundary
      fallbackStep={currentStep}
      onError={(error, errorInfo) => {
        handleError({
          code: 'COMPONENT_ERROR',
          message: 'A component error occurred',
          step: currentStep,
          retry: true,
        });
      }}
    >
      <CameraNavigationGuard targetStep={currentStep}>
        <View style={[styles.container, { backgroundColor }]}>
          <StepComponent
            flowId={activeFlow?.id || ''}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
            onError={handleError}
          />
        </View>
      </CameraNavigationGuard>
    </CameraErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CameraWorkflowCoordinator;
