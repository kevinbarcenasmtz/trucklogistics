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

  // Parse receipt data from flow
  const { receipt, flowId } = useMemo(() => {
    if (!RouteTypeGuards.hasFlowId(params) || !activeFlow || activeFlow.id !== params.flowId) {
      return {
        receipt: null,
        flowId: null,
      };
    }

    return {
      receipt: activeFlow.receiptDraft as Receipt,
      flowId: activeFlow.id,
    };
  }, [params, activeFlow]);

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

  const handleStatusChange = async () => {
    if (!receipt) return;

    setIsStatusUpdating(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const newStatus = receipt.status === 'Approved' ? 'Pending' : 'Approved';
      await DocumentStorage.updateReceiptStatus(receipt.id, newStatus);

      // Update local state would go here if needed
      Alert.alert(
        t('success', 'Success'),
        t('report.statusUpdated', 'Receipt status updated')
      );
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert(
        t('error', 'Error'),
        t('report.statusError', 'Failed to update status')
      );
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleShare = async () => {
    if (!receipt) return;

    setShareLoading(true);
    try {
      const message = `Receipt from ${receipt.vendorName || 'Unknown Vendor'}\n` +
        `Amount: ${receipt.amount}\n` +
        `Date: ${new Date(receipt.date).toLocaleDateString()}\n` +
        `Vehicle: ${receipt.vehicle}\n` +
        `Type: ${receipt.type}`;

      await Share.share({
        message,
        title: t('report.shareTitle', 'Receipt Details'),
      });
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setShareLoading(false);
    }
  };

  const handleDone = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Complete the flow
      if (flowId) {
        await completeFlow();
      }

      // Navigate back to main screen
      router.replace('/');
    } catch (error) {
      console.error('Failed to complete flow:', error);
      router.replace('/');
    }
  };

  const handleNewScan = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Complete current flow
      if (flowId) {
        await completeFlow();
      }

      // Start new scan
      router.replace('/camera');
    } catch (error) {
      console.error('Failed to start new scan:', error);
      router.replace('/camera');
    }
  };

  if (!receipt) {
    return <LoadingView t={t} />;
  }

  return (
    <CameraNavigationGuard targetStep="report">
      <View style={[styles.container, { backgroundColor }]}>
        <ScreenHeader
          title={t('report.title', 'Receipt Saved')}
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
<StatusBanner 
  status={receipt.status}
  successText={t('report.approved', 'Approved')}
  pendingText={t('report.pending', 'Pending')}
/>
<ReceiptHeader 
  receipt={receipt}
  formatDate={(date) => date ? new Date(date).toLocaleDateString() : ''}
  formatTime={(date) => date ? new Date(date).toLocaleTimeString() : ''}
  getReceiptTypeIcon={(type) => {
    switch(type) {
      case 'Fuel': return 'local-gas-station';
      case 'Maintenance': return 'build';
      default: return 'receipt';
    }
  }}
/>
<ReceiptContent receipt={receipt} t={t} />
            <Divider />

            <RawTextSection
  receipt={receipt}  // Changed from text={receipt.extractedText}
  showFullText={showFullText}
  toggleFullText={() => setShowFullText(!showFullText)}  // Changed from onToggle
  t={t}
/>
            <View style={styles.actions}>
            <ActionCard
  receipt={receipt}
  isStatusUpdating={isStatusUpdating}
  handleApproveDocument={handleStatusChange}
  handleShareDocument={handleShare}
  shareLoading={shareLoading}
  t={t}
/>
            </View>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
        <FooterButton onPress={handleDone} t={t} />
        <FooterButton onPress={handleNewScan} t={t} />
        </View>
      </View>
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
    paddingBottom: verticalScale(150),
  },
  actions: {
    marginTop: verticalScale(24),
    gap: verticalScale(12),
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: horizontalScale(16),
    paddingBottom: verticalScale(30),
    gap: verticalScale(12),
  },
});