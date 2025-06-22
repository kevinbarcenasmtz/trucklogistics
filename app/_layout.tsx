// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from "expo-router";
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { AuthProvider } from '@/src/context/AuthContext';
import { StatusBar } from "expo-status-bar";
import { View, Platform } from "react-native";
import { getThemeStyles } from "@/src/theme";
import 'react-native-gesture-handler';

// Import i18n config to initialize it
import '@/src/i18n';
import '../src/config/firebase';

// Theme-aware stack navigator
function ThemedStack(): JSX.Element {
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  // Get appropriate background color based on theme
  const getBackgroundColor = () => isDarkTheme 
    ? themeStyles.colors.black_grey 
    : themeStyles.colors.background;
    
  // Get appropriate text color based on theme
  const getTextColor = () => isDarkTheme 
    ? themeStyles.colors.white 
    : themeStyles.colors.text.primary;

  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: getBackgroundColor()
      }}
    >
      <StatusBar 
        style={isDarkTheme ? "light" : "dark"} 
        backgroundColor={Platform.OS === 'android' ? getBackgroundColor() : 'transparent'}
        translucent={Platform.OS === 'android'}
      />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: getBackgroundColor(),
          },
          headerTintColor: getTextColor(),
          contentStyle: {
            backgroundColor: getBackgroundColor(),
          },
          headerShown: false,
          animation: Platform.OS === 'ios' ? 'default' : 'fade_from_bottom',
          gestureEnabled: true,
          ...Platform.select({
            ios: {
              cardShadowEnabled: false,
            },
            android: {
              animationEnabled: true,
            },
          }),
        }}
      />
    </View>
  );
}

// Root layout with providers
export default function RootLayout(): JSX.Element {
  // Initialize any app-wide services here
  useEffect(() => {
    // App initialization logic
    console.log('App initialized');
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedStack />
      </AuthProvider>
    </ThemeProvider>
  );
}