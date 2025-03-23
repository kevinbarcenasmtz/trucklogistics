// app/(app)/camera/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from '@/src/theme';
import { Platform } from 'react-native';

export default function CameraLayout() {
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
        animation: Platform.OS === 'ios' ? 'default' : 'fade_from_bottom',
        gestureEnabled: true,
        ...Platform.select({
          ios: {
            presentation: 'modal',
            cardShadowEnabled: true,
          },
          android: {
            animationEnabled: true,
          },
        }),
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="imagedetails" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="report" />
    </Stack>
  );
}