// src/screens/camera/VerificationScreen.tsx
import { ScreenHeader } from '@/src/components/camera/CameraUIComponents';
import {
  EditField,
  FormContainer,
  ImagePreviewModal,
  InfoCard,
  ReceiptImagePreview,
  SaveButton,
  ViewRawTextButton,
  getFieldIcon,
  getFieldPlaceholder,
} from '@/src/components/camera/VerificationComponents';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { DocumentStorage } from '@/src/services/DocumentStorage';
import { horizontalScale, verticalScale } from '@/src/theme';
import { Receipt } from '@/src/types/ReceiptInterfaces';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';

export default function VerificationScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { backgroundColor } = useAppTheme();

  // Parse receipt data from params
  const initialReceipt: Receipt = params.receipt
    ? JSON.parse(params.receipt as string)
    : ({} as Receipt);

  const imageUri = params.uri as string;

  // State for editable receipt data
  const [receiptData, setReceiptData] = useState<Receipt>(initialReceipt);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  // Animation values
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Update field value
  const updateField = (field: keyof Receipt, value: string) => {
    setReceiptData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validate required fields based on actual Receipt interface
  const validateData = (): boolean => {
    const requiredFields: (keyof Receipt)[] = ['date', 'amount', 'type'];
    const missingFields = requiredFields.filter(field => !receiptData[field]);

    if (missingFields.length > 0) {
      // Shake animation for error feedback
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();

      Alert.alert(
        t('validationError', 'Validation Error'),
        t('fillRequiredFields', 'Please fill in all required fields: ') +
          missingFields.map(f => t(f.toString(), f.toString())).join(', ')
      );
      return false;
    }
    return true;
  };

  // Save receipt data
  const handleSave = async () => {
    if (!validateData()) return;

    setIsSaving(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }

    try {
      const savedReceipt = await DocumentStorage.saveReceipt({
        ...receiptData,
        imageUri,
        timestamp: new Date().toISOString(),
        status: 'Pending', // Use correct status value from Receipt interface
      });

      // Success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to report screen
      router.replace({
        pathname: '/(app)/camera/report',
        params: { receipt: JSON.stringify(savedReceipt) },
      });
    } catch (error) {
      console.error('Failed to save receipt:', error);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        t('saveError', 'Save Error'),
        t('saveErrorMessage', 'Failed to save receipt. Please try again.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title={t('verifyReceipt', 'Verify Receipt')} onBack={() => router.back()} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[styles.contentContainer, { transform: [{ translateX: shakeAnimation }] }]}
        >
          <ReceiptImagePreview imageUri={imageUri} onPress={() => setIsModalVisible(true)} />

          <InfoCard />

          <FormContainer title={t('receiptDetails', 'Receipt Details')}>
            <EditField
              field="vendorName"
              value={receiptData.vendorName || ''}
              onChange={value => updateField('vendorName', value)}
              placeholder={getFieldPlaceholder('vendorName', t)}
              icon={getFieldIcon('vendorName')}
              label={t('vendorName', 'Vendor Name')}
              isActive={activeField === 'vendorName'}
              onActivate={() => setActiveField('vendorName')}
            />

            <EditField
              field="amount"
              value={receiptData.amount || ''}
              onChange={value => updateField('amount', value)}
              placeholder={getFieldPlaceholder('amount', t)}
              icon={getFieldIcon('amount')}
              label={t('amount', 'Amount')}
              keyboardType="decimal-pad"
              isActive={activeField === 'amount'}
              onActivate={() => setActiveField('amount')}
            />

            <EditField
              field="date"
              value={receiptData.date || ''}
              onChange={value => updateField('date', value)}
              placeholder={getFieldPlaceholder('date', t)}
              icon={getFieldIcon('date')}
              label={t('date', 'Date')}
              isActive={activeField === 'date'}
              onActivate={() => setActiveField('date')}
            />

            <EditField
              field="type"
              value={receiptData.type || ''}
              onChange={value => updateField('type', value as 'Fuel' | 'Maintenance' | 'Other')}
              placeholder={getFieldPlaceholder('type', t)}
              icon={getFieldIcon('type')}
              label={t('type', 'Type')}
              isActive={activeField === 'type'}
              onActivate={() => setActiveField('type')}
            />

            <EditField
              field="vehicle"
              value={receiptData.vehicle || ''}
              onChange={value => updateField('vehicle', value)}
              placeholder={getFieldPlaceholder('vehicle', t)}
              icon={getFieldIcon('vehicle')}
              label={t('vehicle', 'Vehicle')}
              isActive={activeField === 'vehicle'}
              onActivate={() => setActiveField('vehicle')}
            />

            <EditField
              field="location"
              value={receiptData.location || ''}
              onChange={value => updateField('location', value)}
              placeholder={getFieldPlaceholder('location', t)}
              icon={getFieldIcon('location')}
              label={t('location', 'Location')}
              isActive={activeField === 'location'}
              onActivate={() => setActiveField('location')}
            />
          </FormContainer>

          <ViewRawTextButton
            onPress={() => {
              router.push({
                pathname: '/(app)/camera/imagedetails',
                params: { uri: imageUri },
              });
            }}
          />
        </Animated.View>
      </ScrollView>

      <SaveButton onPress={handleSave} isSaving={isSaving} />

      <ImagePreviewModal
        visible={isModalVisible}
        imageUri={imageUri}
        onClose={() => setIsModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: horizontalScale(16),
    paddingBottom: verticalScale(100), // Space for save button
  },
  contentContainer: {
    gap: verticalScale(16),
  },
});
