// src/components/camera/workflow/steps/ReviewStep.tsx

import { useAppTheme } from '@/src/hooks/useAppTheme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraFlow } from '../../../../hooks/useCameraFlow';
import { BaseCameraStepProps } from '../../../../types/component_props';
import { ImagePreview } from '../../ImageDetailComponents';
import StepTransition from '../StepTransition';

/**
 * ReviewStep Component - Uses store directly instead of props
 */
export const ReviewStep: React.FC<BaseCameraStepProps> = ({
  flowId,
  testID = 'review-step',
  style,
}) => {
  const { getCurrentImage, getCurrentProcessedData, navigateBack, navigateNext, navigateToStep } =
    useCameraFlow();

  const {
    backgroundColor,
    surfaceColor,
    textColor,
    secondaryTextColor,
    primaryColor,
    borderColor,
    successColor,
  } = useAppTheme();

  const { t } = useTranslation();

  // Animation refs for smooth transitions
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Get data from flow state only
  const imageUri = getCurrentImage();
  const processedData = getCurrentProcessedData();

  // Animate component entrance - moved before conditional logic
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Handle missing data - moved after all hooks
  React.useEffect(() => {
    if (!processedData || !imageUri) {
      Alert.alert(
        t('error.title', 'Error'),
        t(
          'review.missingData',
          'No processed data to review. Please go back and process the image again.'
        )
      );
    }
  }, [processedData, imageUri, t]);

  // Early return after all hooks
  if (!processedData || !imageUri) {
    return null;
  }

  const { classification, extractedText, confidence } = processedData;

  /**
   * Format currency amount for display
   */
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

  /**
   * Get confidence color based on score
   */
  const getConfidenceColor = (confidence?: number): string => {
    if (!confidence) return '#FF6B6B'; // Red for unknown

    if (confidence >= 0.8) return successColor; // Green for high confidence
    if (confidence >= 0.6) return '#FF9800'; // Orange for medium confidence
    return '#FF6B6B'; // Red for low confidence
  };

  /**
   * Get confidence label
   */
  const getConfidenceLabel = (confidence?: number): string => {
    if (!confidence) return t('confidence.unknown', 'Unknown');

    if (confidence >= 0.8) return t('confidence.high', 'High');
    if (confidence >= 0.6) return t('confidence.medium', 'Medium');
    return t('confidence.low', 'Low');
  };

  /**
   * Handle scan press for image preview
   */
  const handleScanPress = () => {
    Alert.alert(
      t('feature.notImplemented', 'Feature Not Implemented'),
      t('feature.comingSoon', 'This feature is coming soon.')
    );
  };

  /**
   * Handle proceeding to verification
   */
  const handleProceed = () => {
    console.log('[ReviewStep] Proceeding to verification');
    navigateNext();
  };

  /**
   * Handle going back to processing
   */
  const handleBack = () => {
    console.log('[ReviewStep] Going back to processing');
    navigateBack();
  };

  /**
   * Handle retaking photo
   */
  const handleRetake = () => {
    Alert.alert(
      t('review.retakeTitle', 'Retake Photo'),
      t(
        'review.retakeMessage',
        'Are you sure you want to retake the photo? This will restart the process.'
      ),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('review.retake', 'Retake'),
          style: 'destructive',
          onPress: () => {
            console.log('[ReviewStep] Retaking photo');
            navigateToStep('capture');
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 100, // Space for fixed buttons
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: textColor,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: secondaryTextColor,
      textAlign: 'center',
    },
    confidenceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      padding: 12,
      backgroundColor: surfaceColor,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: borderColor,
    },
    confidenceIcon: {
      marginRight: 8,
    },
    confidenceText: {
      fontSize: 16,
      fontWeight: '600',
    },
    confidenceScore: {
      fontSize: 14,
      marginLeft: 4,
      opacity: 0.7,
    },
    sectionContainer: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
      marginBottom: 12,
    },
    classificationContainer: {
      backgroundColor: surfaceColor,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: borderColor,
    },
    classificationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    classificationRowLast: {
      borderBottomWidth: 0,
    },
    classificationLabel: {
      fontSize: 14,
      color: secondaryTextColor,
      flex: 1,
    },
    classificationValue: {
      fontSize: 16,
      fontWeight: '500',
      color: textColor,
      flex: 2,
      textAlign: 'right',
    },
    amountValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: successColor,
    },
    textPreviewContainer: {
      backgroundColor: surfaceColor,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: borderColor,
      maxHeight: 150,
    },
    extractedText: {
      fontSize: 12,
      color: textColor,
      lineHeight: 16,
      fontFamily: 'monospace',
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: borderColor,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: primaryColor,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: 'transparent',
      paddingVertical: 15,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: primaryColor,
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: primaryColor,
    },
    retakeButton: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    retakeButtonText: {
      fontSize: 14,
      color: secondaryTextColor,
    },
  });

  return (
    <SafeAreaView style={[styles.container, style]} testID={testID}>
      <StepTransition entering={true}>
        <Animated.View
          style={[
            { flex: 1 },
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t('review.title', 'Review Results')}</Text>
              <Text style={styles.subtitle}>
                {t('review.subtitle', 'Check the extracted information below')}
              </Text>
            </View>

            {/* Confidence indicator */}
            <View style={styles.confidenceContainer}>
              <MaterialIcons
                name={confidence >= 0.8 ? 'check-circle' : confidence >= 0.6 ? 'info' : 'warning'}
                size={20}
                color={getConfidenceColor(confidence)}
                style={styles.confidenceIcon}
              />
              <Text style={[styles.confidenceText, { color: getConfidenceColor(confidence) }]}>
                {getConfidenceLabel(confidence)} {t('review.confidence', 'Confidence')}
              </Text>
              <Text style={[styles.confidenceScore, { color: getConfidenceColor(confidence) }]}>
                ({Math.round((confidence || 0) * 100)}%)
              </Text>
            </View>

            {/* Image preview */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{t('review.image', 'Captured Image')}</Text>
              <ImagePreview uri={imageUri} onScanPress={handleScanPress} />
            </View>

            {/* Classification results */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{t('review.details', 'Receipt Details')}</Text>
              <View style={styles.classificationContainer}>
                <View style={styles.classificationRow}>
                  <Text style={styles.classificationLabel}>{t('receipt.date', 'Date')}</Text>
                  <Text style={styles.classificationValue}>
                    {classification.date || t('common.notDetected', 'Not detected')}
                  </Text>
                </View>

                <View style={styles.classificationRow}>
                  <Text style={styles.classificationLabel}>{t('receipt.type', 'Type')}</Text>
                  <Text style={styles.classificationValue}>
                    {classification.type || t('common.notDetected', 'Not detected')}
                  </Text>
                </View>

                <View style={styles.classificationRow}>
                  <Text style={styles.classificationLabel}>{t('receipt.amount', 'Amount')}</Text>
                  <Text style={[styles.classificationValue, styles.amountValue]}>
                    {formatCurrency(classification.amount)}
                  </Text>
                </View>

                <View style={styles.classificationRow}>
                  <Text style={styles.classificationLabel}>{t('receipt.vehicle', 'Vehicle')}</Text>
                  <Text style={styles.classificationValue}>
                    {classification.vehicle || t('common.notDetected', 'Not detected')}
                  </Text>
                </View>

                <View style={styles.classificationRow}>
                  <Text style={styles.classificationLabel}>{t('receipt.vendor', 'Vendor')}</Text>
                  <Text style={styles.classificationValue}>
                    {classification.vendorName || t('common.notDetected', 'Not detected')}
                  </Text>
                </View>

                <View style={[styles.classificationRow, styles.classificationRowLast]}>
                  <Text style={styles.classificationLabel}>
                    {t('receipt.location', 'Location')}
                  </Text>
                  <Text style={styles.classificationValue}>
                    {classification.location || t('common.notDetected', 'Not detected')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Extracted text preview */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{t('review.extractedText', 'Extracted Text')}</Text>
              <View style={styles.textPreviewContainer}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  <Text style={styles.extractedText}>
                    {extractedText || t('review.noText', 'No text detected')}
                  </Text>
                </ScrollView>
              </View>
            </View>
          </ScrollView>

          {/* Fixed action buttons */}
          <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleBack}
                testID="back-button"
              >
                <Text style={styles.secondaryButtonText}>{t('common.back', 'Back')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleProceed}
                testID="proceed-button"
              >
                <Text style={styles.primaryButtonText}>{t('review.proceed', 'Looks Good')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetake}
              testID="retake-button"
            >
              <Text style={styles.retakeButtonText}>{t('review.retake', 'Retake Photo')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </StepTransition>
    </SafeAreaView>
  );
};

export default ReviewStep;
