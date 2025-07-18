// src/components/camera/workflow/steps/CompletionStep.tsx

import { useAppTheme } from '@/src/hooks/useAppTheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Alert, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraFlow } from '../../../../hooks/useCameraFlow';
import { Receipt } from '../../../../types/ReceiptInterfaces';
import { SectionContainer } from '../../CameraUIComponents'; // Import SectionContainer from correct source
import { 
  ReceiptHeader,
  ReceiptContent,
  ActionCard,
  RawTextSection,
  Divider
} from '../../ReportComponents'; // Import other components from ReportComponents
import StepTransition from '../StepTransition';
import { BaseCameraStepProps } from '../../../../types/component_props';

/**
 * CompletionStep Component - Final step showing completed receipt
 * Migrated to use camera flow state exclusively
 */
export const CompletionStep: React.FC<BaseCameraStepProps> = ({ 
  flowId, 
  onNext, 
  onBack, 
  onCancel, 
  onError,
  testID = 'completion-step'
}) => {
  const { 
    getCurrentDraft,
    getCurrentImage,
    getCurrentProcessedData,
    getFlowMetrics,
    completeFlow,
    resetFlow
    // Removed currentFlow - it was unused
  } = useCameraFlow();
  
  const { 
    backgroundColor, 
    surfaceColor, 
    textColor, 
    secondaryTextColor,
    primaryColor,
    borderColor,
    successColor
  } = useAppTheme();
  
  const { t } = useTranslation();
  const router = useRouter();

  // Local UI state
  const [shareLoading, setShareLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [completionAnimationShown, setCompletionAnimationShown] = useState(false);

  // Get data from flow state
  const receipt = getCurrentDraft();
  const imageUri = getCurrentImage();
  const processedData = getCurrentProcessedData();
  const flowMetrics = getFlowMetrics();

  // Move styles declaration here to fix hoisting issue
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      fontSize: 16,
      textAlign: 'center',
    },
    header: {
      alignItems: 'center',
      padding: 24,
      backgroundColor: surfaceColor,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    successIcon: {
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: textColor,
      textAlign: 'center',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: secondaryTextColor,
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
      backgroundColor: surfaceColor,
      borderRadius: 12,
      marginBottom: 16,
      padding: 16,
    },
    summaryContainer: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: surfaceColor,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: successColor,
    },
    summaryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: successColor,
      marginBottom: 8,
    },
    summaryText: {
      fontSize: 12,
      color: secondaryTextColor,
      lineHeight: 16,
    },
    buttonContainer: {
      padding: 20,
      backgroundColor: surfaceColor,
      borderTopWidth: 1,
      borderTopColor: borderColor,
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
      backgroundColor: primaryColor,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
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
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: primaryColor,
    },
    bottomSpacing: {
      height: 80, // Space for button container
    },
  });

  // Validate required data
  useEffect(() => {
    if (!receipt) {
      onError({
        step: 'report',
        code: 'MISSING_RECEIPT_DATA',
        message: 'Receipt data not available',
        userMessage: 'No receipt data to display. Please complete the verification step.',
        timestamp: Date.now(),
        retryable: true,
      });
    }
  }, [receipt, onError]);

  // Show completion animation once
  useEffect(() => {
    if (receipt && !completionAnimationShown) {
      setCompletionAnimationShown(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {
        // Ignore haptic errors
      });
    }
  }, [receipt, completionAnimationShown]);

  // Early return if no receipt data
  if (!receipt) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} testID={testID}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textColor }]}>
            {t('completion.loading', 'Loading receipt data...')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Format date for display
   */
  const formatDate = (date?: string): string => {
    if (!date) return t('completion.dateNotAvailable', 'Date not available');
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return date;
    }
  };

  /**
   * Format time for display
   */
  const formatTime = (date?: string): string => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleTimeString();
    } catch {
      return '';
    }
  };

  /**
   * Get icon for receipt type
   */
  const getReceiptTypeIcon = (type?: string): string => {
    switch (type) {
      case 'Fuel':
        return 'local-gas-station';
      case 'Maintenance':
        return 'build';
      default:
        return 'receipt';
    }
  };

  /**
   * Handle completion and navigation to home
   */
  const handleDone = async () => {
    try {
      console.log('[CompletionStep] Completing flow and navigating to home');
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Complete the flow with proper cleanup
      const result = await completeFlow();
      
      if (result.success) {
        console.log('[CompletionStep] Flow completed successfully');
        
        // Navigate to home
        router.replace('/home');
      } else {
        throw new Error(result.error || 'Failed to complete flow');
      }
    } catch (error) {
      console.error('[CompletionStep] Failed to complete flow:', error);
      onError({
        step: 'report',
        code: 'COMPLETION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to complete receipt process',
        userMessage: 'Failed to complete the process. Please try again.',
        timestamp: Date.now(),
        retryable: true,
      });
    }
  };

  /**
   * Handle starting new scan
   */
  const handleNewScan = async () => {
    try {
      console.log('[CompletionStep] Starting new scan');
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Complete current flow first
      const result = await completeFlow();
      
      if (result.success) {
        // Reset flow state for new session
        resetFlow();
        
        // Navigate to camera capture
        router.replace('/camera');
      } else {
        throw new Error(result.error || 'Failed to complete current flow');
      }
    } catch (error) {
      console.error('[CompletionStep] Failed to start new scan:', error);
      onError({
        step: 'report',
        code: 'NEW_SCAN_FAILED',
        message: error instanceof Error ? error.message : 'Failed to start new scan',
        userMessage: 'Failed to start new scan. Please try again.',
        timestamp: Date.now(),
        retryable: true,
      });
    }
  };

  /**
   * Handle sharing receipt
   */
  const handleShareDocument = async () => {
    if (!receipt) return;

    try {
      setShareLoading(true);
      console.log('[CompletionStep] Sharing receipt document');

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          t('completion.shareErrorTitle', 'Share Error'),
          t('completion.shareNotAvailable', 'Sharing is not available on this device.')
        );
        return;
      }

      // Share the image if available, otherwise share text content
      if (imageUri) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/jpeg',
          dialogTitle: t('completion.shareTitle', 'Receipt Report')
        });
      } else {
        // Create a text file with receipt content
        const shareContent = generateShareMessage(receipt);
        // Note: For text sharing, you might need to create a temporary file
        // or use a different sharing method depending on your requirements
        console.log('Share content:', shareContent);
        Alert.alert(
          t('completion.shareTitle', 'Receipt Report'),
          shareContent
        );
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('[CompletionStep] Receipt shared successfully');
    } catch (error) {
      console.error('[CompletionStep] Share failed:', error);
      Alert.alert(
        t('completion.shareErrorTitle', 'Share Error'),
        t('completion.shareErrorMessage', 'Failed to share receipt. Please try again.')
      );
    } finally {
      setShareLoading(false);
    }
  };

  /**
   * Handle approving document status
   */
  const handleApproveDocument = async () => {
    if (!receipt) return;

    try {
      setStatusUpdating(true);
      console.log('[CompletionStep] Updating receipt status to approved');

      // Create updated receipt with approved status
      const updatedReceipt: Receipt = {
        ...receipt,
        status: 'Approved',
        timestamp: new Date().toISOString(),
      };

      // Here you would typically call a service to update the receipt
      // For now, we'll simulate the update and log it
      await new Promise(resolve => setTimeout(resolve, 500));

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      console.log('[CompletionStep] Receipt status updated successfully:', updatedReceipt.status);
    } catch (error) {
      console.error('[CompletionStep] Failed to update status:', error);
      Alert.alert(
        t('completion.statusErrorTitle', 'Status Update Error'),
        t('completion.statusErrorMessage', 'Failed to update receipt status. Please try again.')
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  /**
   * Generate share message content
   */
  const generateShareMessage = (receipt: Receipt): string => {
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
  };

  /**
   * Toggle full text display
   */
  const toggleFullText = () => {
    setShowFullText(!showFullText);
  };

  /**
   * Get processing summary for display
   */
  const getProcessingSummary = () => {
    if (!flowMetrics) return null;

    return {
      totalTime: flowMetrics.totalDuration || 0,
      processingSteps: flowMetrics.stepDurations || {},
      confidence: processedData?.confidence || 0,
    };
  };

  const processingSummary = getProcessingSummary();

  // Create receipt with extracted text for RawTextSection
  const receiptWithExtractedText = {
    ...receipt,
    extractedText: processedData?.extractedText || receipt.extractedText
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} testID={testID}>
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
          {processingSummary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>
                {t('completion.processingSummary', 'Processing Summary')}
              </Text>
              <Text style={styles.summaryText}>
                {t('completion.processedIn', 'Processed in {{time}}ms with {{confidence}}% confidence', {
                  time: Math.round(processingSummary.totalTime),
                  confidence: Math.round(processingSummary.confidence * 100)
                })}
              </Text>
            </View>
          )}

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

          {/* Actions */}
          <ActionCard
            receipt={receipt}
            isStatusUpdating={statusUpdating}
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

          {/* Spacing for button container */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleNewScan}
              testID="new-scan-button"
            >
              <MaterialIcons name="add-a-photo" size={20} color={primaryColor} />
              <Text style={styles.secondaryButtonText}>
                {t('completion.newScan', 'New Scan')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleDone}
              testID="done-button"
            >
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {t('common.done', 'Done')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </StepTransition>
    </SafeAreaView>
  );
};

export default CompletionStep;