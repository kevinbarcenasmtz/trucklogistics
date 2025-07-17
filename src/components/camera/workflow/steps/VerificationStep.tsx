import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { useCameraFlow } from '../../../../store/cameraFlowStore';
import { StepProps } from '../types';
import StepTransition from '../StepTransition';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { ActionButton } from '../../CameraUIComponents';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  InfoCard,
  ReceiptImagePreview,
  EditField,
  FormContainer,
  ViewRawTextButton,
  SaveButton
} from '../../VerificationComponents';
import { Receipt } from '@/src/types/ReceiptInterfaces';
import { DocumentStorage } from '@/src/services/DocumentStorage';
import { Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const VerificationStep: React.FC<StepProps> = ({
  flowId,
  onNext,
  onBack,
  onCancel,
  onError
}) => {
  const { activeFlow, updateFlow } = useCameraFlow();
  const { backgroundColor, surfaceColor, textColor, borderColor } = useAppTheme();
  const { t } = useTranslation();

  // UI-only state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get receipt draft from flow (no local state)
  const receiptDraft = activeFlow?.receiptDraft;
  const imageUri = activeFlow?.imageUri;

  if (!receiptDraft || !imageUri) {
    onError({
      code: 'MISSING_RECEIPT_DATA',
      message: 'Receipt data not available',
      step: 'verification',
      retry: true
    });
    return null;
  }

  // Field update handler - directly updates flow
  const handleFieldChange = (field: keyof Receipt, value: string) => {
    updateFlow({
      receiptDraft: {
        ...receiptDraft,
        [field]: value
      }
    });
  };

  // Save receipt and proceed
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Save receipt to storage
      await DocumentStorage.saveReceipt(receiptDraft);

      // Update flow with completion
      updateFlow({
        receiptDraft: receiptDraft,
        currentStep: 'report'
      });

      // Advance to completion step
      onNext();
      
    } catch (error) {
      onError({
        code: 'RECEIPT_SAVE_FAILED',
        message: 'Failed to save receipt',
        step: 'verification',
        retry: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    Alert.alert(
      t('verification.goBack', 'Go Back'),
      t('verification.goBackMessage', 'Are you sure you want to go back? Any changes will be lost.'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { text: t('common.goBack', 'Go Back'), style: 'destructive', onPress: onBack }
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      t('camera.cancelTitle', 'Cancel Process'),
      t('camera.cancelMessage', 'Are you sure you want to cancel? All progress will be lost.'),
      [
        { text: t('camera.continueScan', 'Continue'), style: 'cancel' },
        { text: t('common.cancel', 'Cancel'), style: 'destructive', onPress: onCancel }
      ]
    );
  };

  const handleViewRawText = () => {
    Alert.alert(
      t('verification.extractedText', 'Extracted Text'),
      receiptDraft.extractedText,
      [{ text: t('common.close', 'Close') }]
    );
  };

  return (
    <StepTransition entering={true}>
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        {/* Info Card */}
        <InfoCard />

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Receipt Image Preview */}
          <View style={styles.section}>
            <ReceiptImagePreview
              imageUri={imageUri}
              onPress={() => setIsModalVisible(true)}
            />
          </View>

          {/* Basic Information */}
          <FormContainer title={t('verification.basicInfo', 'Basic Information')}>
            <EditField
              field="date"
              value={receiptDraft.date}
              onChange={(value) => handleFieldChange('date', value)}
              isActive={activeField === 'date'}
              onActivate={() => setActiveField('date')}
              icon="event"
              label={t('verification.date', 'Date')}
              placeholder={t('verification.datePlaceholder', 'Enter date')}
            />

            <EditField
              field="amount"
              value={receiptDraft.amount}
              onChange={(value) => handleFieldChange('amount', value)}
              isActive={activeField === 'amount'}
              onActivate={() => setActiveField('amount')}
              icon="attach-money"
              label={t('verification.amount', 'Amount')}
              placeholder={t('verification.amountPlaceholder', 'Enter amount')}
              keyboardType="decimal-pad"
            />

            <EditField
              field="vendorName"
              value={receiptDraft.vendorName || ''}
              onChange={(value) => handleFieldChange('vendorName', value)}
              isActive={activeField === 'vendorName'}
              onActivate={() => setActiveField('vendorName')}
              icon="store"
              label={t('verification.vendor', 'Vendor')}
              placeholder={t('verification.vendorPlaceholder', 'Enter vendor name')}
            />
          </FormContainer>

          {/* Receipt Details */}
          <FormContainer title={t('verification.details', 'Receipt Details')}>
            <EditField
              field="type"
              value={receiptDraft.type}
              onChange={(value) => handleFieldChange('type', value as Receipt['type'])}
              isActive={activeField === 'type'}
              onActivate={() => setActiveField('type')}
              icon="category"
              label={t('verification.type', 'Type')}
              placeholder={t('verification.typePlaceholder', 'Fuel, Maintenance, Other')}
            />

            <EditField
              field="vehicle"
              value={receiptDraft.vehicle}
              onChange={(value) => handleFieldChange('vehicle', value)}
              isActive={activeField === 'vehicle'}
              onActivate={() => setActiveField('vehicle')}
              icon="directions-car"
              label={t('verification.vehicle', 'Vehicle')}
              placeholder={t('verification.vehiclePlaceholder', 'Enter vehicle')}
            />

            <EditField
              field="location"
              value={receiptDraft.location || ''}
              onChange={(value) => handleFieldChange('location', value)}
              isActive={activeField === 'location'}
              onActivate={() => setActiveField('location')}
              icon="location-on"
              label={t('verification.location', 'Location')}
              placeholder={t('verification.locationPlaceholder', 'Enter location')}
            />
          </FormContainer>

          {/* View Raw Text Button */}
          <ViewRawTextButton onPress={handleViewRawText} />

          {/* Spacing for button container */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.buttonContainer, { backgroundColor: surfaceColor, borderTopColor: borderColor }]}>
          <View style={styles.buttonRow}>
            <ActionButton
              title={t('common.back', 'Back')}
              icon="arrow-back"
              onPress={handleBack}
              backgroundColor={surfaceColor}
              color={textColor}
              style={styles.secondaryButton}
            />
            
            <SaveButton
              onPress={handleSave}
              isLoading={isSaving}
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

        {/* Image Preview Modal */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Image
                source={{ uri: imageUri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              <ActionButton
                title={t('common.close', 'Close')}
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              />
            </View>
          </View>
        </Modal>
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
  },
  section: {
    marginBottom: 16,
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
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
  },
  cancelButton: {
    marginTop: 8,
  },
  bottomSpacing: {
    height: 100, // Space for button container
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.95,
    height: height * 0.95,
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: '90%',
  },
  closeButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
});

export default VerificationStep;