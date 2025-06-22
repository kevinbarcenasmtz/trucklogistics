// app/(app)/settings/_layout.tsx - CLEANED UP VERSION
import { Stack } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useOnboardingTheme';

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
          presentation: 'modal'
        }}
      />
    </Stack>
  );
}