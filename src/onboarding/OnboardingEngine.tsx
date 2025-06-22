// src/onboarding/OnboardingEngine.tsx
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from '@/src/theme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAppStateMachine } from '../state/appStateMachine';
import { OnboardingStep } from './components/OnboardingStep';
import { getAvailableSteps } from './stepRegistry';

export const OnboardingEngine: React.FC = () => {
  const { state, completeOnboardingStep, goBackToStep, completeOnboarding } = useAppStateMachine();
  const { completeOnboarding: authCompleteOnboarding } = useAuth();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  if (state.type !== 'onboarding') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeStyles.colors.background }]}>
        <ActivityIndicator size="large" color={themeStyles.colors.greenThemeColor} />
      </View>
    );
  }

  const { context, progress } = state;
  const availableSteps = getAvailableSteps(context);

  // Find current step
  const currentStep = availableSteps.find(step => !progress.completedSteps.includes(step.id));

  if (!currentStep) {
    // Call state machine completion WITH callback to AuthContext
    completeOnboarding(() => {
      authCompleteOnboarding(); // This handles navigation
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
      goBackToStep(prevStep.id);
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
