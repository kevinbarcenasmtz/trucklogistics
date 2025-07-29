// app/(auth)/_layout.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { getBackground } = useAppTheme();
  const backgroundColor = getBackground('screen');

  useEffect(() => {
    console.log('Auth layout mounted');
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
