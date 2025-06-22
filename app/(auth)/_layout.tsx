// app/(auth)/_layout.tsx
import { Stack } from "expo-router";
import { useEffect } from "react";
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from "@/src/theme";

export default function AuthLayout() {
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  // Get background color based on theme
  const getBackgroundColor = () => isDarkTheme 
    ? themeStyles.colors.black_grey 
    : themeStyles.colors.background;

  useEffect(() => {
    console.log("Auth layout mounted");
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: getBackgroundColor() },
      }}
    >
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