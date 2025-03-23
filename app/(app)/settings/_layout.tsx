// app/(app)/settings/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from "@/src/theme";

export default function SettingsLayout() {
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  // Get background color based on theme
  const getBackgroundColor = () => isDarkTheme 
    ? themeStyles.colors.black_grey 
    : themeStyles.colors.background;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: getBackgroundColor() },
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