// app/(app)/settings/_layout.tsx - CLEANED UP VERSION
import { useAppTheme } from '@/src/hooks/useOnboardingTheme';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  const { backgroundColor } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
