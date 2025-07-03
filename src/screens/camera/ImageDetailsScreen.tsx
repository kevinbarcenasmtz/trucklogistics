// src/screens/camera/ImageDetailsScreen.tsx
import { ActionButton, ScreenHeader } from '@/src/components/camera/CameraUIComponents';
import {
  AnalyzingIndicator,
  ClassificationDisplay,
  ImagePreview,
  RecognizedTextDisplay,
} from '@/src/components/camera/ImageDetailComponents';
import { useTheme } from '@/src/context/ThemeContext';
import { AIClassificationService } from '@/src/services/AIClassificationService';
import { getThemeStyles, horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { AIClassifiedReceipt, Receipt } from '@/src/types/ReceiptInterfaces';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OCRProcessor from './OCRprocessor';

export default function ImageDetailsScreen() {
  const { uri } = useLocalSearchParams();
  const router = useRouter();
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [showOCR, setShowOCR] = useState<boolean>(false);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [classifiedData, setClassifiedData] = useState<AIClassifiedReceipt | null>(null);
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const [ocrError, setOcrError] = useState<string | null>(null);

  // Handle OCR recognition completion
  const handleTextRecognized = async (text: string) => {
    setOcrError(null);
    setRecognizedText(text);
    setShowOCR(false);

    // Animate in the text container
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Provide haptic feedback for completion
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Automatically start AI classification
    await classifyText(text);
  };

  // Function to classify recognized text
  const classifyText = async (text: string) => {
    setIsClassifying(true);
    try {
      const classified = await AIClassificationService.classifyReceipt(text);

      // Ensure all required fields exist
      const validatedClassification: AIClassifiedReceipt = {
        date: classified?.date || new Date().toISOString().split('T')[0],
        type: classified?.type || 'Other',
        amount: classified?.amount || '$0.00',
        vehicle: classified?.vehicle || 'Unknown Vehicle',
        vendorName: classified?.vendorName || 'Unknown Vendor',
        location: classified?.location || '',
        confidence: classified?.confidence || 0.5,
      };

      setClassifiedData(validatedClassification);

      // Haptic feedback for classification completion
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error classifying text:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsClassifying(false);
    }
  };

  // Start OCR processing
  const startOCR = () => {
    setShowOCR(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleOcrError = (errorMessage: string) => {
    setOcrError(errorMessage);
    setShowOCR(false);

    // Show error to user
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.warn('Haptic feedback not supported', error);
    }
  };

  // Then in the JSX:
  {
    showOCR && (
      <OCRProcessor
        imageUri={uri as string}
        onTextRecognized={handleTextRecognized}
        onError={handleOcrError}
      />
    );
  }

  // Navigate to verification screen
  const handleContinue = () => {
    if (!recognizedText) {
      alert(t('extractTextFirst', 'Please extract the text first'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Create default values for missing fields
    const defaultReceipt: Partial<Receipt> = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: 'Other',
      amount: '$0.00',
      vehicle: 'Unknown Vehicle',
      status: 'Pending',
      extractedText: recognizedText,
      imageUri: uri as string,
      timestamp: new Date().toISOString(),
    };

    // Merge with classified data (if available)
    const receiptData = classifiedData ? { ...defaultReceipt, ...classifiedData } : defaultReceipt;

    // Navigate to verification screen with receipt data and image URI
    router.push({
      pathname: '/camera/verification',
      params: {
        receipt: JSON.stringify(receiptData),
        uri: uri as string,
      },
    });
  };

  // Start OCR automatically when screen loads
  useEffect(() => {
    if (uri && !recognizedText) {
      // Add a small delay for better UX
      const timer = setTimeout(() => {
        startOCR();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [uri]);

  // Format currency amount with proper formatting
  const formatCurrency = (amount: string | undefined) => {
    // Handle undefined or empty string
    if (!amount) return '$0.00';

    try {
      // If it already has a currency symbol, return as is
      if (amount.includes('$') || amount.includes('€') || amount.includes('£')) {
        return amount;
      }

      // Otherwise, format as USD
      const amountNum = parseFloat(amount.replace(/,/g, ''));
      if (isNaN(amountNum)) return '$0.00';

      return `$${amountNum.toFixed(2)}`;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return '$0.00';
    }
  };

  // Get confidence level color
  const getConfidenceColor = (confidence: number = 0) => {
    if (confidence >= 0.8) return themeStyles.colors.status.success;
    if (confidence >= 0.6) return themeStyles.colors.status.warning;
    return themeStyles.colors.status.error;
  };

  // Safe way to get properties with default values
  const safeGetProperty = <T,>(obj: any, property: string, defaultValue: T): T => {
    if (!obj) return defaultValue;
    return obj[property] !== undefined && obj[property] !== null ? obj[property] : defaultValue;
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.colors.black_grey }]}>
      <ScreenHeader title={t('receiptScanner', 'Receipt Scanner')} onBack={() => router.back()} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Image Container */}
          {!recognizedText ? (
            <ImagePreview uri={uri as string} onScanPress={startOCR} />
          ) : (
            <View
              style={[
                styles.imageContainer,
                {
                  backgroundColor: themeStyles.colors.darkGrey,
                  ...themeStyles.shadow.md,
                },
              ]}
            >
              <TouchableOpacity onPress={startOCR}>
                <View style={styles.rescanContainer}>
                  <Text style={[styles.rescanText, { color: themeStyles.colors.white }]}>
                    {t('scanned', 'Scanned')}
                  </Text>
                  <Feather
                    name="refresh-cw"
                    size={16}
                    color={themeStyles.colors.white}
                    style={{ marginLeft: horizontalScale(4) }}
                  />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Text Recognition Results */}
          {recognizedText && (
            <RecognizedTextDisplay
              text={recognizedText}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
            />
          )}

          {/* Classification Results */}
          {classifiedData && (
            <ClassificationDisplay
              data={classifiedData}
              formatCurrency={formatCurrency}
              getConfidenceColor={getConfidenceColor}
              safeGetProperty={safeGetProperty}
            />
          )}

          {/* Classification Loading */}
          {isClassifying && <AnalyzingIndicator />}

          {/* Continue Button */}
          {recognizedText && !isClassifying && (
            <View style={styles.buttonWrapper}>
              <ActionButton
                title={t('continue', 'Continue')}
                icon="arrow-forward"
                onPress={handleContinue}
                backgroundColor={themeStyles.colors.greenThemeColor}
                style={styles.continueButton}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* OCR Processing Component */}
      {showOCR && <OCRProcessor imageUri={uri as string} onTextRecognized={handleTextRecognized} />}
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
  buttonWrapper: {
    marginTop: verticalScale(24),
    marginBottom: verticalScale(48),
    paddingHorizontal: horizontalScale(16),
  },
  contentContainer: {
    padding: horizontalScale(16),
  },
  imageContainer: {
    width: '100%',
    height: verticalScale(60),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  rescanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(8),
  },
  rescanText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  continueButton: {
    borderWidth: 0,
  },
});
