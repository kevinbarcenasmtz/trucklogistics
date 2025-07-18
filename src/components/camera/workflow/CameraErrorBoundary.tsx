// src/components/camera/workflow/CameraErrorBoundary.tsx
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { useCameraFlow } from '../../../store/cameraFlowStore';
import { horizontalScale, moderateScale, verticalScale } from '../../../theme';
import { CameraFlowStep, FlowError } from '../../../types/cameraFlow';

interface Props {
  children: ReactNode;
  fallbackStep?: CameraFlowStep;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * Error Boundary for Camera Workflow
 * Catches JavaScript errors in the camera flow and provides recovery options
 */
export class CameraErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `camera_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error for debugging
    console.error('Camera workflow error:', error);
    console.error('Error info:', errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Add error to flow store if available
    this.addErrorToFlow(error);

    // Haptic feedback for error
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (hapticError) {
      console.warn('Haptic feedback not available:', hapticError);
    }
  }

  private addErrorToFlow = (error: Error) => {
    try {
      const flowError: FlowError = {
        step: 'capture',
        code: 'WORKFLOW_ERROR',
        message: error.message,
        userMessage: 'An unexpected error occurred in the camera workflow',
        timestamp: Date.now(),
        retryable: this.retryCount < this.maxRetries,
        context: {
          errorId: this.state.errorId,
          stack: error.stack,
          retryCount: this.retryCount,
        },
      };

      // Use global reference to addError function
      const addErrorFn = (global as any).cameraFlowAddError;
      if (addErrorFn) {
        addErrorFn(flowError);
      }
    } catch (e) {
      console.warn('Could not add error to flow:', e);
    }
  };

  private handleRetry = () => {
    this.retryCount++;

    if (this.retryCount >= this.maxRetries) {
      Alert.alert(
        'Maximum Retries Exceeded',
        'The camera workflow has encountered multiple errors. Please restart the session.',
        [
          {
            text: 'Restart',
            onPress: this.handleRestart,
          },
        ]
      );
      return;
    }

    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.warn('Haptic feedback not available:', e);
    }
  };

  private handleRestart = () => {
    // Reset retry count
    this.retryCount = 0;

    // Clear error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });

    // Navigate to camera start or fallback step using proper routes
    const targetStep = this.props.fallbackStep || 'capture';

    switch (targetStep) {
      case 'capture':
        router.replace('/camera');
        break;
      case 'processing':
      case 'review':
        router.replace('/camera/imagedetails');
        break;
      case 'verification':
        router.replace('/camera/verification');
        break;
      case 'report':
        router.replace('/camera/report');
        break;
      default:
        router.replace('/camera');
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.warn('Haptic feedback not available:', e);
    }
  };

  private handleGoHome = () => {
    // Reset state
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });

    // Navigate to home using the correct route
    router.replace('/home');
  };

  render() {
    if (this.state.hasError) {
      return (
        <CameraErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          retryCount={this.retryCount}
          maxRetries={this.maxRetries}
          onRetry={this.handleRetry}
          onRestart={this.handleRestart}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error Fallback Component
 * Displays when an error is caught by the boundary
 */
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onRestart: () => void;
  onGoHome: () => void;
}

function CameraErrorFallback({
  error,
  errorInfo,
  errorId,
  retryCount,
  maxRetries,
  onRetry,
  onRestart,
  onGoHome,
}: ErrorFallbackProps) {
  const {
    backgroundColor,
    textColor,
    secondaryTextColor,
    primaryColor,
    errorColor,
    getSurfaceColor,
  } = useAppTheme();

  const canRetry = retryCount < maxRetries;
  const errorMessage = error?.message || 'An unexpected error occurred';
  const isNetworkError =
    errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch');

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.errorCard, { backgroundColor: getSurfaceColor() }]}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <MaterialIcons name="error-outline" size={64} color={errorColor} />
        </View>

        {/* Error Title */}
        <Text style={[styles.title, { color: textColor }]}>Oops! Something went wrong</Text>

        {/* Error Description */}
        <Text style={[styles.description, { color: secondaryTextColor }]}>
          {isNetworkError
            ? 'There seems to be a network issue. Please check your connection and try again.'
            : 'The camera workflow encountered an unexpected error. You can try again or restart the session.'}
        </Text>

        {/* Error Details (Collapsible) */}
        {__DEV__ && (
          <View style={[styles.debugInfo, { backgroundColor: getSurfaceColor(true) }]}>
            <Text style={[styles.debugTitle, { color: secondaryTextColor }]}>
              Debug Info (Development Only)
            </Text>
            <Text style={[styles.debugText, { color: secondaryTextColor }]}>
              Error ID: {errorId}
            </Text>
            <Text style={[styles.debugText, { color: secondaryTextColor }]}>
              Retry Count: {retryCount}/{maxRetries}
            </Text>
            <Text style={[styles.debugText, { color: secondaryTextColor }]}>
              Message: {errorMessage}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {canRetry && (
            <TouchableOpacity
              style={[styles.button, styles.retryButton, { backgroundColor: primaryColor }]}
              onPress={onRetry}
            >
              <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Try Again</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: primaryColor }]}
            onPress={onRestart}
          >
            <MaterialIcons name="restart-alt" size={20} color={primaryColor} />
            <Text style={[styles.buttonText, { color: primaryColor }]}>Restart Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.tertiaryButton]} onPress={onGoHome}>
            <MaterialIcons name="home" size={20} color={secondaryTextColor} />
            <Text style={[styles.buttonText, { color: secondaryTextColor }]}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/**
 * Hook to integrate error boundary with camera flow store
 * This should be used in a component that can access hooks
 */
export function useCameraErrorHandler() {
  const { updateFlow } = useCameraFlow();

  // Create addError function that uses updateFlow
  const addError = React.useCallback(
    (error: {
      step: string;
      code: string;
      message: string;
      userMessage?: string;
      retryable?: boolean;
    }) => {
      updateFlow({
        lastError: {
          step: error.step as any, // Cast to match CameraFlowStep type
          code: error.code,
          message: error.message,
          userMessage: error.userMessage || error.message,
          timestamp: Date.now(),
          retryable: error.retryable ?? true,
        },
      });
    },
    [updateFlow]
  );

  // Store the addError function globally for the error boundary to access
  React.useEffect(() => {
    (global as any).cameraFlowAddError = addError;
    return () => {
      delete (global as any).cameraFlowAddError;
    };
  }, [addError]);

  return { addError };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: horizontalScale(20),
  },
  errorCard: {
    borderRadius: moderateScale(16),
    padding: horizontalScale(24),
    width: '100%',
    maxWidth: horizontalScale(400),
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: verticalScale(20),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: verticalScale(12),
  },
  description: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    lineHeight: moderateScale(24),
    marginBottom: verticalScale(24),
  },
  debugInfo: {
    width: '100%',
    padding: horizontalScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(20),
  },
  debugTitle: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginBottom: verticalScale(8),
  },
  debugText: {
    fontSize: moderateScale(11),
    fontFamily: 'monospace',
    marginBottom: verticalScale(4),
  },
  buttonContainer: {
    width: '100%',
    gap: verticalScale(12),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: horizontalScale(20),
    borderRadius: moderateScale(8),
    gap: horizontalScale(8),
  },
  retryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});
