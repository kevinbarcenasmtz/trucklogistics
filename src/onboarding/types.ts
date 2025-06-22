// src/onboarding/types.ts
export type Language = 'en' | 'es';

export interface OnboardingContext {
  userType: 'new' | 'returning';
  selectedLanguage: Language | null;
  deviceInfo: {
    platform: 'ios' | 'android';
    hasNotificationPermission: boolean;
    hasLocationPermission: boolean;
  };
  experiments?: string[];
}

export interface OnboardingProgress {
  completedSteps: string[];
  currentStepIndex: number;
  startedAt: string;
  lastActiveAt: string;
  data: Record<string, any>;
}

export interface OnboardingStepConfig {
  id: string;
  component: React.ComponentType<OnboardingStepProps>;
  isRequired: boolean;
  shouldShow: (context: OnboardingContext) => boolean;
  skipIf?: (context: OnboardingContext) => boolean;
  analytics?: string;
}

export interface OnboardingStepProps {
  context: OnboardingContext;
  progress: OnboardingProgress;
  onComplete: (data?: any) => void;
  onSkip?: () => void;
  onBack?: () => void;
  canGoBack: boolean;
  canSkip: boolean;
  stepIndex: number;
  totalSteps: number;
}
