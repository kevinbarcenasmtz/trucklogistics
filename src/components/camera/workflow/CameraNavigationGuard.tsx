// src/components/camera/workflow/CameraNavigationGuard.tsx
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCameraFlow } from '../../../store/cameraFlowStore';
import { 
  CameraFlowStep, 
  NavigationGuardResult, 
  FlowTypeGuards,
  STEP_RELATIONSHIPS 
} from '../../../types/cameraFlow';

interface NavigationGuardProps {
  targetStep: CameraFlowStep;
  children: React.ReactNode;
  onNavigationBlocked?: (result: NavigationGuardResult) => void;
}

/**
 * Navigation Guard Component
 * Validates whether navigation to a specific step is allowed
 * Redirects or shows warnings for invalid navigation attempts
 */
export function CameraNavigationGuard({ 
  targetStep, 
  children, 
  onNavigationBlocked 
}: NavigationGuardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeFlow, canNavigateToStep, updateFlow } = useCameraFlow();

  useEffect(() => {
    const guardResult = validateNavigation(targetStep, activeFlow);
    
    if (!guardResult.allowed) {
      handleNavigationBlocked(guardResult);
      return;
    }

    // Navigation is allowed - update current step if needed
    if (activeFlow && activeFlow.currentStep !== targetStep) {
      updateFlow({ currentStep: targetStep });
    }
  }, [targetStep, activeFlow]);

  const validateNavigation = (
    step: CameraFlowStep, 
    flow: typeof activeFlow
  ): NavigationGuardResult => {
    // No active flow
    if (!flow) {
      if (step === 'capture') {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'No active camera flow',
        suggestedAction: {
          type: 'redirect',
          target: 'capture',
          message: t('navigationGuard.noActiveFlow', 'Please start a new camera session'),
        },
      };
    }

    // Check if step is reachable from current position
    if (!canNavigateToStep(step)) {
      const missingData = getMissingRequirements(step, flow);
      
      return {
        allowed: false,
        reason: `Missing required data: ${missingData.join(', ')}`,
        suggestedAction: {
          type: 'redirect',
          target: getRequiredStep(missingData[0]),
          message: t('navigationGuard.missingData', 'Please complete the previous steps first'),
        },
      };
    }

    // Check step-specific validations
    const stepValidation = validateStepSpecificRequirements(step, flow);
    if (!stepValidation.allowed) {
      return stepValidation;
    }

    // Check if coming from valid previous step
    const allowedFromSteps = STEP_RELATIONSHIPS[step].allowedFrom;
    if (allowedFromSteps.length > 0 && !allowedFromSteps.includes(flow.currentStep)) {
      // Allow if we've visited this step before (back navigation)
      if (!FlowTypeGuards.hasVisitedStep(flow, step)) {
        return {
          allowed: false,
          reason: `Cannot navigate from ${flow.currentStep} to ${step}`,
          suggestedAction: {
            type: 'redirect',
            target: allowedFromSteps[0],
            message: t('navigationGuard.invalidTransition', 'Invalid navigation path'),
          },
        };
      }
    }

    return { allowed: true };
  };

  const validateStepSpecificRequirements = (
    step: CameraFlowStep,
    flow: NonNullable<typeof activeFlow>
  ): NavigationGuardResult => {
    switch (step) {
      case 'capture':
        return { allowed: true };

      case 'processing':
        if (!FlowTypeGuards.hasImageUri(flow)) {
          return {
            allowed: false,
            reason: 'No image selected',
            suggestedAction: {
              type: 'redirect',
              target: 'capture',
              message: t('navigationGuard.noImage', 'Please select or capture an image first'),
            },
          };
        }
        return { allowed: true };

      case 'review':
        if (!FlowTypeGuards.hasOCRResult(flow)) {
          return {
            allowed: false,
            reason: 'OCR processing not completed',
            suggestedAction: {
              type: 'redirect',
              target: 'processing',
              message: t('navigationGuard.noOCRResult', 'Please wait for image processing to complete'),
            },
          };
        }
        return { allowed: true };

      case 'verification':
        if (!FlowTypeGuards.hasOCRResult(flow)) {
          return {
            allowed: false,
            reason: 'OCR processing not completed',
            suggestedAction: {
              type: 'redirect',
              target: 'processing',
              message: t('navigationGuard.noOCRResult', 'Please complete image processing first'),
            },
          };
        }
        return { allowed: true };

      case 'report':
        if (!FlowTypeGuards.hasReceiptDraft(flow)) {
          return {
            allowed: false,
            reason: 'Receipt data not verified',
            suggestedAction: {
              type: 'redirect',
              target: 'verification',
              message: t('navigationGuard.noReceiptData', 'Please verify receipt information first'),
            },
          };
        }
        return { allowed: true };

      default:
        return {
          allowed: false,
          reason: `Unknown step: ${step}`,
          suggestedAction: {
            type: 'cancel',
            message: t('navigationGuard.unknownStep', 'Invalid navigation target'),
          },
        };
    }
  };

  const getMissingRequirements = (
    step: CameraFlowStep,
    flow: NonNullable<typeof activeFlow>
  ): string[] => {
    const missing: string[] = [];

    switch (step) {
      case 'processing':
        if (!flow.imageUri) missing.push('imageUri');
        break;
      case 'review':
        if (!flow.imageUri) missing.push('imageUri');
        if (!flow.ocrResult) missing.push('ocrResult');
        break;
      case 'verification':
        if (!flow.imageUri) missing.push('imageUri');
        if (!flow.ocrResult) missing.push('ocrResult');
        break;
      case 'report':
        if (!flow.imageUri) missing.push('imageUri');
        if (!flow.receiptDraft) missing.push('receiptDraft');
        break;
    }

    return missing;
  };

  const getRequiredStep = (missingData: string): CameraFlowStep => {
    switch (missingData) {
      case 'imageUri':
        return 'capture';
      case 'ocrResult':
        return 'processing';
      case 'receiptDraft':
        return 'verification';
      default:
        return 'capture';
    }
  };

  const handleNavigationBlocked = (result: NavigationGuardResult) => {
    console.warn('Navigation blocked:', result);

    // Call optional callback
    onNavigationBlocked?.(result);

    const { suggestedAction } = result;
    if (!suggestedAction) return;

    switch (suggestedAction.type) {
      case 'redirect':
        if (suggestedAction.target) {
          Alert.alert(
            t('navigationGuard.redirectTitle', 'Navigation Required'),
            suggestedAction.message || result.reason,
            [
              {
                text: t('common.cancel', 'Cancel'),
                style: 'cancel',
                onPress: () => router.back(),
              },
              {
                text: t('common.continue', 'Continue'),
                onPress: () => {
                  // Use specific route paths that exist in the app
                  switch (suggestedAction.target) {
                    case 'capture':
                      router.replace('/camera');
                      break;
                    case 'processing':
                    case 'review':
                      router.replace('/camera/imagedetails');
                      break;
                    case 'verification':
                      router.replace('/camera/verification');
                      break;
                    case 'report':
                      router.replace('/camera/report');
                      break;
                    default:
                      router.replace('/camera');
                  }
                },
              },
            ]
          );
        }
        break;

      case 'retry':
        Alert.alert(
          t('navigationGuard.retryTitle', 'Retry Required'),
          suggestedAction.message || result.reason,
          [
            {
              text: t('common.cancel', 'Cancel'),
              style: 'cancel',
              onPress: () => router.back(),
            },
            {
              text: t('common.retry', 'Retry'),
              onPress: () => {
                // Navigate to appropriate step for retry
                const targetStep = suggestedAction.target || 'capture';
                switch (targetStep) {
                  case 'capture':
                    router.replace('/camera');
                    break;
                  case 'processing':
                  case 'review':
                    router.replace('/camera/imagedetails');
                    break;
                  case 'verification':
                    router.replace('/camera/verification');
                    break;
                  case 'report':
                    router.replace('/camera/report');
                    break;
                  default:
                    router.replace('/camera');
                }
              },
            },
          ]
        );
        break;

      case 'cancel':
        Alert.alert(
          t('navigationGuard.errorTitle', 'Navigation Error'),
          suggestedAction.message || result.reason,
          [
            {
              text: t('common.ok', 'OK'),
              onPress: () => router.replace('/camera'),
            },
          ]
        );
        break;
    }
  };

  // Only render children if navigation is allowed
  const guardResult = validateNavigation(targetStep, activeFlow);
  
  if (!guardResult.allowed) {
    // Return null - the useEffect will handle the blocking
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook for manual navigation validation
 * Useful for checking if navigation is possible before attempting it
 */
export function useNavigationValidation() {
  const { activeFlow, canNavigateToStep } = useCameraFlow();

  const validateNavigation = (targetStep: CameraFlowStep): NavigationGuardResult => {
    if (!activeFlow) {
      return {
        allowed: targetStep === 'capture',
        reason: targetStep !== 'capture' ? 'No active flow' : undefined,
      };
    }

    return {
      allowed: canNavigateToStep(targetStep),
      reason: canNavigateToStep(targetStep) ? undefined : 'Navigation requirements not met',
    };
  };

  const canNavigate = (targetStep: CameraFlowStep): boolean => {
    return validateNavigation(targetStep).allowed;
  };

  return {
    validateNavigation,
    canNavigate,
    activeFlow,
  };
}