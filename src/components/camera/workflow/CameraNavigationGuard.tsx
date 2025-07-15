// src/components/camera/workflow/CameraNavigationGuard.tsx
import React, { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useCameraFlow } from '../../../store/cameraFlowStore';
import { CameraFlowStep } from '../../../types/cameraFlow';

interface NavigationGuardProps {
  targetStep: CameraFlowStep;
  children: React.ReactNode;
}

/**
 * Navigation Guard Component - Flow-based navigation only
 * No legacy support - requires active flow for all steps except capture
 */
export function CameraNavigationGuard({ 
  targetStep,
  children 
}: NavigationGuardProps) {
  const router = useRouter();
  const { activeFlow, canNavigateToStep } = useCameraFlow();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Reset redirect flag when target step changes
    hasRedirected.current = false;
  }, [targetStep]);

  useEffect(() => {
    // Skip if already redirected to prevent loops
    if (hasRedirected.current) return;

    // Special case: capture step is always allowed
    if (targetStep === 'capture') return;

    // No active flow - must start from capture
    if (!activeFlow) {
      hasRedirected.current = true;
      setTimeout(() => router.replace('/camera'), 0);
      return;
    }

    // Check if we can navigate to the target step
    if (!canNavigateToStep(targetStep)) {
      hasRedirected.current = true;
      
      // Determine appropriate redirect based on flow state
      setTimeout(() => {
        switch (targetStep) {
          case 'processing':
          case 'review':
            // Need image first
            if (!activeFlow.imageUri) {
              router.replace('/camera');
            } else {
              // Stay on current step
              router.back();
            }
            break;
            
          case 'verification':
            // Need OCR result
            if (!activeFlow.imageUri) {
              router.replace('/camera');
            } else if (!activeFlow.ocrResult) {
              router.replace('/camera/imagedetails');
            } else {
              router.back();
            }
            break;
            
          case 'report':
            // Need verified receipt
            if (!activeFlow.receiptDraft) {
              if (!activeFlow.imageUri) {
                router.replace('/camera');
              } else if (!activeFlow.ocrResult) {
                router.replace('/camera/imagedetails');
              } else {
                router.replace('/camera/verification');
              }
            } else {
              router.back();
            }
            break;
            
          default:
            router.replace('/camera');
        }
      }, 0);
      return;
    }
  }, [targetStep, activeFlow, canNavigateToStep, router]);

  // Don't render children if navigation is not allowed
  if (targetStep !== 'capture' && (!activeFlow || !canNavigateToStep(targetStep))) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook for programmatic navigation with validation
 */
export function useGuardedNavigation() {
  const router = useRouter();
  const { activeFlow, canNavigateToStep } = useCameraFlow();

  const navigateToStep = (step: CameraFlowStep) => {
    // Always allow navigation to capture
    if (step === 'capture') {
      router.push('/camera');
      return true;
    }

    // Require active flow for other steps
    if (!activeFlow) {
      console.warn('Cannot navigate without active flow');
      router.replace('/camera');
      return false;
    }

    // Check if navigation is allowed
    if (!canNavigateToStep(step)) {
      console.warn(`Cannot navigate to ${step} - requirements not met`);
      return false;
    }

    // Navigate to the appropriate route
    switch (step) {
      case 'processing':
      case 'review':
        router.push(`/camera/imagedetails?flowId=${activeFlow.id}`);
        break;
      case 'verification':
        router.push(`/camera/verification?flowId=${activeFlow.id}`);
        break;
      case 'report':
        router.push(`/camera/report?flowId=${activeFlow.id}`);
        break;
    }
    
    return true;
  };

  return { navigateToStep, canNavigateToStep, activeFlow };
}