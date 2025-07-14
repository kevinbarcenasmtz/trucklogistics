// src/screens/camera/ReportScreen.tsx
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { ScreenHeader, StatusBanner } from '@/src/components/camera/CameraUIComponents';
import {
  ActionCard,
  Divider,
  FooterButton,
  LoadingView,
  RawTextSection,
  ReceiptContent,
  ReceiptHeader,
} from '@/src/components/camera/ReportComponents';
import { CameraNavigationGuard } from '@/src/components/camera/workflow/CameraNavigationGuard';
import { useCameraFlow } from '../../store/cameraFlowStore';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { DocumentStorage } from '@/src/services/DocumentStorage';
import { horizontalScale, verticalScale, moderateScale } from '@/src/theme';
import { Receipt } from '@/src/types/ReceiptInterfaces';
import { RouteTypeGuards } from '@/src/types/camera_navigation';

export default function ReportScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { backgroundColor } = useAppTheme();

  // Camera flow state
  const { activeFlow, completeFlow } = useCameraFlow();

  // Local component state
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Parse receipt data from flow or legacy params
  const { receipt, flowId, isValidNavigation } = useMemo(() => {
    // Check if we have a flow ID (new navigation)
    if (RouteTypeGuards.hasFlowId(params) && activeFlow?.id === params.flowId) {
      const flow = activeFlow;
      
      if (!flow.receiptDraft) {
        console.warn('Flow found but no receipt draft available');
        return {
          receipt: null,
          flowId: flow.id,
          isValidNavigation: false,
        };
      }

      return {
        receipt: flow.receiptDraft as Receipt,
        flowId: flow.id,
        isValidNavigation: true,
      };
    }

    // Check for legacy parameters
    if (RouteTypeGuards.hasLegacyReceipt(params)) {
      try {
        const legacyReceipt = JSON.parse(params.receipt) as Receipt;
        
        return {
          receipt: legacyReceipt,
          flowId: null,
          isValidNavigation: true,
        };
      } catch (error) {
        console.error('Failed to parse legacy receipt data:', error);
        return {
          receipt: null,
          flowId: null,
          isValidNavigation: false,
        };
      }
    }

    // Check if we have an active flow without params (direct navigation)
    if (activeFlow?.receiptDraft) {
      return {
        receipt: activeFlow.receiptDraft as Receipt,
        flowId: activeFlow.id,
        isValidNavigation: true,
      };
    }

    return {
      receipt: null,
      flowId: null,
      isValidNavigation: false,
    };
  }, [params, activeFlow]);

  // Animate components in on mount
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

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return t('noDate', 'No date');
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (timestamp?: string): string => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Get receipt type icon
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

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!receipt) return;

    setIsStatusUpdating(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.warn('Haptic feedback not supported:', err);
    }

    try {
      const newStatus = receipt.status === 'Approved' ? 'Pending' : 'Approved';
      await DocumentStorage.updateReceiptStatus(receipt.id, newStatus);
      
      Alert.alert(
        t('statusUpdated', 'Status Updated'),
        t('statusUpdatedMessage', `Receipt status changed to ${newStatus}`)
      );
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert(
        t('error', 'Error'),
        t('statusUpdateError', 'Failed to update receipt status')
      );
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Handle sharing
  const handleShare = async () => {
    if (!receipt) return;

    setShareLoading(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.warn('Haptic feedback not supported:', err);
    }

    try {
      const shareContent = `Receipt Details:
Date: ${formatDate(receipt.date)}
Amount: ${receipt.amount}
Vendor: ${receipt.vendorName || 'Unknown'}
Vehicle: ${receipt.vehicle}
Type: ${receipt.type}
Status: ${receipt.status}`;

      await Share.share({
        message: shareContent,
        title: t('receiptDetails', 'Receipt Details'),
      });
    } catch (error) {
      console.error('Failed to share:', error);
      Alert.alert(
        t('error', 'Error'),
        t('shareError', 'Failed to share receipt')
      );
    } finally {
      setShareLoading(false);
    }
  };

  // Handle done button
  const handleDone = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.warn('Haptic feedback not supported:', err);
    }

    // Complete the flow if we have one
    if (flowId && activeFlow) {
      completeFlow();
    }

    // Navigate to home or reports
    router.replace('/reports');
  };

  // Toggle full text display
  const toggleFullText = () => {
    setShowFullText(!showFullText);
  };

  if (!isValidNavigation || !receipt) {
    return (
      <CameraNavigationGuard targetStep="report">
        <LoadingView t={t} />
      </CameraNavigationGuard>
    );
  }

  return (
    <CameraNavigationGuard targetStep="report">
      <View style={[styles.container, { backgroundColor }]}>
        <ScreenHeader
          title={t('receiptReport', 'Receipt Report')}
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
            <StatusBanner
              status={receipt.status}
              successText={t('approved', 'Approved')}
              pendingText={t('pending', 'Pending')}
            />

            <View style={styles.receiptCard}>
              <ReceiptHeader
                receipt={receipt}
                formatDate={formatDate}
                formatTime={formatTime}
                getReceiptTypeIcon={getReceiptTypeIcon}
              />

              <Divider />

              <ReceiptContent receipt={receipt} t={t} />
            </View>

            {receipt.extractedText && (
              <RawTextSection
                receipt={receipt}
                showFullText={showFullText}
                toggleFullText={toggleFullText}
                t={t}
              />
            )}

            <ActionCard
              receipt={receipt}
              isStatusUpdating={isStatusUpdating}
              shareLoading={shareLoading}
              handleApproveDocument={handleStatusUpdate}
              handleShareDocument={handleShare}
              t={t}
            />
          </Animated.View>
        </ScrollView>

        <FooterButton onPress={handleDone} t={t} />
      </View>
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
    paddingBottom: verticalScale(100),
    gap: verticalScale(16),
  },
  receiptCard: {
    padding: horizontalScale(16),
    borderRadius: moderateScale(12),
  },
});