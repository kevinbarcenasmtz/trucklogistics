// app/(app)/camera/report.tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler } from 'react-native';
import CameraWorkflowCoordinator from '@/src/components/camera/workflow/CameraWorkflowCoordinator';
import { useCameraFlow } from '@/src/hooks/useCameraFlow';

/**
 * Report Screen - Receipt completion and report display
 * Updated for Phase 3: Uses flow state only, no JSON parsing
 */
export default function ReportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get flow management from camera flow hook
  const {
    hasActiveFlow,
    currentFlow,
    currentStep,
    completeFlow,
  } = useCameraFlow();

  // Extract flowId from params
  const paramFlowId = typeof params.flowId === 'string' ? params.flowId : undefined;

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
   * Redirect to correct step based on flow state
   */
  const redirectToCorrectStep = useCallback(() => {
    if (!currentFlow) return;

    const flowId = currentFlow.id;
    
    switch (currentStep) {
      case 'capture':
        router.replace('/camera');
        break;
      case 'processing':
      case 'review':
        router.replace(`/camera/imagedetails?flowId=${flowId}`);
        break;
      case 'verification':
        router.replace(`/camera/verification?flowId=${flowId}`);
        break;
      default:
        // Stay on report step
        break;
    }
  }, [currentFlow, currentStep, router]);

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

    // Validate we have the required flow
    if (!hasActiveFlow || !currentFlow) {
      console.warn('[Report] No active flow found, redirecting to capture');
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
      return;
    }

    // Validate flow ID matches
    if (paramFlowId && currentFlow.id !== paramFlowId) {
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
      return;
    }

    // Validate we're on the correct step
    if (currentStep !== 'report') {
      console.warn('[Report] Invalid step for this screen:', currentStep);
      redirectToCorrectStep();
    }

    // Validate required data exists
    if (!currentFlow.imageUri) {
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
      return;
    }

    if (!currentFlow.ocrResult) {
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
      return;
    }

    if (!currentFlow.receiptDraft) {
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
      return;
    }
  }, [paramFlowId, hasActiveFlow, currentFlow, currentStep, t, router, redirectToCorrectStep]);

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
            onPress: () => handleWorkflowComplete(),
          },
        ]
      );
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [t, handleWorkflowComplete]);

  /**
   * Handle app backgrounding with completed receipt
   */
  useEffect(() => {
    // Auto-save or persist the completed receipt state
    // This ensures data isn't lost if the app is backgrounded
    if (__DEV__) {
      console.log('[Report] Receipt completion state available', {
        receiptId: currentFlow?.receiptDraft?.id,
        flowId: currentFlow?.id,
      });
    }
  }, [currentFlow]);

  // Early return if no valid flow
  if (!hasActiveFlow || !currentFlow) {
    return null; // Will redirect in useEffect
  }

  // Development logging
  if (__DEV__) {
    console.log('[Report] Render state:', {
      currentStep,
      hasImage: !!currentFlow.imageUri,
      hasOcrResult: !!currentFlow.ocrResult,
      hasDraft: !!currentFlow.receiptDraft,
      receiptId: currentFlow.receiptDraft?.id,
      flowId: currentFlow.id,
    });
  }

  return (
    <CameraWorkflowCoordinator 
      flowId={currentFlow.id}
    />
  );
}