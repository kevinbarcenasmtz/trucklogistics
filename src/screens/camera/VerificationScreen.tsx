// src/screens/camera/VerificationScreen.tsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

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
import { CameraNavigationGuard } from '@/src/components/camera/workflow/CameraNavigationGuard';
import { useCameraFlow } from '../../store/cameraFlowStore';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { DocumentStorage } from '@/src/services/DocumentStorage';
import { horizontalScale, verticalScale } from '@/src/theme';
import { Receipt } from '@/src/types/ReceiptInterfaces';
import { RouteTypeGuards } from '@/src/types/camera_navigation';

export default function VerificationScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { backgroundColor } = useAppTheme();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Camera flow state
  const { activeFlow, updateFlow } = useCameraFlow();

  // Local component state
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Parse receipt data from flow
  const { receiptData, imageUri, flowId } = useMemo(() => {
    if (!RouteTypeGuards.hasFlowId(params) || !activeFlow || activeFlow.id !== params.flowId) {
      return {
        receiptData: null,
        imageUri: null,
        flowId: null,
      };
    }

    return {
      receiptData: activeFlow.receiptDraft as Receipt,
      imageUri: activeFlow.imageUri,
      flowId: activeFlow.id,
    };
  }, [params, activeFlow]);

  // Local receipt state for editing
  const [localReceiptData, setLocalReceiptData] = useState<Receipt | null>(receiptData);

  // Update local state when receiptData changes
  useEffect(() => {
    setLocalReceiptData(receiptData);
  }, [receiptData]);

  // Start animations on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const updateField = (field: keyof Receipt, value: string) => {
    if (!localReceiptData) return;

    const updatedReceipt = {
      ...localReceiptData,
      [field]: value,
    };

    setLocalReceiptData(updatedReceipt);

    // Update flow state
    if (activeFlow && flowId) {
      updateFlow({ receiptDraft: updatedReceipt });
    }
  };

  const handleSave = async () => {
    if (!localReceiptData || !imageUri) {
      Alert.alert(t('error', 'Error'), t('missingData', 'Missing required data'));
      return;
    }

    setIsSaving(true);

    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Prepare final receipt data
      const finalReceipt: Receipt = {
        ...localReceiptData,
        status: 'Pending',
        timestamp: new Date().toISOString(),
        imageUri: imageUri,
      };

      // Save to storage
      await DocumentStorage.saveReceipt(finalReceipt);

      // Update flow to completed state
      if (activeFlow && flowId) {
        updateFlow({ 
          currentStep: 'report',
          receiptDraft: finalReceipt,
        });

        // Navigate to report
        router.push({
          pathname: '/camera/report',
          params: { flowId: flowId },
        });
      }
    } catch (error) {
      console.error('Failed to save receipt:', error);
      Alert.alert(
        t('error', 'Error'),
        t('saveError', 'Failed to save receipt. Please try again.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!localReceiptData || !imageUri) {
    return null;
  }

  return (
    <CameraNavigationGuard targetStep="verification">
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScreenHeader
          title={t('verification.title', 'Verify Details')}
          onBack={() => router.back()}
        />

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <ReceiptImagePreview 
              imageUri={imageUri} 
              onPress={() => setIsModalVisible(true)} 
            />

            <InfoCard/>

            <FormContainer title={t('verification.receiptDetails', 'Receipt Details')}>
              <EditField
                field='type'
                icon={getFieldIcon('type')}
                label={t('fields.type', 'Type')}
                value={localReceiptData.type}
                placeholder={getFieldPlaceholder('type')}
                isActive={activeField === 'type'}
                onActivate={() => setActiveField('type')}
                onChange={(value) => updateField('type', value as Receipt['type'])}
              />

              <EditField
                field='amount'
                icon={getFieldIcon('amount')}
                label={t('fields.amount', 'Amount')}
                value={localReceiptData.amount}
                placeholder={getFieldPlaceholder('amount')}
                isActive={activeField === 'amount'}
                onActivate={() => setActiveField('amount')}
                onChange={(value) => updateField('amount', value)}
                keyboardType="decimal-pad"
              />

              <EditField
                field='vendorName'
                icon={getFieldIcon('vendorName')}
                label={t('fields.vendor', 'Vendor')}
                value={localReceiptData.vendorName || ''}
                placeholder={getFieldPlaceholder('vendorName')}
                isActive={activeField === 'vendorName'}
                onActivate={() => setActiveField('vendorName')}
                onChange={(value) => updateField('vendorName', value)}
              />

              <EditField
                field='vehicle'
                icon={getFieldIcon('vehicle')}
                label={t('fields.vehicle', 'Vehicle')}
                value={localReceiptData.vehicle}
                placeholder={getFieldPlaceholder('vehicle')}
                isActive={activeField === 'vehicle'}
                onActivate={() => setActiveField('vehicle')}
                onChange={(value) => updateField('vehicle', value)}
              />

              <EditField
                field='location'
                icon={getFieldIcon('location')}
                label={t('fields.location', 'Location')}
                value={localReceiptData.location || ''}
                placeholder={getFieldPlaceholder('location')}
                isActive={activeField === 'location'}
                onActivate={() => setActiveField('location')}
                onChange={(value) => updateField('location', value)}
              />

              <EditField
                field='date'
                icon={getFieldIcon('date')}
                label={t('fields.date', 'Date')}
                value={localReceiptData.date}
                placeholder={getFieldPlaceholder('date')}
                isActive={activeField === 'date'}
                onActivate={() => setActiveField('date')}
                onChange={(value) => updateField('date', value)}
              />
            </FormContainer>

            <ViewRawTextButton 
              onPress={() => {
                Alert.alert(
                  t('verification.extractedText', 'Extracted Text'),
                  localReceiptData.extractedText
                );
              }} 
            />
          </Animated.View>
        </ScrollView>

        <SaveButton onPress={handleSave} isLoading={isSaving} />

        <ImagePreviewModal
          visible={isModalVisible}
          imageUri={imageUri}
          onClose={() => setIsModalVisible(false)}
        />
      </KeyboardAvoidingView>
    </CameraNavigationGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: horizontalScale(16),
    paddingBottom: verticalScale(100),
  },
});