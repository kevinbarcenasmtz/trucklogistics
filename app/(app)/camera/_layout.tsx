// app/(app)/camera/_layout.tsx
import { useAppTheme } from '@/src/hooks/useOnboardingTheme';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function CameraLayout() {
  const { backgroundColor } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
        animation: Platform.OS === 'ios' ? 'default' : 'fade_from_bottom',
        gestureEnabled: true,
        ...Platform.select({
          ios: {
            presentation: 'modal',
            cardShadowEnabled: true,
          },
          android: {
            animationEnabled: true,
          },
        }),
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="imagedetails" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="report" />
    </Stack>
  );
}
