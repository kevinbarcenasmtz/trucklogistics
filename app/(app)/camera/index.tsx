// app/(app)/camera/index.tsx

import CameraWorkflowCoordinator from '@/src/components/camera/workflow/CameraWorkflowCoordinator';
import { useCameraFlow } from '@/src/hooks/useCameraFlow';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
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

    // REMOVED: The problematic redirect logic
    // The coordinator and useCameraFlow handle navigation now
  }, [paramFlowId, hasActiveFlow, currentStep, currentFlow?.id]);


  useEffect(() => {
    console.log('[CameraRoute] Route mounted/changed:', {
      route: 'index', // or 'imagedetails' 
      params,
      hasActiveFlow,
      currentStep,
      timestamp: new Date().toISOString()
    });
  
    return () => {
      console.log('[CameraRoute] Route unmounting:', {
        route: 'index', // or 'imagedetails'
        timestamp: new Date().toISOString()
      });
    };
  }, [params, hasActiveFlow, currentStep]);
  
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