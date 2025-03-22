// app/(app)/settings/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from "@/src/theme";

export default function SettingsLayout() {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: themeStyles.colors.black_grey },
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