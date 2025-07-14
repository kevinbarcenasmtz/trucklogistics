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

  // Parse receipt data from flow or legacy params
  const { receiptData, imageUri, flowId, isValidNavigation } = useMemo(() => {
    // Check if we have a flow ID (new navigation)
    if (RouteTypeGuards.hasFlowId(params) && activeFlow?.id === params.flowId) {
      const flow = activeFlow;
      
      if (!flow.receiptDraft) {
        console.warn('Flow found but no receipt draft available');
        return {
          receiptData: null,
          imageUri: flow.imageUri,
          flowId: flow.id,
          isValidNavigation: false,
        };
      }

      return {
        receiptData: flow.receiptDraft as Receipt,
        imageUri: flow.imageUri,
        flowId: flow.id,
        isValidNavigation: true,
      };
    }

    // Check for legacy parameters
    if (RouteTypeGuards.hasLegacyReceipt(params)) {
      try {
        const legacyReceipt = JSON.parse(params.receipt) as Receipt;
        const legacyImageUri = RouteTypeGuards.hasImageUri(params) ? params.uri : legacyReceipt.imageUri;
        
        return {
          receiptData: legacyReceipt,
          imageUri: legacyImageUri,
          flowId: null,
          isValidNavigation: true,
        };
      } catch (error) {
        console.error('Failed to parse legacy receipt data:', error);
        return {
          receiptData: null,
          imageUri: null,
          flowId: null,
          isValidNavigation: false,
        };
      }
    }

    // Check if we have an active flow without params (direct navigation)
    if (activeFlow?.receiptDraft) {
      return {
        receiptData: activeFlow.receiptDraft as Receipt,
        imageUri: activeFlow.imageUri,
        flowId: activeFlow.id,
        isValidNavigation: true,
      };
    }

    return {
      receiptData: null,
      imageUri: null,
      flowId: null,
      isValidNavigation: false,
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

    // Update flow state if we have an active flow
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
      // Provide haptic feedback
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (err) {
        console.warn('Haptic feedback not supported:', err);
      }

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

        // Navigate to report with flow ID
        router.push({
          pathname: '/camera/report',
          params: { flowId: flowId },
        });
      } else {
        // Fallback to legacy navigation
        router.push({
          pathname: '/camera/report',
          params: { receipt: JSON.stringify(finalReceipt) },
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

  if (!isValidNavigation || !localReceiptData || !imageUri) {
    // Let navigation guard handle invalid states
    return null;
  }

  return (
    <CameraNavigationGuard targetStep="verification">
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScreenHeader
          title={t('verifyReceipt', 'Verify Receipt')}
          onBack={() => router.back()}
        />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <InfoCard />

            <ReceiptImagePreview
              imageUri={imageUri}
              onPress={() => setIsModalVisible(true)}
            />

            <FormContainer title={t('receiptDetails', 'Receipt Details')}>
              <EditField
                field="date"
                value={localReceiptData.date || ''}
                onChange={(value) => updateField('date', value)}
                placeholder={getFieldPlaceholder('date')}
                icon={getFieldIcon('date')}
                label={t('date', 'Date')}
                isActive={activeField === 'date'}
                onActivate={() => setActiveField('date')}
              />

              <EditField
                field="amount"
                value={localReceiptData.amount || ''}
                onChange={(value) => updateField('amount', value)}
                placeholder={getFieldPlaceholder('amount')}
                icon={getFieldIcon('amount')}
                label={t('amount', 'Amount')}
                keyboardType="decimal-pad"
                isActive={activeField === 'amount'}
                onActivate={() => setActiveField('amount')}
              />

              <EditField
                field="type"
                value={localReceiptData.type || ''}
                onChange={(value) => updateField('type', value)}
                placeholder={getFieldPlaceholder('type')}
                icon={getFieldIcon('type')}
                label={t('type', 'Type')}
                isActive={activeField === 'type'}
                onActivate={() => setActiveField('type')}
              />

              <EditField
                field="vendorName"
                value={localReceiptData.vendorName || ''}
                onChange={(value) => updateField('vendorName', value)}
                placeholder={getFieldPlaceholder('vendorName')}
                icon={getFieldIcon('vendorName')}
                label={t('vendor', 'Vendor')}
                isActive={activeField === 'vendorName'}
                onActivate={() => setActiveField('vendorName')}
              />

              <EditField
                field="vehicle"
                value={localReceiptData.vehicle || ''}
                onChange={(value) => updateField('vehicle', value)}
                placeholder={getFieldPlaceholder('vehicle')}
                icon={getFieldIcon('vehicle')}
                label={t('vehicle', 'Vehicle')}
                isActive={activeField === 'vehicle'}
                onActivate={() => setActiveField('vehicle')}
              />

              <EditField
                field="location"
                value={localReceiptData.location || ''}
                onChange={(value) => updateField('location', value)}
                placeholder={getFieldPlaceholder('location')}
                icon={getFieldIcon('location')}
                label={t('location', 'Location')}
                isActive={activeField === 'location'}
                onActivate={() => setActiveField('location')}
              />
            </FormContainer>

            <ViewRawTextButton
              onPress={() => {
                if (flowId) {
                  router.push({
                    pathname: '/camera/imagedetails',
                    params: { flowId: flowId },
                  });
                } else {
                  router.push({
                    pathname: '/camera/imagedetails',
                    params: { uri: imageUri },
                  });
                }
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: horizontalScale(16),
    paddingBottom: verticalScale(100), // Space for save button
    gap: verticalScale(16),
  },
});