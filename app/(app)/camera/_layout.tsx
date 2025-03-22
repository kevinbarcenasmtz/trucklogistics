// app/(app)/camera/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from '@/src/theme';

export default function CameraLayout() {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: themeStyles.colors.black_grey }
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="imagedetails" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="report" />
    </Stack>
  );
}