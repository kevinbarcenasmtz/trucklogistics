// app/_layout.tsx
import { AuthProvider } from '@/src/context/AuthContextMigration';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import 'react-native-gesture-handler';
// Import i18n config to initialize it
import '@/src/i18n';
import '../src/config/firebaseOld';

// Theme-aware stack navigator
function ThemedStack(): JSX.Element {
  const { isDarkTheme } = useTheme();
  const { backgroundColor, textColor } = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor,
      }}
    >
      <StatusBar
        style={isDarkTheme ? 'light' : 'dark'}
        backgroundColor={Platform.OS === 'android' ? backgroundColor : 'transparent'}
        translucent={Platform.OS === 'android'}
      />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor,
          },
          headerTintColor: textColor,
          contentStyle: {
            backgroundColor,
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
