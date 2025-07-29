// src/onboarding/OnboardingEngine.tsx
import { useAuth } from '@/src/context/AuthContextMigration';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAppStateMachine } from '../state/appStateMachine';
import { OnboardingStep } from './components/OnboardingStep';
import { getAvailableSteps } from './stepRegistry';

export const OnboardingEngine: React.FC = () => {
  const { state, completeOnboardingStep, goBackToStep, completeOnboarding } = useAppStateMachine();
  const { completeOnboarding: authCompleteOnboarding } = useAuth();
  const { screenBackground, primary } = useAppTheme();

  if (state.type !== 'onboarding') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: screenBackground }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  const { context, progress } = state;
  const availableSteps = getAvailableSteps(context);

  // Find current step
  const currentStep = availableSteps.find(step => !progress.completedSteps.includes(step.id));

  if (!currentStep) {
    completeOnboarding(() => {
      authCompleteOnboarding();
    });
    return null;
  }

  const stepIndex = availableSteps.indexOf(currentStep);
  const canGoBack = stepIndex > 0;
  const canSkip = !currentStep.isRequired;

  const handleStepComplete = (data?: any) => {
    completeOnboardingStep(currentStep.id, data);
  };

  const handleSkip = () => {
    completeOnboardingStep(currentStep.id, { skipped: true });
  };

  const handleBack = () => {
    if (canGoBack) {
      const prevStep = availableSteps[stepIndex - 1];
      if (prevStep) {
        goBackToStep(prevStep.id);
      }
    }
  };

  return (
    <View style={styles.container}>
      <OnboardingStep
        stepConfig={currentStep}
        context={context}
        progress={progress}
        onComplete={handleStepComplete}
        onSkip={canSkip ? handleSkip : undefined}
        onBack={canGoBack ? handleBack : undefined}
        canGoBack={canGoBack}
        canSkip={canSkip}
        stepIndex={stepIndex}
        totalSteps={availableSteps.length}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
