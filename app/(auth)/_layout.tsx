// app/(auth)/_layout.tsx - CLEANED UP VERSION
import { Stack } from "expo-router";
import { useEffect } from "react";
import { useAppTheme } from '@/src/hooks/useOnboardingTheme';
export default function AuthLayout() {
  const { backgroundColor } = useAppTheme();

  useEffect(() => {
    console.log("Auth layout mounted");
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