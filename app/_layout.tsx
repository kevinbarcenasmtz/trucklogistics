// app/_layout.tsx
import { AuthProvider } from '@/src/context/AuthContextMigration';
import { OCRProcessingProvider } from '@/src/context/OCRProcessingContext';
import { ReceiptDraftProvider } from '@/src/context/ReceiptDraftContext';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import 'react-native-gesture-handler';
// Import i18n config to initialize it
import '@/src/i18n';
import '../src/config/firebaseMigration';

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

// Root layout with providers - Phase 3 Update
export default function RootLayout(): JSX.Element {
  // Initialize any app-wide services here
  useEffect(() => {
    // App initialization logic
    console.log('App initialized');
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        {/* ✅ REMOVED: CameraFlowProvider - Using Zustand store instead */}
        <OCRProcessingProvider>
          <ReceiptDraftProvider>
            <ThemedStack />
          </ReceiptDraftProvider>
        </OCRProcessingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}