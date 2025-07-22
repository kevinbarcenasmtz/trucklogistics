// src/components/camera/workflow/CameraNavigationGuard.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useCameraFlow } from '../../../store/cameraFlowStore';
import { CameraFlowStep } from '../../../types/cameraFlow';

interface NavigationGuardProps {
  targetStep: CameraFlowStep;
  children: React.ReactNode;
}

/**
 * Navigation Guard Component - Flow-based navigation only
 * Updated to be less aggressive about redirects
 */
export function CameraNavigationGuard({ targetStep, children }: NavigationGuardProps) {
  const router = useRouter();
  const { activeFlow, canNavigateToStep } = useCameraFlow();
  const hasChecked = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Reset check flag when target step changes
    hasChecked.current = false;
  }, [targetStep]);

  useEffect(() => {
    // Skip if already checked or component unmounted
    if (hasChecked.current || !isMounted.current) return;

    // Special case: capture step is always allowed
    if (targetStep === 'capture') return;

    // Give time for state to sync before checking
    const checkTimer = setTimeout(() => {
      if (!isMounted.current) return;

      // No active flow - must start from capture
      if (!activeFlow) {
        hasChecked.current = true;
        console.warn('[NavigationGuard] No active flow for step:', targetStep);
        // Don't redirect here - let the route component handle it
        return;
      }

      // Check if we can navigate to the target step
      if (!canNavigateToStep(targetStep)) {
        hasChecked.current = true;
        console.warn('[NavigationGuard] Cannot navigate to step:', targetStep);
        // Don't redirect here - let the route component handle it
        return;
      }
    }, 100); // Small delay to allow state to sync

    return () => clearTimeout(checkTimer);
  }, [targetStep, activeFlow, canNavigateToStep, router]);

  // Always render children - let route components handle validation
  return <>{children}</>;
}

/**
 * Hook for programmatic navigation with validation
 * Keep this for components that need to navigate programmatically
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