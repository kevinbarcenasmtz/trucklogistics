// app/index.tsx
import { AppState, AppStateRenderer } from '@/src/components/app/AppStateRenderer';
import { useAuth } from '@/src/context/AuthContextMigration';
import { useAppStateMachine } from '@/src/state/appStateMachine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

// Remove the globalThis line and useEffect - we'll handle this differently later
// globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
globalThis.RNFB_MODULAR_DEPRECATION_STRICT_MODE = true;

export default function Index() {
  const { user } = useAuth();
  const { state } = useAppStateMachine();

  // Pure calculation - no useState or conditional logic needed
  const appState = calculateAppState(user, state);

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

  return <AppStateRenderer state={appState} />;
}

/**
 * Pure function to calculate app state
 * Easy to test and reason about
 */
const calculateAppState = (user: any, machineState: any): AppState => {
  // App is initializing
  if (machineState.type === 'initializing') {
    return { type: 'initializing' };
  }

  // Error state
  if (machineState.type === 'error') {
    return { type: 'error', error: machineState.error || 'Unknown error' };
  }

  // User is authenticated (prioritize auth context user)
  if (user || machineState.type === 'authenticated') {
    return { type: 'authenticated' };
  }

  // Onboarding needed
  if (machineState.type === 'onboarding') {
    return { type: 'onboarding' };
  }

  // Ready for authentication
  if (machineState.type === 'unauthenticated') {
    return { type: 'unauthenticated' };
  }

  // Fallback
  return { type: 'initializing' };
};
