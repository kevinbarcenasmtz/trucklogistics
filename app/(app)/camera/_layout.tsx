// app/(app)/camera/_layout.tsx
import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { OCRProvider } from '../../../src/context/OCRContext';
import { CameraErrorBoundary, useCameraErrorHandler } from '../../../src/components/camera/workflow/CameraErrorBoundary';

function CameraLayoutContent() {
  const { backgroundColor } = useAppTheme();
  
  // Integrate error boundary with camera flow store
  useCameraErrorHandler();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
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
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Camera',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="imagedetails" 
        options={{
          title: 'Processing',
          gestureEnabled: false, // Prevent swipe back during processing
        }}
      />
      <Stack.Screen 
        name="verification" 
        options={{
          title: 'Verify Receipt',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="report" 
        options={{
          title: 'Receipt Report',
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}

export default function CameraLayout() {
  return (
    <CameraErrorBoundary fallbackStep="capture">
      <OCRProvider>
        <CameraLayoutContent />
      </OCRProvider>
    </CameraErrorBoundary>
  );
}