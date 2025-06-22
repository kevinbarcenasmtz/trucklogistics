// src/onboarding/components/OnboardingStep.tsx
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import React from 'react';
import { OnboardingStepConfig, OnboardingStepProps } from '../types';
import { OnboardingLayout } from './OnboardingLayout';

interface Props {
  stepConfig: OnboardingStepConfig;
  context: OnboardingStepProps['context'];
  progress: OnboardingStepProps['progress'];
  onComplete: OnboardingStepProps['onComplete'];
  onSkip?: OnboardingStepProps['onSkip'];
  onBack?: OnboardingStepProps['onBack'];
  canGoBack: boolean;
  canSkip: boolean;
  stepIndex: number;
  totalSteps: number;
}

export const OnboardingStep: React.FC<Props> = ({
  stepConfig,
  stepIndex,
  totalSteps,
  ...stepProps
}) => {
  const StepComponent = stepConfig.component;

  return (
    <ErrorBoundary>
      <OnboardingLayout
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        showProgress={stepConfig.id !== 'welcome'} // Hide progress for welcome step
      >
        <StepComponent {...stepProps} stepIndex={stepIndex} totalSteps={totalSteps} />
      </OnboardingLayout>
    </ErrorBoundary>
  );
};
