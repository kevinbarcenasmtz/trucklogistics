// app/(app)/settings/_layout.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  const { screenBackground } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: screenBackground },
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
