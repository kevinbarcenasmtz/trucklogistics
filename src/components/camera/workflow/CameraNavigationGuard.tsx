// src/components/camera/workflow/CameraNavigationGuard.tsx - Phase 3 Simplified
import { useRouter } from 'expo-router';
import React from 'react';
import { useCameraFlow } from '../../../store/cameraFlowStore';
import { CameraFlowStep } from '../../../types/cameraFlow';

interface NavigationGuardProps {
  targetStep: CameraFlowStep;
  children: React.ReactNode;
}

/**
 * Navigation Guard Component - Phase 3 User-Driven Navigation
 * Simplified to pure calculation - no useEffect, no timing dependencies
 */
export function CameraNavigationGuard({ targetStep, children }: NavigationGuardProps) {
  const { activeFlow, canNavigateToStep } = useCameraFlow();

  // Pure calculation - no useEffect or state watching
  const navigationState = calculateNavigationState(targetStep, activeFlow, canNavigateToStep);

  // Always render children - screens handle their own validation
  // This follows Phase 3 principle: UI reflects state, user drives navigation
  return <>{children}</>;
}

/**
 * Pure function - easy to test and reason about
 */
function calculateNavigationState(
  targetStep: CameraFlowStep,
  activeFlow: any,
  canNavigateToStep: (step: CameraFlowStep) => boolean
) {
  // Capture step is always allowed
  if (targetStep === 'capture') {
    return { shouldRedirect: false, reason: null };
  }

  // No active flow means user should start over
  if (!activeFlow) {
    console.warn('[NavigationGuard] No active flow for step:', targetStep);
    return { shouldRedirect: false, reason: 'No active flow' };
  }

  // Check business rules
  if (!canNavigateToStep(targetStep)) {
    console.warn('[NavigationGuard] Cannot navigate to step:', targetStep);
    return { shouldRedirect: false, reason: 'Navigation not allowed' };
  }

  return { shouldRedirect: false, reason: null };
}

/**
 * Hook for programmatic navigation with validation
 * Simplified for Phase 3 - user-driven navigation
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

    // Check if we have active flow
    if (!activeFlow) {
      console.warn('Cannot navigate without active flow');
      return false;
    }

    // Check business rules
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
