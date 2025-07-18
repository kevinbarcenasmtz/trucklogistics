// src/components/camera/steps/ProcessingStep.tsx

import { useAppTheme } from '@/src/hooks/useAppTheme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraFlow } from '../../../../hooks/useCameraFlow';
import { useBackendOCR } from '../../../../hooks/useBackendOCR';
import StepTransition from '../StepTransition';
import { BaseCameraStepProps } from '../../../../types';

/**
 * ProcessingStep Component - Displays real backend OCR processing progress
 * Migrated from OCR Context to useBackendOCR and useCameraFlow hooks
 */
export const ProcessingStep: React.FC<BaseCameraStepProps> = ({ 
  flowId, 
  onNext, 
  onBack,
  onCancel, 
  onError,
  testID = 'processing-step'
}) => {
  const { 
    processCurrentImage,
    getCurrentImage,
    isProcessing: flowIsProcessing,
    processingError,
    canRetryProcessing,
    clearError
  } = useCameraFlow();
  
  const {
    status,
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
    getProgressDescription
  } = useBackendOCR();
  
  const { 
    backgroundColor, 
    surfaceColor, 
    textColor, 
    secondaryTextColor, 
    primaryColor,
    errorColor,
    successColor
  } = useAppTheme();
  
  const { t } = useTranslation();

  // Animation refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Auto-start processing on mount
  useEffect(() => {
    const startProcessing = async () => {
      const imageUri = getCurrentImage();
      if (imageUri && !isProcessing && !isCompleted && !hasError) {
        try {
          console.log('[ProcessingStep] Auto-starting processing for image:', imageUri);
          await processCurrentImage();
        } catch (error) {
          console.error('[ProcessingStep] Auto-start processing failed:', error);
          onError({
            step: 'processing',
            code: 'AUTO_START_FAILED',
            message: error instanceof Error ? error.message : 'Failed to start processing',
            userMessage: 'Failed to start processing. Please try again.',
            timestamp: Date.now(),
            retryable: true,
          });
        }
      }
    };

    startProcessing();
  }, [getCurrentImage, hasError, isCompleted, isProcessing, onError, processCurrentImage]); // Only run on mount

  // Animate progress changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: totalProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [totalProgress, progressAnim]);

  // Animate processing indicator
  useEffect(() => {
    if (isProcessing) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isProcessing) pulse(); // Continue pulsing while processing
        });
      };
      pulse();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isProcessing, pulseAnim]);

  // Handle processing completion
  useEffect(() => {
    if (isCompleted && !hasError) {
      console.log('[ProcessingStep] Processing completed successfully');
      // Small delay to show completion state before navigating
      setTimeout(() => {
        onNext();
      }, 500);
    }
  }, [isCompleted, hasError, onNext]);

  // Handle processing errors
  useEffect(() => {
    if (hasError && error) {
      console.error('[ProcessingStep] Processing error:', error);
      onError({
        step: 'processing',
        code: error.code || 'PROCESSING_ERROR',
        message: error.message || 'Processing failed',
        userMessage: error.userMessage || 'Failed to process image. Please try again.',
        timestamp: Date.now(),
        retryable: error.retryable || true,
      });
    }
  }, [hasError, error, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isProcessing && canCancel) {
        console.log('[ProcessingStep] Component unmounting, cancelling processing');
        cancelProcessing().catch(error => {
          console.warn('[ProcessingStep] Cleanup cancellation failed:', error);
        });
      }
    };
  }, [isProcessing, canCancel, cancelProcessing]);

  /**
   * Handle manual cancellation
   */
  const handleCancel = async () => {
    try {
      console.log('[ProcessingStep] User cancelled processing');
      
      if (isProcessing && canCancel) {
        await cancelProcessing();
      }
      
      onCancel();
    } catch (error) {
      console.error('[ProcessingStep] Cancel failed:', error);
      // Still proceed with cancellation even if backend cancel fails
      onCancel();
    }
  };

  /**
   * Handle retry processing
   */
  const handleRetry = async () => {
    try {
      console.log('[ProcessingStep] User retrying processing');
      clearError(); // Clear flow errors
      
      const imageUri = getCurrentImage();
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
      onError({
        step: 'processing',
        code: 'RETRY_FAILED',
        message: error instanceof Error ? error.message : 'Retry failed',
        userMessage: 'Failed to retry processing. Please try again.',
        timestamp: Date.now(),
        retryable: true,
      });
    }
  };

  /**
   * Get current status message
   */
  const getStatusMessage = (): string => {
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
  };

  /**
   * Get status icon
   */
  const getStatusIcon = () => {
    if (hasError) {
      return <MaterialIcons name="error" size={60} color={errorColor} />;
    }
    
    if (isCompleted) {
      return <MaterialIcons name="check-circle" size={60} color={successColor} />;
    }
    
    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <ActivityIndicator size={60} color={primaryColor} />
      </Animated.View>
    );
  };

  /**
   * Get stage-specific details
   */
  const getStageDetails = (): string => {
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
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    content: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    statusIcon: {
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: textColor,
      textAlign: 'center',
      marginBottom: 10,
    },
    statusMessage: {
      fontSize: 16,
      color: secondaryTextColor,
      textAlign: 'center',
      marginBottom: 8,
    },
    stageDetails: {
      fontSize: 14,
      color: secondaryTextColor,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    progressContainer: {
      width: '100%',
      marginBottom: 40,
    },
    progressBarContainer: {
      width: '100%',
      height: 8,
      backgroundColor: surfaceColor,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 10,
    },
    progressBar: {
      height: '100%',
      backgroundColor: primaryColor,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 16,
      fontWeight: '600',
      color: textColor,
      textAlign: 'center',
    },
    buttonContainer: {
      width: '100%',
      gap: 15,
    },
    cancelButton: {
      backgroundColor: 'transparent',
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: errorColor,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: errorColor,
    },
    retryButton: {
      backgroundColor: primaryColor,
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 8,
      alignItems: 'center',
    },
    retryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    errorContainer: {
      backgroundColor: surfaceColor,
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: errorColor,
      marginBottom: 30,
      width: '100%',
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: errorColor,
      marginBottom: 8,
      textAlign: 'center',
    },
    errorMessage: {
      fontSize: 14,
      color: secondaryTextColor,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      <StepTransition entering={true}>
        <View style={styles.content}>
          {/* Status indicator */}
          <View style={styles.statusContainer}>
            <View style={styles.statusIcon}>
              {getStatusIcon()}
            </View>
            
            <Text style={styles.title}>
              {hasError 
                ? t('processing.failed', 'Processing Failed')
                : isCompleted
                ? t('processing.success', 'Processing Complete')
                : t('processing.title', 'Processing Receipt')
              }
            </Text>
            
            <Text style={styles.statusMessage}>
              {getStatusMessage()}
            </Text>
            
            {!hasError && !isCompleted && (
              <Text style={styles.stageDetails}>
                {getStageDetails()}
              </Text>
            )}
          </View>

          {/* Error details */}
          {hasError && error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>
                {t('processing.errorTitle', 'What happened?')}
              </Text>
              <Text style={styles.errorMessage}>
                {error.userMessage || error.message}
              </Text>
            </View>
          )}

          {/* Progress indicator */}
          {!hasError && !isCompleted && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarContainer}>
                <Animated.View 
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(totalProgress)}% {t('processing.complete', 'Complete')}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            {hasError ? (
              <>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetry}
                  testID="retry-button"
                >
                  <Text style={styles.retryButtonText}>
                    {t('processing.retry', 'Try Again')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  testID="cancel-button"
                >
                  <Text style={styles.cancelButtonText}>
                    {t('processing.cancel', 'Cancel')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              canCancel && isProcessing && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  testID="cancel-button"
                >
                  <Text style={styles.cancelButtonText}>
                    {t('processing.cancel', 'Cancel')}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </StepTransition>
    </SafeAreaView>
  );
};

export default ProcessingStep;