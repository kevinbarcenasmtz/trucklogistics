// app/(app)/camera/index.tsx

import CameraWorkflowCoordinator from '@/src/components/camera/workflow/CameraWorkflowCoordinator';
import { useCameraFlow } from '@/src/hooks/useCameraFlow';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler } from 'react-native';

/**
 * Camera Index Screen - Entry point for camera workflow
 * Updated for Phase 3: Uses flow store instead of route params
 */
export default function CameraIndexScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get flow management from camera flow hook
  const { hasActiveFlow, currentFlow, currentStep, cancelFlow } = useCameraFlow();

  // Extract flowId from params if provided (for deep linking)
  const paramFlowId = typeof params.flowId === 'string' ? params.flowId : undefined;

  /**
   * Redirect to current step based on flow state
   */
  const redirectToCurrentStep = useCallback(() => {
    if (!hasActiveFlow || !currentFlow) return;

    const flowId = currentFlow.id;

    switch (currentStep) {
      case 'processing':
      case 'review':
        router.replace(`/camera/imagedetails?flowId=${flowId}`);
        break;
      case 'verification':
        router.replace(`/camera/verification?flowId=${flowId}`);
        break;
      case 'report':
        router.replace(`/camera/report?flowId=${flowId}`);
        break;
      default:
        // Stay on capture step
        break;
    }
  }, [hasActiveFlow, currentFlow, currentStep, router]);

  /**
   * Handle flow initialization on mount
   */
  useEffect(() => {
    // Log navigation event
    if (__DEV__) {
      console.log('[CameraIndex] Screen mounted', {
        paramFlowId,
        hasActiveFlow,
        currentFlowId: currentFlow?.id,
        currentStep,
      });
    }

    // If we have a flowId param but no active flow, this might be a deep link
    if (paramFlowId && !hasActiveFlow) {
      console.warn('[CameraIndex] FlowId provided but no active flow found. Starting fresh flow.');
      // For now, ignore the paramFlowId and start fresh
      // In the future, you could implement flow restoration here
    }

    // If we have an active flow but we're not on the capture step, redirect
    if (hasActiveFlow && currentStep !== 'capture') {
      console.log('[CameraIndex] Active flow detected, redirecting to current step:', currentStep);
      redirectToCurrentStep();
    }
  }, [paramFlowId, hasActiveFlow, currentStep, currentFlow?.id, redirectToCurrentStep]);

  /**
   * Handle hardware back button (Android)
   */
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (hasActiveFlow) {
        // Show confirmation dialog
        Alert.alert(
          t('camera.exitTitle', 'Exit Camera'),
          t(
            'camera.exitMessage',
            'Are you sure you want to exit? Any unsaved progress will be lost.'
          ),
          [
            {
              text: t('common.cancel', 'Cancel'),
              style: 'cancel',
            },
            {
              text: t('common.exit', 'Exit'),
              style: 'destructive',
              onPress: () => {
                cancelFlow('user_exit');
                router.replace('/home');
              },
            },
          ]
        );
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    });

    return () => backHandler.remove();
  }, [hasActiveFlow, t, cancelFlow, router]);

  /**
   * Handle app state changes (backgrounding/foregrounding)
   */
  useEffect(() => {
    // You could add app state change handling here
    // For example, pause/resume timers, save state, etc.
  }, []);

  // Development logging
  if (__DEV__) {
    console.log('[CameraIndex] Render state:', {
      hasActiveFlow,
      currentStep,
      flowId: currentFlow?.id,
    });
  }

  return <CameraWorkflowCoordinator flowId={currentFlow?.id || paramFlowId} />;
}
