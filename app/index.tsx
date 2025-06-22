// app/index.tsx
import React from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { Redirect } from "expo-router";
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { useAppStateMachine } from '@/src/state/appStateMachine';
import { getThemeStyles } from "@/src/theme";
import { OnboardingEngine } from '@/src/onboarding/OnboardingEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';

globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

export default function Index() {
  const { theme, isDarkTheme } = useTheme();
  const { user } = useAuth();
  const { state } = useAppStateMachine();
  const themeStyles = getThemeStyles(theme);

  React.useEffect(() => {
    if (__DEV__) {
      AsyncStorage.multiRemove([
        'onboarding_progress',
        'onboardingCompleted', 
        'languageSelected',
        'userLanguage'
      ]).then(() => {
        console.log('🔧 DEV: Cleared onboarding data for testing');
      });
    }
  }, []);
  

  const getBackgroundColor = () => isDarkTheme 
    ? themeStyles.colors.black_grey 
    : themeStyles.colors.background;

  const getTextColor = () => isDarkTheme 
    ? themeStyles.colors.white 
    : themeStyles.colors.text.primary;

    
  // App is initializing
  if (state.type === 'initializing') {
    return (
      <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
        <ActivityIndicator size="large" color={themeStyles.colors.greenThemeColor} />
      </View>
      
    );
  }

  // Error state
  if (state.type === 'error') {
    return (
      <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
        <Text style={[styles.errorText, { color: getTextColor() }]}>
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
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <ActivityIndicator size="large" color={themeStyles.colors.greenThemeColor} />
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});