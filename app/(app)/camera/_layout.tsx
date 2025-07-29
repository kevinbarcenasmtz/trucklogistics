// app/(app)/camera/_layout.tsx

import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Stack, useRouter } from 'expo-router';
import React, { Component, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
      return <CameraErrorFallback error={this.state.error} resetError={this.handleReset} />;
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
  const {
    screenBackground, // instead of backgroundColor
    textPrimary, // instead of textColor
    primary, // instead of primaryColor
  } = useAppTheme();
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
    <View style={[styles.errorContainer, { backgroundColor: screenBackground }]}>
      <Text style={[styles.errorTitle, { color: textPrimary }]}>
        {t('camera.errorTitle', 'Camera Error')}
      </Text>
      <Text style={[styles.errorMessage, { color: textPrimary }]}>
        {t('camera.errorMessage', 'Something went wrong with the camera workflow.')}
      </Text>

      {__DEV__ && error && (
        <Text style={[styles.errorDetails, { color: textPrimary }]}>{error.message}</Text>
      )}

      <View style={styles.errorActions}>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: primary }]}
          onPress={handleRestart}
        >
          <Text style={styles.errorButtonText}>{t('camera.restart', 'Restart Camera')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.errorButton, styles.secondaryButton, { borderColor: primary }]}
          onPress={handleGoHome}
        >
          <Text style={[styles.errorButtonText, { color: primary }]}>
            {t('common.goHome', 'Go Home')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Camera Layout - Updated for Phase 3
 * Providers now at root level
 */
export default function CameraLayout() {
  const { screenBackground } = useAppTheme(); // instead of backgroundColor

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('[CameraLayout] Error boundary triggered:', error);
    if (__DEV__) {
      console.error('[CameraLayout] Error info:', errorInfo);
    }
  };

  const handleReset = () => {
    console.log('[CameraLayout] Error boundary reset');
  };

  return (
    <CameraErrorBoundary onError={handleError} onReset={handleReset}>
      {/* Providers removed - now at root level */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: screenBackground },
          animation: 'slide_from_right',
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
            title: 'Report',
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
