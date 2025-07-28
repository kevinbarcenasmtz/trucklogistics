// src/components/camera/workflow/steps/ProcessingStep.tsx

import { useAppTheme } from '@/src/hooks/useAppTheme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBackendOCR } from '../../../../hooks/useBackendOCR';
import { useCameraFlow } from '../../../../hooks/useCameraFlow';
import { BaseCameraStepProps } from '../../../../types';
import StepTransition from '../StepTransition';
import { useOCRProcessing } from '../../../../context/OCRProcessingContext';

/**
 * Animated Progress Bar Component - extracted from useEffect animation logic
 */
const AnimatedProgress: React.FC<{
  progress: number;
  primaryColor: string;
}> = ({ progress, primaryColor }) => {
  const progressWidth = `${Math.max(0, Math.min(100, progress))}%`;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: progressWidth as any,
              backgroundColor: primaryColor,
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
    </View>
  );
};

/**
 * Processing Status Component - extracted from conditional rendering
 */
const ProcessingStatus: React.FC<{
  hasError: boolean;
  isCompleted: boolean;
  errorColor: string;
  successColor: string;
  primaryColor: string;
  t: any;
}> = ({ hasError, isCompleted, errorColor, successColor, primaryColor, t }) => {
  const getStatusIcon = () => {
    if (hasError) {
      return <MaterialIcons name="error" size={60} color={errorColor} />;
    }

    if (isCompleted) {
      return <MaterialIcons name="check-circle" size={60} color={successColor} />;
    }

    return <ActivityIndicator size={60} color={primaryColor} />;
  };

  const getTitle = () => {
    if (hasError) return t('processing.failed', 'Processing Failed');
    if (isCompleted) return t('processing.success', 'Processing Complete');
    return t('processing.title', 'Processing Receipt');
  };

  return (
    <View style={styles.statusContainer}>
      <View style={styles.statusIcon}>{getStatusIcon()}</View>
      <Text style={styles.title}>{getTitle()}</Text>
    </View>
  );
};

/**
 * Processing Actions Component - extracted from complex conditional logic
 */
