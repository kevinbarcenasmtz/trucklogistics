// app/(auth)/language.tsx 
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from "@/src/theme";
import { useOnboardingStateMachine } from '@/src/hooks/useOnboardingStateMachine';
import { LanguageSelection } from '@/src/components/onboarding/LanguageSelection';

export default function LanguageScreen() {
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const { state, actions } = useOnboardingStateMachine();

  const getBackgroundColor = () => isDarkTheme 
    ? themeStyles.colors.black_grey 
    : themeStyles.colors.background;

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: getBackgroundColor() }
    ]}>
      <LanguageSelection
        selectedLanguage={state.selectedLanguage}
        onSelectLanguage={actions.selectLanguage}
        isLoading={state.isLoading}
        error={state.error}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});