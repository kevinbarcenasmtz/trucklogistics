// src/components/app/AppStateRenderer.tsx
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { OnboardingEngine } from '../../onboarding/OnboardingEngine';

// Define the possible app states
export type AppState =
  | { type: 'initializing' }
  | { type: 'error'; error: string }
  | { type: 'authenticated' }
  | { type: 'onboarding' }
  | { type: 'unauthenticated' };

interface AppStateRendererProps {
  state: AppState;
}

export const AppStateRenderer = ({ state }: AppStateRendererProps) => {
  switch (state.type) {
    case 'initializing':
      return <InitializingView />;
    case 'error':
      return <ErrorView error={state.error} />;
    case 'authenticated':
      return <Redirect href="/(app)/home" />;
    case 'onboarding':
      return <OnboardingEngine />;
    case 'unauthenticated':
      return <Redirect href="/(auth)/login" />;
    default:
      return <InitializingView />;
  }
};

// Individual state components - clean abstractions
const InitializingView = () => {
  const { backgroundColor, primaryColor } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ActivityIndicator size="large" color={primaryColor} />
    </View>
  );
};

const ErrorView = ({ error }: { error: string }) => {
  const { backgroundColor, textColor } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.errorText, { color: textColor }]}>
        Something went wrong. Please restart the app.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
