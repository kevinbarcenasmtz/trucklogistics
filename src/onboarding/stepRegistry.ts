// src/onboarding/stepRegistry.ts
import { OnboardingStepConfig, OnboardingContext } from './types';
import { LanguageSelectionStep } from './steps/LanguageSelectionStep';
import { WelcomeStep } from './steps/WelcomeStep';
import { PermissionsStep } from './steps/PermissionsStep';

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 'language',
    component: LanguageSelectionStep,
    isRequired: true,
    shouldShow: () => true,
    analytics: 'onboarding_language_shown'
  },
  {
    id: 'welcome',
    component: WelcomeStep,
    isRequired: false,
    shouldShow: (ctx) => ctx.userType === 'new',
    analytics: 'onboarding_welcome_shown'
  },
//   {
//     id: 'permissions',
//     component: PermissionsStep,
//     isRequired: true,
//     shouldShow: () => true,
//     skipIf: (ctx) => ctx.deviceInfo.hasNotificationPermission && ctx.deviceInfo.hasLocationPermission,
//     analytics: 'onboarding_permissions_shown'
//   },
  // Future steps easily added here:
  // {
  //   id: 'driver_license',
  //   component: DriverLicenseStep,
  //   isRequired: true,
  //   shouldShow: (ctx) => ctx.userType === 'driver',
  //   analytics: 'onboarding_license_shown'
  // }
];

export const getAvailableSteps = (context: OnboardingContext): OnboardingStepConfig[] => {
  return ONBOARDING_STEPS.filter(step => 
    step.shouldShow(context) && !step.skipIf?.(context)
  );
};

export const isOnboardingComplete = (
  context: OnboardingContext, 
  completedSteps: string[]
): boolean => {
  const availableSteps = getAvailableSteps(context);
  const requiredSteps = availableSteps.filter(step => step.isRequired);
  
  return requiredSteps.every(step => completedSteps.includes(step.id));
};