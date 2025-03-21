import React, { useEffect } from 'react';
import { Stack } from "expo-router";
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { AuthProvider } from '@/src/context/AuthContext';
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { getThemeStyles } from "@/src/theme";

// Import i18n config to initialize it
import '@/src/i18n';

import '../src/config/firebase';

// Theme-aware stack navigator
function ThemedStack(): JSX.Element {
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  return (
    <View style={{ flex: 1, backgroundColor: themeStyles.colors.background }}>
      <StatusBar style={isDarkTheme ? "light" : "dark"} />
      <Stack
      
        screenOptions={{
          headerStyle: {
            backgroundColor: themeStyles.colors.background,
          },
          headerTintColor: themeStyles.colors.text.primary,
          contentStyle: {
            backgroundColor: themeStyles.colors.background,
          },
          headerShown: false,
        }}
      />
    </View>
  );
}

// Root layout with providers
export default function RootLayout(): JSX.Element {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedStack />
      </AuthProvider>
    </ThemeProvider>
  );
}