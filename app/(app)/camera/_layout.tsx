// app/(app)/camera/_layout.tsx

import React, { Component, ReactNode } from 'react';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Stack } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

/**
 * Error Info interface for error boundary
 */
interface ErrorInfo {
  componentStack: string;
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

/**
 * Custom Error Boundary Component
 */
class CameraErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for debugging
    console.error('[CameraErrorBoundary] Error caught:', error);
    if (__DEV__) {
      console.error('[CameraErrorBoundary] Error info:', errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <CameraErrorFallback
          error={this.state.error}
          resetError={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error Fallback Component for Camera Layout
 */
const CameraErrorFallback: React.FC<{
  error?: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  const { backgroundColor, textColor, primaryColor } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const handleRestart = () => {
    resetError();
    router.replace('/camera');
  };

  const handleGoHome = () => {
    resetError();
    router.replace('/home');
  };

  return (
    <View style={[styles.errorContainer, { backgroundColor }]}>
      <Text style={[styles.errorTitle, { color: textColor }]}>
        {t('camera.errorTitle', 'Camera Error')}
      </Text>
      <Text style={[styles.errorMessage, { color: textColor }]}>
        {t('camera.errorMessage', 'Something went wrong with the camera workflow.')}
      </Text>
      
      {__DEV__ && error && (
        <Text style={[styles.errorDetails, { color: textColor }]}>
          {error.message}
        </Text>
      )}

      <View style={styles.errorActions}>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: primaryColor }]}
          onPress={handleRestart}
        >
          <Text style={styles.errorButtonText}>
            {t('camera.restart', 'Restart Camera')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.errorButton, styles.secondaryButton, { borderColor: primaryColor }]}
          onPress={handleGoHome}
        >
          <Text style={[styles.errorButtonText, { color: primaryColor }]}>
            {t('common.goHome', 'Go Home')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Camera Layout - Updated for Phase 3
 * Removed old OCR Provider, using CameraWorkflowCoordinator's provider hierarchy
 */
export default function CameraLayout() {
  const { backgroundColor } = useAppTheme();

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log error for debugging
    console.error('[CameraLayout] Error boundary triggered:', error);
    if (__DEV__) {
      console.error('[CameraLayout] Error info:', errorInfo);
    }
  };

  const handleReset = () => {
    // Cleanup any camera-specific state
    console.log('[CameraLayout] Error boundary reset');
  };

  return (
    <CameraErrorBoundary onError={handleError} onReset={handleReset}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor },
          animation: 'slide_from_right',
          // Disable gesture navigation to prevent interference with camera workflow
          gestureEnabled: false,
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
            // Prevent back gesture during processing
            gestureEnabled: false,
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
            // Prevent accidental navigation away from completed report
            gestureEnabled: false,
          }}
        />
      </Stack>
    </CameraErrorBoundary>
  );
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorDetails: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'monospace',
    opacity: 0.7,
  },
  errorActions: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  errorButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});