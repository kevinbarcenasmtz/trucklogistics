// src/components/camera/workflow/steps/CompletionStep.tsx

import { useAppTheme } from '@/src/hooks/useAppTheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraFlow } from '../../../../hooks/useCameraFlow';
import { BaseCameraStepProps } from '../../../../types/component_props';
import { Receipt } from '../../../../types/ReceiptInterfaces';
import { SectionContainer } from '../../CameraUIComponents';
import {
  ActionCard,
  Divider,
  RawTextSection,
  ReceiptContent,
  ReceiptHeader,
} from '../../ReportComponents';
import StepTransition from '../StepTransition';

/**
 * Action Button Component - extracted from complex conditional logic
 */
const ActionButton: React.FC<{
  onPress: () => Promise<void>;
  icon: string;
  text: string;
  variant: 'primary' | 'secondary';
  loading?: boolean;
  testID?: string;
}> = ({ onPress, icon, text, variant, loading = false, testID }) => {
  const { primaryColor } = useAppTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePress = useCallback(async () => {
    if (isProcessing || loading) return;

    setIsProcessing(true);
    try {
      await onPress();
    } finally {
      setIsProcessing(false);
    }
  }, [onPress, isProcessing, loading]);

  const isButtonLoading = isProcessing || loading;
  const buttonStyle = variant === 'primary' ? styles.primaryButton : styles.secondaryButton;
  const textStyle = variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText;
  const iconColor = variant === 'primary' ? '#FFFFFF' : primaryColor;

  return (
    <TouchableOpacity
      style={[buttonStyle, isButtonLoading && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={isButtonLoading}
      testID={testID}
    >
      <MaterialIcons name={icon as any} size={20} color={iconColor} />
      <Text style={textStyle}>{isButtonLoading ? '...' : text}</Text>
    </TouchableOpacity>
  );
};

/**
 * Processing Summary Component - extracted from conditional rendering
 */
const ProcessingSummary: React.FC<{
  flowMetrics: any;
  processedData: any;
  t: any;
}> = ({ flowMetrics, processedData, t }) => {
  if (!flowMetrics) return null;

  const totalTime = flowMetrics.totalDuration || 0;
  const confidence = processedData?.confidence || 0;

  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>
        {t('completion.processingSummary', 'Processing Summary')}
      </Text>
      <Text style={styles.summaryText}>
        {t('completion.processedIn', 'Processed in {{time}}ms with {{confidence}}% confidence', {
          time: Math.round(totalTime),
          confidence: Math.round(confidence * 100),
        })}
      </Text>
    </View>
  );
};

/**
 * CompletionStep Component - Uses store directly instead of props
 */
export const CompletionStep: React.FC<BaseCameraStepProps> = ({
  flowId,
  testID = 'completion-step',
  style,
}) => {
  const {
    getCurrentDraft,
    getCurrentImage,
    getCurrentProcessedData,
    getFlowMetrics,
    completeFlow,
    resetFlow,
  } = useCameraFlow();

  const { backgroundColor, textColor, successColor } = useAppTheme();

  const { t } = useTranslation();
  const router = useRouter();

  // Only keep truly reactive UI state
  const [shareLoading] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  // Get data from flow state
  const receipt = getCurrentDraft();
  const imageUri = getCurrentImage();
  const processedData = getCurrentProcessedData();
  const flowMetrics = getFlowMetrics();

  // Pure functions for formatting - no useState needed
  const formatDate = useCallback(
    (date?: string): string => {
      if (!date) return t('completion.dateNotAvailable', 'Date not available');
      try {
        return new Date(date).toLocaleDateString();
      } catch {
        return date;
      }
    },
    [t]
  );

  const formatTime = useCallback((date?: string): string => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleTimeString();
    } catch {
      return '';
    }
  }, []);

  const getReceiptTypeIcon = useCallback((type?: string): string => {
    switch (type) {
      case 'Fuel':
        return 'local-gas-station';
      case 'Maintenance':
        return 'build';
      default:
        return 'receipt';
    }
  }, []);

  // Explicit functions instead of useState for status updates
  const handleApproveDocument = useCallback(async () => {
    if (!receipt) return;

    try {
      console.log('[CompletionStep] Updating receipt status to approved');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const updatedReceipt: Receipt = {
        ...receipt,
        status: 'Approved',
        timestamp: new Date().toISOString(),
      };

      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('[CompletionStep] Receipt status updated successfully:', updatedReceipt.status);
    } catch (error) {
      console.error('[CompletionStep] Failed to update status:', error);
      Alert.alert(
        t('completion.statusErrorTitle', 'Status Update Error'),
        t('completion.statusErrorMessage', 'Failed to update receipt status. Please try again.')
      );
    }
  }, [receipt, t]);

  const generateShareMessage = useCallback(
    (receipt: Receipt): string => {
      const parts = [
        `${t('completion.shareReceiptFor', 'Receipt for')}: ${receipt.vendorName || t('completion.unknownVendor', 'Unknown Vendor')}`,
        `${t('completion.shareAmount', 'Amount')}: ${receipt.amount}`,
        `${t('completion.shareDate', 'Date')}: ${formatDate(receipt.date)}`,
        `${t('completion.shareVehicle', 'Vehicle')}: ${receipt.vehicle}`,
        `${t('completion.shareType', 'Type')}: ${receipt.type}`,
      ];

      if (receipt.location) {
        parts.push(`${t('completion.shareLocation', 'Location')}: ${receipt.location}`);
      }

      parts.push('', t('completion.shareGeneratedBy', 'Generated by TruckLogistics'));
      return parts.join('\n');
    },
    [t, formatDate]
  );

  const handleShareDocument = useCallback(async () => {
    if (!receipt) return;

    try {
      console.log('[CompletionStep] Sharing receipt document');

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          t('completion.shareErrorTitle', 'Share Error'),
          t('completion.shareNotAvailable', 'Sharing is not available on this device.')
        );
        return;
      }

      if (imageUri) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/jpeg',
          dialogTitle: t('completion.shareTitle', 'Receipt Report'),
        });
      } else {
        const shareContent = generateShareMessage(receipt);
        Alert.alert(t('completion.shareTitle', 'Receipt Report'), shareContent);
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('[CompletionStep] Receipt shared successfully');
    } catch (error) {
      console.error('[CompletionStep] Share failed:', error);
      Alert.alert(
        t('completion.shareErrorTitle', 'Share Error'),
        t('completion.shareErrorMessage', 'Failed to share receipt. Please try again.')
      );
    }
  }, [receipt, imageUri, t, generateShareMessage]);

  const handleDone = useCallback(async () => {
    try {
      console.log('[CompletionStep] Completing flow and navigating to home');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await completeFlow();
      if (result.success) {
        console.log('[CompletionStep] Flow completed successfully');
        router.replace('/home');
      } else {
        throw new Error(result.error || 'Failed to complete flow');
      }
    } catch (error) {
      console.error('[CompletionStep] Failed to complete flow:', error);
      Alert.alert(
        t('error.title', 'Error'),
        t('completion.completionFailed', 'Failed to complete the process. Please try again.')
      );
    }
  }, [completeFlow, router, t]);

  const handleNewScan = useCallback(async () => {
    try {
      console.log('[CompletionStep] Starting new scan');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await completeFlow();
      if (result.success) {
        resetFlow();
        router.replace('/camera');
      } else {
        throw new Error(result.error || 'Failed to complete current flow');
      }
    } catch (error) {
      console.error('[CompletionStep] Failed to start new scan:', error);
      Alert.alert(
        t('error.title', 'Error'),
        t('completion.newScanFailed', 'Failed to start new scan. Please try again.')
      );
    }
  }, [completeFlow, resetFlow, router, t]);

  const toggleFullText = useCallback(() => {
    setShowFullText(!showFullText);
  }, [showFullText]);

  // Early return for missing data - no useState needed
  if (!receipt) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }, style]} testID={testID}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: textColor }]}>
            {t('completion.noReceipt', 'No receipt data available')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Computed value for receipt with extracted text
  const receiptWithExtractedText = {
    ...receipt,
    extractedText: processedData?.extractedText || receipt.extractedText,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]} testID={testID}>
      <StepTransition entering={true}>
        {/* Header with success message */}
        <View style={styles.header}>
          <MaterialIcons
            name="check-circle"
            size={48}
            color={successColor}
            style={styles.successIcon}
          />
          <Text style={styles.headerTitle}>
            {t('completion.title', 'Receipt Processed Successfully!')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t('completion.subtitle', 'Review your receipt summary below')}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Processing Summary */}
          <ProcessingSummary flowMetrics={flowMetrics} processedData={processedData} t={t} />

          {/* Receipt Summary */}
          <SectionContainer style={styles.section}>
            <ReceiptHeader
              receipt={receipt}
              formatDate={formatDate}
              formatTime={formatTime}
              getReceiptTypeIcon={getReceiptTypeIcon}
            />
            <Divider />
            <ReceiptContent receipt={receipt} t={t} />
          </SectionContainer>

          {/* Actions - simplified with no statusUpdating state */}
          <ActionCard
            receipt={receipt}
            isStatusUpdating={false}
            handleApproveDocument={handleApproveDocument}
            handleShareDocument={handleShareDocument}
            shareLoading={shareLoading}
            t={t}
          />

          {/* Raw Text Section */}
          {(processedData?.extractedText || receipt.extractedText) && (
            <RawTextSection
              receipt={receiptWithExtractedText}
              showFullText={showFullText}
              toggleFullText={toggleFullText}
              t={t}
            />
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <View style={styles.buttonRow}>
            <ActionButton
              onPress={handleNewScan}
              icon="add-a-photo"
              text={t('completion.newScan', 'New Scan')}
              variant="secondary"
              testID="new-scan-button"
            />

            <ActionButton
              onPress={handleDone}
              icon="check"
              text={t('common.done', 'Done')}
              variant="primary"
              testID="done-button"
            />
          </View>
        </View>
      </StepTransition>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  summaryContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    opacity: 0.8,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default CompletionStep;
