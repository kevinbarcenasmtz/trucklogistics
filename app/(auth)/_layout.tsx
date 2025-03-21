import { Stack } from "expo-router";
import { useEffect } from "react";

export default function AuthLayout() {
  useEffect(() => {
    console.log("Auth layout mounted");
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="language" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="onboarding" 
        options={{
          headerShown: false,
        }}
      />
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