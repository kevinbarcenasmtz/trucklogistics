// src/components/onboarding/OnboardingFlow.tsx
import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from '@/src/theme';
import { useOnboardingStateMachine } from '@/src/hooks/useOnboardingStateMachine';
import { LanguageSelection } from './LanguageSelection';
import { ErrorBoundary } from '../ErrorBoundary';

export const OnboardingFlow: React.FC = () => {
  const router = useRouter();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  const { state, actions } = useOnboardingStateMachine();

  const getBackgroundColor = () => isDarkTheme 
    ? themeStyles.colors.black_grey 
    : themeStyles.colors.background;

  const renderCurrentStep = () => {
    switch (state.step) {
      case 'language':
        return (
          <LanguageSelection
            selectedLanguage={state.selectedLanguage}
            onSelectLanguage={actions.selectLanguage}
            isLoading={state.isLoading}
            error={state.error}
          />
        );
      
      // Remove the custom slides - let the library handle onboarding
      case 'intro':
      case 'features':
      case 'permissions':
        // Navigate to the library-based onboarding
        router.replace('/(auth)/onboarding');
        return null;
      
      case 'complete':
        return null;
      
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
        {renderCurrentStep()}
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});