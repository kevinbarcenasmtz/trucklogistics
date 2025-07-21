// app/(app)/camera/verification.tsx

import CameraWorkflowCoordinator from '@/src/components/camera/workflow/CameraWorkflowCoordinator';
import { useCameraFlow } from '@/src/hooks/useCameraFlow';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler } from 'react-native';

/**
 * Verification Screen - Receipt data verification and editing
 * Updated for Phase 3: Uses flow store, no params handling
 */
export default function VerificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get flow management from camera flow hook
  const { hasActiveFlow, currentFlow, currentStep, isDraftDirty } = useCameraFlow();

  // Extract flowId from params
  const paramFlowId = typeof params.flowId === 'string' ? params.flowId : undefined;

  /**
   * Redirect to correct step based on flow state
   */
  // const redirectToCorrectStep = useCallback(() => {
  //   if (!currentFlow) return;

  //   const flowId = currentFlow.id;

  //   switch (currentStep) {
  //     case 'capture':
  //       router.replace('/camera');
  //       break;
  //     case 'processing':
  //     case 'review':
  //       router.replace(`/camera/imagedetails?flowId=${flowId}`);
  //       break;
  //     case 'report':
  //       router.replace(`/camera/report?flowId=${flowId}`);
  //       break;
  //     default:
  //       // Stay on verification step
  //       break;
  //   }
  // }, [currentFlow, currentStep, router]);

  /**
   * Handle unsaved changes warning
   */
  const handleUnsavedChangesWarning = useCallback(
    (onConfirm: () => void) => {
      if (isDraftDirty) {
        Alert.alert(
          t('verification.unsavedChangesTitle', 'Unsaved Changes'),
          t(
            'verification.unsavedChangesMessage',
            'You have unsaved changes. Are you sure you want to leave?'
          ),
          [
            {
              text: t('common.cancel', 'Cancel'),
              style: 'cancel',
            },
            {
              text: t('verification.discardChanges', 'Discard Changes'),
              style: 'destructive',
              onPress: onConfirm,
            },
          ]
        );
      } else {
        onConfirm();
      }
    },
    [isDraftDirty, t]
  );

  /**
   * Validate navigation and flow state
   */
  useEffect(() => {
    // Log navigation event
    if (__DEV__) {
      console.log('[Verification] Screen mounted', {
        paramFlowId,
        hasActiveFlow,
        currentFlowId: currentFlow?.id,
        currentStep,
        isDraftDirty,
      });
    }

    // Validate we have the required flow
    if (!hasActiveFlow || !currentFlow) {
      console.warn('[Verification] No active flow found, redirecting to capture');
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
      console.warn('[Verification] Flow ID mismatch', {
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
    // if (currentStep !== 'verification') {
    //   console.warn('[Verification] Invalid step for this screen:', currentStep);
    //   redirectToCorrectStep();
    // }

    // Validate required data exists
    if (!currentFlow.imageUri) {
      console.error('[Verification] No image URI in flow');
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
      console.error('[Verification] No OCR result in flow');
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
  }, [
    paramFlowId,
    hasActiveFlow,
    currentFlow,
    currentStep,
    isDraftDirty,
    t,
    router,
    // redirectToCorrectStep,
  ]);

  /**
   * Handle hardware back button (Android)
   */
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isDraftDirty) {
        handleUnsavedChangesWarning(() => {
          // Let coordinator handle back navigation
        });
        return true; // Prevent default back behavior
      }
      return false; // Allow coordinator to handle
    });

    return () => backHandler.remove();
  }, [isDraftDirty, handleUnsavedChangesWarning]);

  /**
   * Handle navigation away from screen
   */
  useEffect(() => {
    return () => {
      // Cleanup any verification-specific state if needed
      if (__DEV__) {
        console.log('[Verification] Screen unmounting', {
          isDraftDirty,
          flowId: currentFlow?.id,
        });
      }
    };
  }, [isDraftDirty, currentFlow?.id]);

  // Early return if no valid flow
  if (!hasActiveFlow || !currentFlow) {
    return null; // Will redirect in useEffect
  }

  // Development logging
  if (__DEV__) {
    console.log('[Verification] Render state:', {
      currentStep,
      hasImage: !!currentFlow.imageUri,
      hasOcrResult: !!currentFlow.ocrResult,
      hasDraft: !!currentFlow.receiptDraft,
      isDraftDirty,
      flowId: currentFlow.id,
    });
  }

  return <CameraWorkflowCoordinator flowId={currentFlow.id} />;
}