const ProcessingActions: React.FC<{
  hasError: boolean;
  isCompleted: boolean;
  isProcessing: boolean;
  canCancel: boolean;
  onRetry: () => void;
  onCancel: () => void;
  onContinue: () => void;
  t: any;
}> = ({ hasError, isCompleted, isProcessing, canCancel, onRetry, onCancel, onContinue, t }) => {
  if (hasError) {
    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} testID="retry-button">
          <Text style={styles.retryButtonText}>{t('processing.retry', 'Try Again')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} testID="cancel-button">
          <Text style={styles.cancelButtonText}>{t('processing.cancel', 'Cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isCompleted) {
    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
          testID="processing-continue-button"
        >
          <MaterialIcons
            name="check-circle"
            size={20}
            color="#FFFFFF"
            style={styles.continueIcon}
          />
          <Text style={styles.continueButtonText}>
            {t('processing.continue', 'Continue to Review')}
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  if (canCancel && isProcessing) {
    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} testID="cancel-button">
          <Text style={styles.cancelButtonText}>{t('processing.cancel', 'Cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

/**
 * Processing Auto-Starter Component - extracted from useEffect auto-start logic
 */
const ProcessingAutoStarter: React.FC<{
  imageUri: string | null | undefined;
  hasError: boolean;
  isCompleted: boolean;
  isProcessing: boolean;
  hasOCRResult: boolean; // Add this prop
  onStartProcessing: () => Promise<void>;
}> = ({ imageUri, hasError, isCompleted, isProcessing, hasOCRResult, onStartProcessing }) => {
  // Start processing when component mounts if conditions are met
  React.useEffect(() => {
    // Don't auto-start if we already have OCR results
    if (hasOCRResult) {
      console.log('[ProcessingStep] OCR result already exists, skipping auto-start');
      return;
    }

    if (imageUri && !hasError && !isCompleted && !isProcessing) {
      console.log('[ProcessingStep] Auto-starting processing for image:', imageUri);
      onStartProcessing();
    }
  }, [hasError, imageUri, isCompleted, isProcessing, hasOCRResult, onStartProcessing]);

  return null; // This component only handles side effects
};
/**
 * ProcessingStep Component - Uses store directly instead of props
 */
export const ProcessingStep: React.FC<BaseCameraStepProps> = ({
  flowId,
  testID = 'processing-step',
  style,
}) => {
  const { 
    processCurrentImage, 
    getCurrentImage, 
    getCurrentProcessedData,
    canRetryProcessing, 
    clearError,
    navigateNext,
    cancelFlow
  } = useCameraFlow();

  const {
    stage,
    stageDescription,
    totalProgress,
    isProcessing,
    isCompleted,
    hasError,
    error,
    canCancel,
    cancelProcessing,
    retryProcessing,
    getProgressDescription,
  } = useBackendOCR();

  const {
    backgroundColor,
    surfaceColor,
    textColor,
    secondaryTextColor,
    primaryColor,
    errorColor,
    successColor,
  } = useAppTheme();

  const { t } = useTranslation();

  // Get current image URI - computed value, no useRef needed
  const imageUri = useMemo(() => getCurrentImage(), [getCurrentImage]);
  const hasOCRResult = useMemo(() => !!getCurrentProcessedData(), [getCurrentProcessedData]);
  const { completeProcessing } = useOCRProcessing();

  // Explicit functions instead of useEffect chains
  const handleStartProcessing = useCallback(async () => {
    try {
      const result = await processCurrentImage();
      if (!result.success) {
        throw new Error(result.error || 'Failed to start processing');
      }
    } catch (error) {
      console.error('[ProcessingStep] Start processing failed:', error);
      Alert.alert(
        t('error.title', 'Error'),
        t('processing.startFailed', 'Failed to start processing. Please try again.')
      );
    }
  }, [processCurrentImage, t]);


  React.useEffect(() => {
    const existingResult = getCurrentProcessedData();
    if (existingResult && !isCompleted && !isProcessing && !hasError) {
      console.log('[ProcessingStep] Syncing with existing OCR results');
      completeProcessing();
    }
  }, [getCurrentProcessedData, isCompleted, isProcessing, hasError, completeProcessing]);
  
  const handleRetry = useCallback(async () => {
    try {
      console.log('[ProcessingStep] User retrying processing');
      clearError();

      if (imageUri) {
        if (canRetryProcessing) {
          await retryProcessing(imageUri);
        } else {
          await processCurrentImage();
        }
      } else {
        throw new Error('No image available for retry');
      }
    } catch (error) {
      console.error('[ProcessingStep] Retry failed:', error);
      Alert.alert(
        t('error.title', 'Error'),
        t('processing.retryFailed', 'Failed to retry processing. Please try again.')
      );
    }
  }, [clearError, imageUri, canRetryProcessing, retryProcessing, processCurrentImage, t]);

  const handleCancel = useCallback(async () => {
    try {
      console.log('[ProcessingStep] User cancelled processing');

      if (isProcessing && canCancel) {
        await cancelProcessing();
      }

      await cancelFlow('user_cancelled_processing');
    } catch (error) {
      console.error('[ProcessingStep] Cancel failed:', error);
      // Still proceed with cancellation even if backend cancel fails
      await cancelFlow('user_cancelled_processing');
    }
  }, [isProcessing, canCancel, cancelProcessing, cancelFlow]);

  const handleContinue = useCallback(() => {
    console.log('[ProcessingStep] User manually proceeding to next step');
    navigateNext();
  }, [navigateNext]);

  // Pure functions for status messages - no useEffect needed
  const getStatusMessage = useCallback((): string => {
    if (hasError) {
      return error?.userMessage || t('processing.error', 'Processing failed');
    }

    if (isCompleted) {
      return t('processing.complete', 'Processing complete!');
    }

    if (stageDescription) {
      return stageDescription;
    }

    return getProgressDescription();
  }, [hasError, error, isCompleted, stageDescription, getProgressDescription, t]);

  const getStageDetails = useCallback((): string => {
    switch (stage) {
      case 'uploading_chunks':
        return t('processing.uploading', 'Uploading image securely...');
      case 'combining_chunks':
        return t('processing.combining', 'Preparing image for processing...');
      case 'extracting_text':
        return t('processing.extracting', 'Reading text from receipt...');
      case 'classifying_data':
        return t('processing.classifying', 'Understanding receipt content...');
      case 'finalizing':
        return t('processing.finalizing', 'Finalizing results...');
      default:
        return t('processing.default', 'Processing your receipt...');
    }
  }, [stage, t]);

  // Handle processing errors - explicit function, not useEffect
  React.useEffect(() => {
    if (hasError && error) {
      console.error('[ProcessingStep] Processing error:', error);
      Alert.alert(
        t('error.title', 'Processing Error'),
        error.userMessage || error.message || t('processing.unexpectedError', 'An unexpected error occurred during processing.')
      );
    }
  }, [hasError, error, t]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]} testID={testID}>
      <ProcessingAutoStarter
        imageUri={imageUri}
        hasError={hasError}
        isCompleted={isCompleted}
        isProcessing={isProcessing}
        hasOCRResult={hasOCRResult}
        onStartProcessing={handleStartProcessing}
      />

      <StepTransition entering={true}>
        <View style={styles.content}>
          {/* Status indicator */}
          <ProcessingStatus
            hasError={hasError}
            isCompleted={isCompleted}
            errorColor={errorColor}
            successColor={successColor}
            primaryColor={primaryColor}
            t={t}
          />

          <Text style={[styles.statusMessage, { color: textColor }]}>{getStatusMessage()}</Text>

          {!hasError && !isCompleted && (
            <Text style={[styles.stageDetails, { color: secondaryTextColor }]}>
              {getStageDetails()}
            </Text>
          )}

          {/* Error details */}
          {hasError && error && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: surfaceColor, borderColor: errorColor },
              ]}
            >
              <Text style={[styles.errorTitle, { color: errorColor }]}>
                {t('processing.errorTitle', 'What happened?')}
              </Text>
              <Text style={[styles.errorMessage, { color: secondaryTextColor }]}>
                {error.userMessage || error.message}
              </Text>
            </View>
          )}

          {/* Progress indicator */}
          {!hasError && !isCompleted && (
            <AnimatedProgress progress={totalProgress} primaryColor={primaryColor} />
          )}

          {/* Action buttons */}
          <ProcessingActions
            hasError={hasError}
            isCompleted={isCompleted}
            isProcessing={isProcessing}
            canCancel={canCancel}
            onRetry={handleRetry}
            onCancel={handleCancel}
            onContinue={handleContinue}
            t={t}
          />
        </View>
      </StepTransition>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  stageDetails: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 30,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  errorContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 30,
    width: '100%',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
    textAlign: 'center',
  },
  continueIcon: {
    marginRight: 4,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProcessingStep;