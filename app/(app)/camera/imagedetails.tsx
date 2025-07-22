// app/(app)/camera/imagedetails.tsx

import CameraWorkflowCoordinator from '@/src/components/camera/workflow/CameraWorkflowCoordinator';
import { useCameraFlow } from '@/src/hooks/useCameraFlow';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler } from 'react-native';

/**
 * Image Details Screen - Processing and Review steps
 * Updated for Phase 3: Uses flow store, no JSON parsing
 */
export default function ImageDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get flow management from camera flow hook
  const { hasActiveFlow, currentFlow, currentStep } = useCameraFlow();

  // Extract flowId from params
  const paramFlowId = typeof params.flowId === 'string' ? params.flowId : undefined;

  // Use ref to track if we've already shown an error
  const hasShownError = useRef(false);

  /**
   * Validate navigation and flow state
   */
  useEffect(() => {
    // Log navigation event
    if (__DEV__) {
      console.log('[ImageDetails] Screen mounted', {
        paramFlowId,
        hasActiveFlow,
        currentFlowId: currentFlow?.id,
        currentStep,
      });
    }

    // Add a delay before validation to allow state to sync
    const validationTimer = setTimeout(() => {
      // Only validate if we still don't have a flow after delay
      if (!hasActiveFlow || !currentFlow) {
        if (!hasShownError.current) {
          hasShownError.current = true;
          console.warn('[ImageDetails] No active flow found after delay, redirecting to capture');
          Alert.alert(
            t('error.title', 'Session Lost'),
            t('error.noActiveFlow', 'Your session has expired. Please start over.'),
            [
              {
                text: t('common.ok', 'OK'),
                onPress: () => router.replace('/camera'),
              },
            ]
          );
        }
        return;
      }

      // Validate flow ID matches
      if (paramFlowId && currentFlow.id !== paramFlowId) {
        if (!hasShownError.current) {
          hasShownError.current = true;
          console.warn('[ImageDetails] Flow ID mismatch', {
            paramFlowId,
            currentFlowId: currentFlow.id,
          });
          Alert.alert(
            t('error.title', 'Session Error'),
            t('error.flowMismatch', 'Session mismatch detected. Please start over.'),
            [
              {
                text: t('common.ok', 'OK'),
                onPress: () => router.replace('/camera'),
              },
            ]
          );
        }
        return;
      }

      // Validate required data exists
      if (!currentFlow.imageUri) {
        if (!hasShownError.current) {
          hasShownError.current = true;
          console.error('[ImageDetails] No image URI in flow');
          Alert.alert(
            t('error.title', 'Missing Data'),
            t('error.missingImage', 'No image found. Please capture an image first.'),
            [
              {
                text: t('common.ok', 'OK'),
                onPress: () => router.replace('/camera'),
              },
            ]
          );
        }
        return;
      }

      // For review step, validate OCR result exists
      if (currentStep === 'review' && !currentFlow.ocrResult) {
        if (!hasShownError.current) {
          hasShownError.current = true;
          console.error('[ImageDetails] No OCR result for review step');
          Alert.alert(
            t('error.title', 'Processing Error'),
            t('error.missingOcrResult', 'No processing results found. Please try again.'),
            [
              {
                text: t('common.ok', 'OK'),
                onPress: () => router.replace('/camera'),
              },
            ]
          );
        }
        return;
      }

      // Reset error flag when validation passes
      hasShownError.current = false;
    }, 300); // Give time for state to sync

    return () => clearTimeout(validationTimer);
  }, [paramFlowId, hasActiveFlow, currentFlow, currentStep, t, router]);

  /**
   * Handle hardware back button (Android)
   */
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Let the coordinator handle back navigation
      return false; // Allow coordinator to handle
    });

    return () => backHandler.remove();
  }, []);

  // Early return if no valid flow (will show loading or redirect in useEffect)
  if (!hasActiveFlow || !currentFlow) {
    return null;
  }

  // Development logging
  if (__DEV__) {
    console.log('[ImageDetails] Render state:', {
      currentStep,
      hasImage: !!currentFlow.imageUri,
      hasOcrResult: !!currentFlow.ocrResult,
      flowId: currentFlow.id,
    });
  }

  return <CameraWorkflowCoordinator flowId={currentFlow.id} />;
}