// app/(app)/camera/_layout.tsx
import { OCRProvider } from '@/src/context/OCRContext';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Stack } from 'expo-router';

export default function CameraLayout() {
  const { backgroundColor } = useAppTheme();

  return (
    <OCRProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Capture Receipt',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="imagedetails"
          options={{
            title: 'Process Receipt',
          }}
        />
        <Stack.Screen
          name="verification"
          options={{
            title: 'Verify Details',
          }}
        />
        <Stack.Screen
          name="report"
          options={{
            title: 'Receipt Report',
            animation: 'fade',
          }}
        />
      </Stack>
    </OCRProvider>
  );
}
