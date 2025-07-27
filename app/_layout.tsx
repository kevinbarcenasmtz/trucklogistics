// app/_layout.tsx
import { AuthProvider } from '@/src/context/AuthContextMigration';
import { OCRProcessingProvider } from '@/src/context/OCRProcessingContext';
import { ReceiptDraftProvider } from '@/src/context/ReceiptDraftContext';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import '@/src/i18n';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import 'react-native-gesture-handler';
import '../src/config/firebaseMigration';

// Theme-aware stack navigator
function ThemedStack(): JSX.Element {
  const { isDarkTheme, backgroundColor, textColor } = useAppTheme();

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

// Root layout with providers (no ThemeProvider needed)
export default function RootLayout(): JSX.Element {
  // Initialize any app-wide services here
  useEffect(() => {
    // App initialization logic
    console.log('App initialized');
  }, []);

  return (
    <AuthProvider>
      <OCRProcessingProvider>
        <ReceiptDraftProvider>
          <ThemedStack />
        </ReceiptDraftProvider>
      </OCRProcessingProvider>
    </AuthProvider>
  );
}
