import { useOCR } from '@/src/context/OCRContext';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraFlow } from '../../../../store/cameraFlowStore';
import { ActionButton } from '../../CameraUIComponents';
import StepTransition from '../StepTransition';
import { StepProps } from '../types';

export const ProcessingStep: React.FC<StepProps> = ({ flowId, onNext, onCancel, onError }) => {
  const { activeFlow, updateFlow } = useCameraFlow();
  const { state: ocrContextState, dispatch: dispatchOCR } = useOCR();
  const { backgroundColor, surfaceColor, textColor, secondaryTextColor, primaryColor } =
    useAppTheme();
  const { t } = useTranslation();

  // Extract actual OCR state from context
  const ocrState = ocrContextState.state;

  // Start OCR processing when component mounts
  useEffect(() => {
    if (activeFlow?.imageUri && ocrState.status === 'idle') {
      dispatchOCR({
        type: 'IMAGE_CAPTURED',
        uri: activeFlow.imageUri,
      });
    }
  }, [activeFlow?.imageUri, ocrState.status, dispatchOCR]);

  // Listen for OCR completion
  useEffect(() => {
    if (ocrState.status === 'reviewing' && 'data' in ocrState && ocrState.data) {
      // Update flow with OCR result and advance to next step
      updateFlow({
        ocrResult: ocrState.data,
        currentStep: 'review',
      });
      onNext();
    }
  }, [ocrState.status, ocrState, updateFlow, onNext]);

  // Handle OCR errors
  useEffect(() => {
    if (ocrState.status === 'error' && 'error' in ocrState) {
      onError({
        code: 'OCR_PROCESSING_FAILED',
        message: ocrState.error.message || 'OCR processing failed',
        step: 'processing',
        retry: true,
      });
    }
  }, [ocrState.status, ocrState, onError]);

  const handleCancel = () => {
    // Cancel OCR processing
    dispatchOCR({ type: 'CANCEL' });
    // Cancel the entire flow
    onCancel();
  };

  const handleRetry = () => {
    if (activeFlow?.imageUri) {
      dispatchOCR({ type: 'RESET' });
      dispatchOCR({
        type: 'IMAGE_CAPTURED',
        uri: activeFlow.imageUri,
      });
    }
  };

  const getStatusMessage = () => {
    switch (ocrState.status) {
      case 'optimizing':
        return t('ocr.optimizing', 'Optimizing image...');
      case 'uploading':
        return t('ocr.uploading', 'Uploading image...');
      case 'processing':
        return t('ocr.processing', 'Processing receipt...');
      case 'extracting':
        return t('ocr.extracting', 'Extracting text...');
      case 'classifying':
        return t('ocr.classifying', 'Classifying receipt...');
      case 'error':
        return t('ocr.error', 'Processing failed');
      default:
        return t('ocr.preparing', 'Preparing to process...');
    }
  };

  const getProgressPercentage = () => {
    if ('progress' in ocrState) {
      switch (ocrState.status) {
        case 'optimizing':
          return ocrState.progress * 25; // 0-25%
        case 'uploading':
          return 25 + ocrState.progress * 25; // 25-50%
        case 'processing':
        case 'extracting':
          return 50 + ocrState.progress * 25; // 50-75%
        case 'classifying':
          return 75 + ocrState.progress * 25; // 75-100%
        default:
          return 0;
      }
    }
    return 0;
  };

  const isError = ocrState.status === 'error';

  return (
    <StepTransition entering={true}>
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.content}>
          {/* Processing Status */}
          <View style={[styles.statusContainer, { backgroundColor: surfaceColor }]}>
            {isError ? (
              <MaterialIcons name="error-outline" size={64} color="#FF6B6B" />
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={primaryColor} />
                <View style={[styles.progressBar, { backgroundColor: secondaryTextColor }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: primaryColor,
                        width: `${getProgressPercentage()}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            <Text style={[styles.statusText, { color: textColor }]}>{getStatusMessage()}</Text>

            {'progress' in ocrState && (
              <Text style={[styles.progressText, { color: secondaryTextColor }]}>
                {Math.round(ocrState.progress * 100)}% complete
              </Text>
            )}
          </View>

          {/* Processing Steps */}
          {!isError && (
            <View style={[styles.stepsContainer, { backgroundColor: surfaceColor }]}>
              <Text style={[styles.stepsTitle, { color: textColor }]}>
                {t('ocr.processingsteps', 'Processing Steps')}
              </Text>

              <ProcessingStepItem
                title={t('ocr.step1', 'Optimizing image')}
                isCompleted={[
                  'uploading',
                  'processing',
                  'extracting',
                  'classifying',
                  'reviewing',
                ].includes(ocrState.status)}
                isActive={ocrState.status === 'optimizing'}
              />
              <ProcessingStepItem
                title={t('ocr.step2', 'Uploading image')}
                isCompleted={['processing', 'extracting', 'classifying', 'reviewing'].includes(
                  ocrState.status
                )}
                isActive={ocrState.status === 'uploading'}
              />
              <ProcessingStepItem
                title={t('ocr.step3', 'Extracting text')}
                isCompleted={['extracting', 'classifying', 'reviewing'].includes(ocrState.status)}
                isActive={ocrState.status === 'processing' || ocrState.status === 'extracting'}
              />
              <ProcessingStepItem
                title={t('ocr.step4', 'Classifying receipt')}
                isCompleted={['reviewing'].includes(ocrState.status)}
                isActive={ocrState.status === 'classifying'}
              />
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={[styles.buttonContainer, { backgroundColor: surfaceColor }]}>
          {isError ? (
            <ActionButton
              title={t('common.retry', 'Retry')}
              icon="refresh"
              onPress={handleRetry}
              style={styles.actionButton}
            />
          ) : null}

          <ActionButton
            title={t('common.cancel', 'Cancel')}
            onPress={handleCancel}
            backgroundColor={surfaceColor}
            color={textColor}
            style={styles.cancelButton}
          />
        </View>
      </SafeAreaView>
    </StepTransition>
  );
};

// Helper component for processing steps (renamed to avoid conflict)
const ProcessingStepItem: React.FC<{
  title: string;
  isCompleted: boolean;
  isActive: boolean;
}> = ({ title, isCompleted, isActive }) => {
  const { textColor, secondaryTextColor, primaryColor } = useAppTheme();

  return (
    <View style={styles.stepItem}>
      <View
        style={[
          styles.stepIndicator,
          {
            backgroundColor: isCompleted ? primaryColor : 'transparent',
            borderColor: isActive ? primaryColor : secondaryTextColor,
          },
        ]}
      >
        {isCompleted && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
        {isActive && !isCompleted && <ActivityIndicator size="small" color={primaryColor} />}
      </View>

      <Text
        style={[
          styles.stepTitle,
          {
            color: isCompleted || isActive ? textColor : secondaryTextColor,
            fontWeight: isActive ? '600' : '400',
          },
        ]}
      >
        {title}
      </Text>
    </View>
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
  },
  statusContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  stepsContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 14,
    flex: 1,
  },
  buttonContainer: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 8,
  },
});

export default ProcessingStep;
