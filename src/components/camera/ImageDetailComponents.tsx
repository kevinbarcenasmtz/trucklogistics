// src/components/camera/ImageDetailComponents.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { AIClassifiedReceipt } from '@/src/types/ReceiptInterfaces';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SectionContainer } from './CameraUIComponents';

// Receipt Image Preview
export const ImagePreview = ({ uri, onScanPress }: { uri: string; onScanPress: () => void }) => {
  const { t } = useTranslation();
  const { getSurfaceColor, primaryColor } = useAppTheme();

  return (
    <View style={[styles.imageContainer, { backgroundColor: getSurfaceColor() }]}>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      <View style={styles.imagePlaceholder}>
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: primaryColor }]}
          onPress={onScanPress}
        >
          <MaterialIcons name="document-scanner" size={24} color="#FFFFFF" />
          <Text style={[styles.scanButtonText, { color: '#FFFFFF' }]}>
            {t('tapToScan', 'Tap to scan receipt')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Recognized Text Display
export const RecognizedTextDisplay = ({
  text,
  fadeAnim,
  slideAnim,
}: {
  text: string;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}) => {
  const { t } = useTranslation();
  const { getSurfaceColor, textColor, primaryColor } = useAppTheme();

  return (
    <Animated.View
      style={[
        styles.textContainer,
        {
          backgroundColor: getSurfaceColor(),
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <MaterialIcons name="document-scanner" size={20} color={primaryColor} />
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {t('recognizedText', 'Recognized Text')}
        </Text>
      </View>
      <ScrollView style={styles.textScroll}>
        <Text style={[styles.recognizedText, { color: textColor }]}>{text}</Text>
      </ScrollView>
    </Animated.View>
  );
};

// Classification Display
export const ClassificationDisplay = ({
  classification,
  fadeAnim,
  slideAnim,
  formatCurrency,
  getConfidenceColor,
}: {
  classification: AIClassifiedReceipt;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  formatCurrency: (amount?: string) => string;
  getConfidenceColor: (confidence?: number) => string;
}) => {
  const { t } = useTranslation();
  const { getSurfaceColor, textColor, secondaryTextColor, primaryColor } = useAppTheme();

  const fields = [
    { key: 'date', label: t('date', 'Date'), value: classification.date, icon: 'event' },
    { key: 'amount', label: t('amount', 'Amount'), value: formatCurrency(classification.amount), icon: 'attach-money' },
    { key: 'type', label: t('type', 'Type'), value: classification.type, icon: 'category' },
    { key: 'vehicle', label: t('vehicle', 'Vehicle'), value: classification.vehicle, icon: 'directions-car' },
    { key: 'vendorName', label: t('vendor', 'Vendor'), value: classification.vendorName, icon: 'store' },
    { key: 'location', label: t('location', 'Location'), value: classification.location, icon: 'location-on' },
  ];

  return (
    <Animated.View
      style={[
        styles.classificationContainer,
        {
          backgroundColor: getSurfaceColor(),
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <MaterialIcons name="smart-toy" size={20} color={primaryColor} />
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {t('aiClassification', 'AI Classification')}
        </Text>
      </View>

      <View style={styles.fieldsContainer}>
        {fields.map((field) => (
          <View key={field.key} style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
              <MaterialIcons name={field.icon as any} size={16} color={primaryColor} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, { color: secondaryTextColor }]}>{field.label}</Text>
              <Text style={[styles.fieldValue, { color: textColor }]}>
                {field.value || t('notDetected', 'Not detected')}
              </Text>
            </View>
            <View style={styles.confidenceContainer}>
              <View
                style={[
                  styles.confidenceDot,
                  { backgroundColor: getConfidenceColor(classification.confidence?.[field.key]) },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: verticalScale(200),
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    borderRadius: moderateScale(8),
  },
  scanButtonText: {
    marginLeft: horizontalScale(8),
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  textContainer: {
    borderRadius: moderateScale(12),
    padding: horizontalScale(16),
    marginBottom: verticalScale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: horizontalScale(8),
  },
  textScroll: {
    maxHeight: verticalScale(150),
  },
  recognizedText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    fontFamily: 'monospace',
  },
  classificationContainer: {
    borderRadius: moderateScale(12),
    padding: horizontalScale(16),
    marginBottom: verticalScale(16),
  },
  fieldsContainer: {
    gap: verticalScale(12),
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
  },
  fieldIcon: {
    marginRight: horizontalScale(12),
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(2),
  },
  fieldValue: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  confidenceContainer: {
    marginLeft: horizontalScale(8),
  },
  confidenceDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
});