// src/screens/camera/ReportScreen.tsx
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
import { useTheme } from '@/src/context/ThemeContext';
import { DocumentStorage } from '@/src/services/DocumentStorage';
import { getThemeStyles, horizontalScale, verticalScale } from '@/src/theme';
import { Receipt } from '@/src/types/ReceiptInterfaces';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export default function ReportScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, themePreference, setTheme } = useTheme(); // Get full theme context
  const themeStyles = getThemeStyles(theme);
  const systemColorScheme = useColorScheme(); // Get system color scheme

  // Parse the receipt data
  const [receipt, setReceipt] = useState<Receipt | null>(
    params.receipt ? JSON.parse(params.receipt as string) : null
  );

  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Listen for system theme changes if using system theme
  useEffect(() => {
    if (themePreference === 'system') {
      // Only update if system theme changes and we're using system preference
      const newTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
      if (theme !== newTheme) {
        setTheme('system'); // This will apply the system theme
      }
    }
  }, [systemColorScheme, themePreference]);

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

  // Toggle theme function - can be connected to a button
  const toggleTheme = useCallback(() => {
    try {
      setTheme(theme === 'dark' ? 'light' : 'dark');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback not supported', error);
    }
  }, [theme, setTheme]);

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    try {
      // Try to parse as ISO date first
      const date = new Date(dateString);

      // Check if valid date
      if (isNaN(date.getTime())) {
        // If not valid ISO date, just return as is
        return dateString;
      }

      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);

      // Check if valid date
      if (isNaN(date.getTime())) {
        return '';
      }

      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  };

  // Handle approval of the document
  const handleApproveDocument = async () => {
    if (!receipt?.id) return;

    setIsStatusUpdating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const updated = await DocumentStorage.updateReceiptStatus(receipt.id, 'Approved');
      if (updated) {
        setReceipt(updated);

        // Success feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        Alert.alert(
          t('success', 'Success'),
          t('receiptApproved', 'Receipt has been approved successfully')
        );
      }
    } catch (error) {
      console.error('Error approving document:', error);

      // Error feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(t('error', 'Error'), t('errorUpdatingStatus', 'Failed to update receipt status'));
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Toggle full text display
  const toggleFullText = () => {
    setShowFullText(!showFullText);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Share document content
  const handleShareDocument = async () => {
    if (!receipt) return;

    setShareLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Create a simple text representation
      const textContent = `
📝 Receipt Report
-----------------------
🏢 Vendor: ${receipt.vendorName || 'Unknown'}
💰 Amount: ${receipt.amount}
📅 Date: ${formatDate(receipt.date)}
🚚 Vehicle: ${receipt.vehicle}
🔤 Type: ${receipt.type}
📍 Location: ${receipt.location || 'Not specified'}
📋 Status: ${receipt.status}
-----------------------
📝 Raw Text:
${receipt.extractedText}

Generated by Trucking Logistics Pro
      `;

      await Share.share({
        message: textContent,
        title: 'Receipt Report',
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sharing document:', error);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(t('error', 'Error'), t('errorSharing', 'Failed to share the receipt'));
    } finally {
      setShareLoading(false);
    }
  };

  // Go back to the reports screen
  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/reports');
  };

  // Get appropriate icon for receipt type
  const getReceiptTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'fuel':
        return 'local-gas-station';
      case 'maintenance':
        return 'build';
      default:
        return 'receipt';
    }
  };

  // If receipt is not loaded yet, show loading screen
  if (!receipt) {
    return <LoadingView t={t} />;
  }

  // Add theme toggle button to header
  const themeToggleButton = (
    <TouchableOpacity
      style={[styles.iconButton, { backgroundColor: themeStyles.colors.darkGrey }]}
      onPress={toggleTheme}
    >
      <Feather
        name={theme === 'dark' ? 'sun' : 'moon'}
        size={20}
        color={themeStyles.colors.white}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.colors.black_grey }]}>
      {/* Header */}
      <ScreenHeader
        title={t('receiptReport', 'Receipt Report')}
        onBack={() => router.back()}
        rightComponent={
          <View style={styles.headerButtons}>
            {themeToggleButton}
            <TouchableOpacity
              style={[
                styles.shareButton,
                { backgroundColor: themeStyles.colors.darkGrey },
                shareLoading && { opacity: 0.6 },
              ]}
              onPress={handleShareDocument}
              disabled={shareLoading}
            >
              {shareLoading ? (
                <ActivityIndicator size="small" color={themeStyles.colors.white} />
              ) : (
                <Feather name="share" size={20} color={themeStyles.colors.white} />
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Status Banner */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <StatusBanner
              status={receipt.status}
              successText={t('approved', 'Approved')}
              pendingText={t('pendingApproval', 'Pending Approval')}
            />
          </Animated.View>

          {/* Receipt Card */}
          <Animated.View
            style={[
              styles.receiptCard,
              {
                backgroundColor: themeStyles.colors.darkGrey,
                ...themeStyles.shadow.md,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <ReceiptHeader
              receipt={receipt}
              formatDate={formatDate}
              formatTime={formatTime}
              getReceiptTypeIcon={getReceiptTypeIcon}
            />

            <Divider />

            <ReceiptContent receipt={receipt} t={t} />
          </Animated.View>

          {/* Raw Text Section */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <RawTextSection
              receipt={receipt}
              showFullText={showFullText}
              toggleFullText={toggleFullText}
              t={t}
            />
          </Animated.View>

          {/* Action Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <ActionCard
              receipt={receipt}
              isStatusUpdating={isStatusUpdating}
              handleApproveDocument={handleApproveDocument}
              handleShareDocument={handleShareDocument}
              shareLoading={shareLoading}
              t={t}
            />
          </Animated.View>
        </View>
      </ScrollView>

      {/* Footer */}
      <FooterButton onPress={handleFinish} t={t} />
    </View>
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
    padding: horizontalScale(16),
    paddingBottom: verticalScale(100),
  },
  receiptCard: {
    borderRadius: verticalScale(12),
    padding: horizontalScale(16),
    marginBottom: verticalScale(16),
  },
  shareButton: {
    padding: verticalScale(8),
    borderRadius: verticalScale(20),
    marginLeft: horizontalScale(8),
  },
  iconButton: {
    padding: verticalScale(8),
    borderRadius: verticalScale(20),
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
