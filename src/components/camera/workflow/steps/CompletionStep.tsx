import { useAppTheme } from '@/src/hooks/useAppTheme';
import { DocumentStorage } from '@/src/services/DocumentStorage';
import { Receipt } from '@/src/types/ReceiptInterfaces';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraFlow } from '../../../../store/cameraFlowStore';
import { ActionButton, SectionContainer } from '../../CameraUIComponents';
import {
  ActionCard,
  Divider,
  RawTextSection,
  ReceiptContent,
  ReceiptHeader,
} from '../../ReportComponents';
import StepTransition from '../StepTransition';
import { StepProps } from '../types';

export const CompletionStep: React.FC<StepProps> = ({
  flowId,
  onNext,
  onBack,
  onCancel,
  onError,
}) => {
  const { activeFlow, completeFlow, startFlow, updateFlow } = useCameraFlow();
  const { backgroundColor, surfaceColor, textColor, borderColor, primaryColor } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();

  // UI-only state
  const [shareLoading, setShareLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  // Get receipt from flow
  const receipt = activeFlow?.receiptDraft;

  if (!receipt) {
    onError({
      code: 'MISSING_RECEIPT_DATA',
      message: 'Receipt data not available',
      step: 'report',
      retry: true,
    });
    return null;
  }

  // Utility functions for components
  const formatDate = (date?: string): string => {
    if (!date) return t('dateNotAvailable', 'Date not available');
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (date?: string): string => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString();
  };

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

  const handleDone = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Complete the flow
      completeFlow();

      // Navigate to home
      router.replace('/home');
    } catch (error) {
      onError({
        code: 'COMPLETION_FAILED',
        message: 'Failed to complete receipt process',
        step: 'report',
        retry: true,
      });
    }
  };

  const handleNewScan = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Complete current flow
      completeFlow();

      // Start new flow (will prompt for image capture)
      router.replace('/camera');
    } catch (error) {
      onError({
        code: 'NEW_SCAN_FAILED',
        message: 'Failed to start new scan',
        step: 'report',
        retry: true,
      });
    }
  };

  const handleShareDocument = async () => {
    try {
      setShareLoading(true);

      const shareContent = {
        title: t('share.receiptTitle', 'Receipt Report'),
        message: generateShareMessage(receipt),
        url: receipt.imageUri, // Share the image if possible
      };

      const result = await Share.share(shareContent);

      if (result.action === Share.sharedAction) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert(
        t('error.shareTitle', 'Share Error'),
        t('error.shareMessage', 'Failed to share receipt')
      );
    } finally {
      setShareLoading(false);
    }
  };

  const handleApproveDocument = async () => {
    try {
      setStatusUpdating(true);

      // Update receipt status in storage
      await DocumentStorage.updateReceiptStatus(receipt.id, 'Approved');

      // Update flow with new status
      const updatedReceipt = { ...receipt, status: 'Approved' as Receipt['status'] };
      updateFlow({ receiptDraft: updatedReceipt });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Alert.alert(
        t('error.statusTitle', 'Status Update Error'),
        t('error.statusMessage', 'Failed to update receipt status')
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  const generateShareMessage = (receipt: Receipt): string => {
    return `${t('share.receiptFor', 'Receipt for')}: ${receipt.vendorName || t('share.unknownVendor', 'Unknown Vendor')}
${t('share.amount', 'Amount')}: ${receipt.amount}
${t('share.date', 'Date')}: ${new Date(receipt.date).toLocaleDateString()}
${t('share.vehicle', 'Vehicle')}: ${receipt.vehicle}
${t('share.type', 'Type')}: ${receipt.type}
${receipt.location ? `${t('share.location', 'Location')}: ${receipt.location}` : ''}

${t('share.generatedBy', 'Generated by TruckLogistics')}`;
  };

  const toggleFullText = () => {
    setShowFullText(!showFullText);
  };

  return (
    <StepTransition entering={true}>
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: surfaceColor }]}>
          <MaterialIcons name="check-circle" size={48} color={primaryColor} />
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {t('report.title', 'Receipt Processed')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: textColor }]}>
            {t('report.subtitle', 'Review your receipt summary below')}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Receipt Summary */}
          <SectionContainer style={[styles.section, { backgroundColor: surfaceColor }]}>
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
          <RawTextSection
            receipt={receipt}
            showFullText={showFullText}
            toggleFullText={toggleFullText}
            t={t}
          />

          {/* Spacing for button container */}
          <View style={styles.bottomSpacing} />
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
              title={t('report.newScan', 'New Scan')}
              icon="add-a-photo"
              onPress={handleNewScan}
              backgroundColor={surfaceColor}
              color={textColor}
              style={styles.secondaryButton}
            />

            <ActionButton
              title={t('common.done', 'Done')}
              icon="check"
              onPress={handleDone}
              style={styles.primaryButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </StepTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 8,
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
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
  },
  bottomSpacing: {
    height: 80, // Space for button container
  },
});

export default CompletionStep;
