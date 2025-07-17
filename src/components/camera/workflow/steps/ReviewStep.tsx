import { useOCR } from '@/src/context/OCRContext';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Receipt } from '@/src/types/ReceiptInterfaces';
import { generateShortCorrelationId } from '@/src/utils/correlation';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraFlow } from '../../../../store/cameraFlowStore';
import { ActionButton } from '../../CameraUIComponents';
import {
  ClassificationDisplay,
  ImagePreview,
  RecognizedTextDisplay,
} from '../../ImageDetailComponents';
import StepTransition from '../StepTransition';
import { StepProps } from '../types';

export const ReviewStep: React.FC<StepProps> = ({ flowId, onNext, onBack, onCancel, onError }) => {
  const { activeFlow, updateFlow } = useCameraFlow();
  const { dispatch: dispatchOCR } = useOCR();
  const { backgroundColor, surfaceColor, textColor, borderColor } = useAppTheme();
  const { t } = useTranslation();

  // Animation refs for components
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Get OCR result from flow
  const ocrResult = activeFlow?.ocrResult;
  const imageUri = activeFlow?.imageUri;

  if (!ocrResult || !imageUri) {
    onError({
      code: 'MISSING_OCR_DATA',
      message: 'OCR result not available',
      step: 'review',
      retry: true,
    });
    return null;
  }

  // Utility functions for components
  const formatCurrency = (amount?: string): string => {
    if (!amount) return '$0.00';

    // Remove any non-numeric characters except decimal point
    const cleaned = amount.replace(/[^\d.]/g, '');
    const number = parseFloat(cleaned);

    if (isNaN(number)) return '$0.00';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(number);
  };

  const getConfidenceColor = (confidence?: number): string => {
    if (!confidence) return '#FF6B6B'; // Red for unknown

    if (confidence >= 0.8) return '#4CAF50'; // Green for high confidence
    if (confidence >= 0.6) return '#FF9800'; // Orange for medium confidence
    return '#FF6B6B'; // Red for low confidence
  };

  const handleScanPress = () => {
    // This would typically trigger a rescan or zoom functionality
    // For now, we'll just show an alert
    Alert.alert(
      t('feature.notImplemented', 'Feature Not Implemented'),
      t('feature.comingSoon', 'This feature is coming soon.')
    );
  };

  const handleRetake = () => {
    Alert.alert(
      t('camera.retakeTitle', 'Retake Photo'),
      t(
        'camera.retakeMessage',
        'Are you sure you want to retake the photo? This will restart the process.'
      ),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('camera.retake', 'Retake'),
          style: 'destructive',
          onPress: () => {
            // Reset OCR state
            dispatchOCR({ type: 'RESET' });

            // Reset flow to capture step
            updateFlow({
              imageUri: undefined,
              ocrResult: undefined,
              currentStep: 'capture',
            });

            // Go back to capture step
            onBack();
          },
        },
      ]
    );
  };

  const handleContinue = () => {
    try {
      // Create complete receipt draft from OCR data
      const receiptDraft: Receipt = {
        // Required fields
        id: generateShortCorrelationId(),
        date: ocrResult.classification?.date || new Date().toISOString(),
        type: ocrResult.classification?.type || 'Other',
        amount: ocrResult.classification?.amount || '0.00',
        vehicle: ocrResult.classification?.vehicle || '',
        status: 'Pending',
        extractedText: ocrResult.extractedText,
        imageUri: imageUri,
        timestamp: new Date().toISOString(),

        // Optional fields
        vendorName: ocrResult.classification?.vendorName || '',
        location: ocrResult.classification?.location || '',
      };

      // Update flow with receipt draft
      updateFlow({
        receiptDraft: receiptDraft,
        currentStep: 'verification',
      });

      // Advance to verification step
      onNext();
    } catch (error) {
      onError({
        code: 'RECEIPT_CREATION_FAILED',
        message: 'Failed to create receipt draft',
        step: 'review',
        retry: true,
      });
    }
  };

  const handleCancel = () => {
    Alert.alert(
      t('camera.cancelTitle', 'Cancel Process'),
      t('camera.cancelMessage', 'Are you sure you want to cancel? All progress will be lost.'),
      [
        { text: t('camera.continueScan', 'Continue'), style: 'cancel' },
        { text: t('common.cancel', 'Cancel'), style: 'destructive', onPress: onCancel },
      ]
    );
  };

  return (
    <StepTransition entering={true}>
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Preview */}
          <View style={[styles.section, { backgroundColor: surfaceColor }]}>
            <ImagePreview uri={imageUri} onScanPress={handleScanPress} />
          </View>

          {/* Classification Display */}
          <View style={[styles.section, { backgroundColor: surfaceColor }]}>
            <ClassificationDisplay
              classification={ocrResult.classification}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
              formatCurrency={formatCurrency}
              getConfidenceColor={getConfidenceColor}
            />
          </View>

          {/* Recognized Text Display */}
          <View style={[styles.section, { backgroundColor: surfaceColor }]}>
            <RecognizedTextDisplay
              text={ocrResult.extractedText}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
            />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View
          style={[
            styles.buttonContainer,
            { backgroundColor: surfaceColor, borderTopColor: borderColor },
          ]}
        >
          <View style={styles.buttonRow}>
            <ActionButton
              title={t('camera.retake', 'Retake')}
              icon="camera"
              onPress={handleRetake}
              backgroundColor={surfaceColor}
              color={textColor}
              style={styles.secondaryButton}
            />

            <ActionButton
              title={t('common.continue', 'Continue')}
              icon="arrow-forward"
              onPress={handleContinue}
              style={styles.primaryButton}
            />
          </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for button container
  },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
  },
  cancelButton: {
    marginTop: 8,
  },
});

export default ReviewStep;
