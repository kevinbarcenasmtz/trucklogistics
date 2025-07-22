// app/(app)/camera/report.tsx

import CameraWorkflowCoordinator from '@/src/components/camera/workflow/CameraWorkflowCoordinator';
import { useCameraFlow } from '@/src/hooks/useCameraFlow';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler } from 'react-native';

/**
 * Report Screen - Receipt completion and report display
 * Updated for Phase 3: Uses flow state only, no JSON parsing
 */
export default function ReportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get flow management from camera flow hook
  const { hasActiveFlow, currentFlow, currentStep, completeFlow } = useCameraFlow();

  // Extract flowId from params
  const paramFlowId = typeof params.flowId === 'string' ? params.flowId : undefined;

  // Use ref to track if we've already shown an error
  const hasShownError = useRef(false);

  /**
   * Handle completion and navigation
   */
  const handleWorkflowComplete = useCallback(async () => {
    try {
      const result = await completeFlow();

      if (result.success) {
        // Navigate to home or receipts list
        router.replace('/home');
      } else {
        throw new Error(result.error || 'Failed to complete workflow');
      }
    } catch (error) {
      console.error('[Report] Failed to complete workflow:', error);
      Alert.alert(
        t('error.title', 'Completion Error'),
        t('error.completionFailed', 'Failed to complete the receipt process. Please try again.'),
        [
          {
            text: t('common.ok', 'OK'),
          },
        ]
      );
    }
  }, [completeFlow, router, t]);

  /**
   * Validate navigation and flow state
   */
  useEffect(() => {
    // Log navigation event
    if (__DEV__) {
      console.log('[Report] Screen mounted', {
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
          console.warn('[Report] No active flow found after delay, redirecting to capture');
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
          console.warn('[Report] Flow ID mismatch', {
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
          console.error('[Report] No image URI in flow');
          Alert.alert(
            t('error.title', 'Missing Data'),
            t('error.missingImage', 'No image found. Please start over.'),
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

      if (!currentFlow.ocrResult) {
        if (!hasShownError.current) {
          hasShownError.current = true;
          console.error('[Report] No OCR result in flow');
          Alert.alert(
            t('error.title', 'Missing Data'),
            t('error.missingOcrResult', 'No processing results found. Please start over.'),
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

      if (!currentFlow.receiptDraft) {
        if (!hasShownError.current) {
          hasShownError.current = true;
          console.error('[Report] No receipt draft in flow');
          Alert.alert(
            t('error.title', 'Missing Data'),
            t('error.missingDraft', 'No receipt data found. Please complete verification first.'),
            [
              {
                text: t('common.ok', 'OK'),
                onPress: () => router.replace(`/camera/verification?flowId=${currentFlow.id}`),
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
      // Show confirmation for leaving completed report
      Alert.alert(
        t('report.exitTitle', 'Exit Report'),
        t('report.exitMessage', 'Are you sure you want to leave? The receipt has been processed.'),
        [
          {
            text: t('common.cancel', 'Cancel'),
            style: 'cancel',
          },
          {
            text: t('common.exit', 'Exit'),
            onPress: handleWorkflowComplete,
          },
        ]
      );
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [t, handleWorkflowComplete]);

  // Early return if no valid flow (will show loading or redirect in useEffect)
  if (!hasActiveFlow || !currentFlow) {
    return null;
  }

  // Development logging
  if (__DEV__) {
    console.log('[Report] Render state:', {
      currentStep,
      hasImage: !!currentFlow.imageUri,
      hasOcrResult: !!currentFlow.ocrResult,
      hasDraft: !!currentFlow.receiptDraft,
      flowId: currentFlow.id,
    });
  }

  return <CameraWorkflowCoordinator flowId={currentFlow.id} />;
}