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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

export default function VerificationScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, themePreference, setTheme, isChangingTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const systemColorScheme = useColorScheme();
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
  const fadeAnim = useRef(new Animated.Value(1)).current;

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

  // Toggle theme function
  const toggleTheme = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback not supported', error);
    }

    const newTheme = theme === 'dark' ? 'light' : 'dark';
    const success = await setTheme(newTheme);

    if (!success) {
      Alert.alert(
        t('error', 'Error'),
        t('themeChangeError', 'Failed to change theme. Please try again.')
      );
    }
  }, [theme, setTheme, t]);

  // Handle input changes
  const handleInputChange = (field: keyof Receipt, value: string) => {
    setReceiptData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Start field editing
  const startEditing = (field: string) => {
    setActiveField(field);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Stop field editing
  const stopEditing = () => {
    setActiveField(null);
  };

  // Get editable fields and ignore internal/system fields
  const getEditableFields = () => {
    const excludeFields = ['id', 'imageUri', 'extractedText', 'timestamp', 'confidence'];
    const orderedFields: (keyof Receipt)[] = [
      'date',
      'type',
      'amount',
      'vehicle',
      'vendorName',
      'location',
    ];

    return orderedFields.filter(field => !excludeFields.includes(field) && field in receiptData);
  };

  // Format a field name for display
  const formatFieldName = (field: string): string => {
    return t(
      field.toLowerCase(),
      field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    );
  };

  // Validate receipt fields
  const validateReceipt = (): boolean => {
    // Check for required fields
    const requiredFields: (keyof Receipt)[] = ['date', 'type', 'amount'];

    for (const field of requiredFields) {
      if (!receiptData[field] || receiptData[field].trim() === '') {
        // Shake animation for error feedback
        Animated.sequence([
          Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Show alert with missing field
        Alert.alert(
          t('missingInformation', 'Missing Information'),
          t('pleaseEnterField', 'Please enter {{field}}', { field: t(field.toLowerCase(), field) })
        );

        setActiveField(field);
        return false;
      }
    }

    return true;
  };

  // Show raw OCR text
  const showRawText = () => {
    Alert.alert(
      t('extractedText', 'Extracted Text'),
      receiptData.extractedText || t('noTextFound', 'No text found'),
      [{ text: t('close', 'Close') }]
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Handle image preview
  const handleImagePress = () => {
    setIsModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Save document and navigate to report screen
  // When handling saveAndContinue in VerificationScreen.tsx
  const handleSaveAndContinue = async () => {
    // Validate fields first
    if (!validateReceipt()) return;

    setIsSaving(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Animate fade out
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Save the receipt document
      const savedReceipt = await DocumentStorage.saveReceipt({
        ...receiptData,
        status: 'Pending', // Default to pending
        timestamp: new Date().toISOString(),
      });

      // Navigate to report screen
      router.push({
        pathname: '/camera/report',
        params: {
          receipt: JSON.stringify(savedReceipt),
        },
      });

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.warn('Haptic feedback not supported', error);
      }
    } catch (error) {
      console.error('Error saving receipt:', error);

      // Animate fade back in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      Alert.alert(
        t('error', 'Error'),
        t('errorSavingReceipt', 'Failed to save the receipt. Please try again.')
      );

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (error) {
        console.warn('Haptic feedback not supported', error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Create theme toggle button
  const themeToggleButton = (
    <TouchableOpacity
      style={[
        styles.iconButton,
        {
          backgroundColor: themeStyles.colors.darkGrey,
          opacity: isChangingTheme ? 0.6 : 1,
        },
      ]}
      onPress={toggleTheme}
      disabled={isChangingTheme}
    >
      {isChangingTheme ? (
        <ActivityIndicator size="small" color={themeStyles.colors.white} />
      ) : (
        <Feather
          name={theme === 'dark' ? 'sun' : 'moon'}
          size={20}
          color={themeStyles.colors.white}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: themeStyles.colors.black_grey,
          opacity: fadeAnim,
        },
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScreenHeader
          title={t('verifyDetails', 'Verify Details')}
          onBack={() => router.back()}
          rightComponent={themeToggleButton}
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentContainer}>
            {/* Info Card */}
            <InfoCard />

            {/* Receipt Image Preview */}
            <ReceiptImagePreview imageUri={imageUri} onPress={handleImagePress} />

            {/* Editable Fields */}
            <FormContainer title={t('receiptDetails', 'Receipt Details')}>
              <Animated.View
                style={[
                  styles.formFieldsContainer,
                  { transform: [{ translateX: shakeAnimation }] },
                ]}
              >
                {getEditableFields().map(field => (
                  <EditField
                    key={field}
                    field={field}
                    value={receiptData[field]?.toString() || ''}
                    onChange={text => handleInputChange(field, text)}
                    isActive={activeField === field}
                    onActivate={() => startEditing(field)}
                    icon={getFieldIcon(field)}
                    label={formatFieldName(field as string)}
                    placeholder={getFieldPlaceholder(field, t)}
                    keyboardType={field === 'amount' ? 'decimal-pad' : 'default'}
                  />
                ))}
              </Animated.View>
            </FormContainer>

            {/* View Raw OCR Button */}
            <ViewRawTextButton onPress={showRawText} />
          </View>
        </ScrollView>

        {/* Save and Continue Button */}
        <SaveButton onPress={handleSaveAndContinue} isSaving={isSaving} />
      </KeyboardAvoidingView>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={isModalVisible}
        imageUri={imageUri}
        onClose={() => setIsModalVisible(false)}
      />
    </Animated.View>
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
  formFieldsContainer: {
    width: '100%',
  },
  iconButton: {
    padding: verticalScale(8),
    borderRadius: verticalScale(20),
  },
});
