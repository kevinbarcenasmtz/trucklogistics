globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
// app/index.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { getThemeStyles } from "@/src/theme";

export default function Index(): JSX.Element {
  const { theme } = useTheme();
  const { user, loading: authContextLoading } = useAuth();
  const themeStyles = getThemeStyles(theme);
  
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [isLanguageSelected, setIsLanguageSelected] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAppStatus = async () => {
      try {
        // Check onboarding, language and authentication status
        const [onboardingValue, languageValue, authValue] = await Promise.all([
          AsyncStorage.getItem("onboardingCompleted"),
          AsyncStorage.getItem("languageSelected"),
          AsyncStorage.getItem("auth_state")
        ]);
        
        setIsOnboardingCompleted(onboardingValue === "true");
        setIsLanguageSelected(languageValue === "true");
        setIsAuthenticated(authValue === "true");
      } catch (error) {
        console.error("Error checking app status:", error);
        setIsOnboardingCompleted(false);
        setIsLanguageSelected(false);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAppStatus();
  }, []);

  // Show loading indicator while checking statuses
  if (authContextLoading || loading) {
    return (
      <View style={[
        styles.container,
        { backgroundColor: themeStyles.colors.background }
      ]}>
        <ActivityIndicator size="large" color={themeStyles.colors.greenThemeColor} />
      </View>
    );
  }

  // If user exists from auth context, go straight to home screen
  if (user) {
    return <Redirect href="/(app)/home" />;
  }
  
  // If authenticated from AsyncStorage but no user yet, wait for auth context to load the user
  if (isAuthenticated) {
    return (
      <View style={[
        styles.container,
        { backgroundColor: themeStyles.colors.background }
      ]}>
        <ActivityIndicator size="large" color={themeStyles.colors.greenThemeColor} />
      </View>
    );
  }
  
  // Routing logic following the flow:
  // language screen → onboarding → login/signup → home app
  
  // Step 1: Check if language is selected
  if (!isLanguageSelected) {
    return <Redirect href="/(auth)/language" />;
  }
  
  // Step 2: Check if onboarding is completed
  if (!isOnboardingCompleted) {
    return <Redirect href="/(auth)/onboarding" />;
  }
  
  // Step 3: User is not authenticated, go to login
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});