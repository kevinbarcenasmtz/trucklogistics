// app/index.tsx
import { useAuth } from '@/src/context/AuthContext';
import { useAppTheme } from '@/src/hooks/useOnboardingTheme'; // ✅ NEW IMPORT
import { OnboardingEngine } from '@/src/onboarding/OnboardingEngine';
import { useAppStateMachine } from '@/src/state/appStateMachine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

export default function Index() {
  const { user } = useAuth();
  const { state } = useAppStateMachine();
  const { backgroundColor, textColor, themeStyles } = useAppTheme();

  React.useEffect(() => {
    if (__DEV__) {
      AsyncStorage.multiRemove([
        'onboarding_progress',
        'onboardingCompleted',
        'languageSelected',
        'userLanguage',
        'trucklogistics_theme',
      ]).then(() => {
        console.log('🔧 DEV: Cleared onboarding data + theme for testing');
      });
    }
  }, []);

  // App is initializing
  if (state.type === 'initializing') {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={themeStyles.colors.greenThemeColor} />
      </View>
    );
  }

  // Error state
  if (state.type === 'error') {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.errorText, { color: textColor }]}>
          Something went wrong. Please restart the app.
        </Text>
      </View>
    );
  }

  // User is authenticated (prioritize auth context user)
  if (user || state.type === 'authenticated') {
    return <Redirect href="/(app)/home" />;
  }

  // Onboarding needed
  if (state.type === 'onboarding') {
    return <OnboardingEngine />;
  }

  // Ready for authentication
  if (state.type === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  // Fallback
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ActivityIndicator size="large" color={themeStyles.colors.greenThemeColor} />
    </View>
  );
}

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
