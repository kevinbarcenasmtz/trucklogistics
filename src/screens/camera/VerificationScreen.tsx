// src/components/camera/VerificationScreen.tsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from '@/src/theme';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Receipt } from '@/src/types/ReceiptInterfaces';
import { DocumentStorage } from '@/src/services/DocumentStorage';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function VerificationScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  // Parse receipt data from params
  const initialReceipt: Receipt = params.receipt ? 
    JSON.parse(params.receipt as string) : 
    {} as Receipt;
  
  const imageUri = params.uri as string;
  
  // State for editable receipt data
  const [receiptData, setReceiptData] = useState<Receipt>(initialReceipt);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  
  // Animation values
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Handle input changes
  const handleInputChange = (field: keyof Receipt, value: string) => {
    setReceiptData(prev => ({
      ...prev,
      [field]: value
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
          Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
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
  
  // Save document and navigate to report screen
  const handleSaveAndContinue = async () => {
    // Validate fields first
    if (!validateReceipt()) return;
    
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Animate fade out
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true
      }).start();
      
      // Save the receipt document
      const savedReceipt = await DocumentStorage.saveReceipt({
        ...receiptData,
        status: 'Pending', // Default to pending
        timestamp: new Date().toISOString()
      });
      
      // Navigate to report screen
      router.push({
        pathname: '/camera/report',
        params: { 
          receipt: JSON.stringify(savedReceipt)
        }
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving receipt:', error);
      
      // Animate fade back in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
      
      Alert.alert(
        t('error', 'Error'),
        t('errorSavingReceipt', 'Failed to save the receipt. Please try again.')
      );
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle image preview
  const handleImagePress = () => {
    setIsModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const closeModal = () => {
    setIsModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Get editable fields and ignore internal/system fields
  const getEditableFields = () => {
    const excludeFields = ['id', 'imageUri', 'extractedText', 'timestamp', 'confidence'];
    const orderedFields: (keyof Receipt)[] = ['date', 'type', 'amount', 'vehicle', 'vendorName', 'location'];
    
    return orderedFields.filter(field => !excludeFields.includes(field) && field in receiptData);
  };
  
  // Format a field name for display
  const formatFieldName = (field: string): string => {
    return t(field.toLowerCase(), field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
  };
  
  // Get field icon
  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'date': return 'calendar-today';
      case 'type': return 'category';
      case 'amount': return 'attach-money';
      case 'vehicle': return 'local-shipping';
      case 'vendorName': return 'store';
      case 'location': return 'place';
      default: return 'edit';
    }
  };
  
  // Create placeholder based on field type
  const getFieldPlaceholder = (field: string) => {
    switch (field) {
      case 'date': return 'YYYY-MM-DD';
      case 'amount': return '$0.00';
      case 'type': return 'Fuel, Maintenance, or Other';
      case 'vehicle': return 'Vehicle ID or description';
      case 'vendorName': return 'Business name';
      case 'location': return 'Address';
      default: return `Enter ${formatFieldName(field)}`;
    }
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          backgroundColor: themeStyles.colors.black_grey,
          opacity: fadeAnim 
        }
      ]} 
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <View style={[
          styles.header,
          { borderBottomColor: themeStyles.colors.darkGrey }
        ]}>
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }} 
            style={[
              styles.backButton,
              { backgroundColor: themeStyles.colors.darkGrey }
            ]}
          >
            <MaterialIcons name="arrow-back" size={24} color={themeStyles.colors.white} />
          </TouchableOpacity>
          <Text style={[
            styles.headerTitle,
            { color: themeStyles.colors.white }
          ]}>{t('verifyDetails', 'Verify Details')}</Text>
          <View style={{ width: 40 }} /> {/* Placeholder for balance */}
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentContainer}>
            {/* Top info card */}
            <View style={[
              styles.infoCard,
              { 
                backgroundColor: themeStyles.colors.darkGrey,
                ...themeStyles.shadow.sm
              }
            ]}>
              <MaterialIcons name="info-outline" size={20} color={themeStyles.colors.greenThemeColor} />
              <Text style={[
                styles.infoText,
                { color: themeStyles.colors.white }
              ]}>
                {t('verifyInstructions', 'Review and correct any information below before continuing.')}
              </Text>
            </View>
            
            {/* Receipt Image Preview */}
            <TouchableOpacity 
              onPress={handleImagePress} 
              style={[
                styles.imageContainer,
                {
                  ...themeStyles.shadow.sm 
                }
              ]}
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: imageUri }} 
                style={styles.imagePreview} 
                resizeMode="cover" 
              />
              <View style={styles.imageOverlay}>
                <MaterialIcons name="zoom-in" size={20} color={themeStyles.colors.white} />
                <Text style={[
                  styles.imageOverlayText,
                  { color: themeStyles.colors.white }
                ]}>{t('tapToEnlarge', 'Tap to enlarge')}</Text>
              </View>
            </TouchableOpacity>
            
            {/* Editable Fields */}
            <View style={[
              styles.formContainer,
              { 
                backgroundColor: themeStyles.colors.darkGrey,
                ...themeStyles.shadow.sm 
              }
            ]}>
              <Text style={[
                styles.formTitle,
                { 
                  color: themeStyles.colors.white,
                  borderBottomColor: themeStyles.colors.black_grey 
                }
              ]}>{t('receiptDetails', 'Receipt Details')}</Text>
              <Animated.View 
                style={[
                  styles.formFieldsContainer,
                  { transform: [{ translateX: shakeAnimation }] }
                ]}
              >
                {getEditableFields().map((field) => (
                  <View key={field} style={[
                    styles.formField,
                    { 
                      backgroundColor: themeStyles.colors.black_grey,
                      ...themeStyles.shadow.sm
                    },
                    activeField === field && { 
                      borderColor: themeStyles.colors.greenThemeColor,
                      borderWidth: 1,
                      backgroundColor: themeStyles.colors.darkGrey
                    }
                  ]}>
                    <View style={styles.fieldIconContainer}>
                      <MaterialIcons 
                        name={getFieldIcon(field)} 
                        size={20} 
                        color={activeField === field ? themeStyles.colors.greenThemeColor : themeStyles.colors.grey} 
                      />
                    </View>
                    <View style={styles.fieldContent}>
                      <Text style={[
                        styles.fieldLabel,
                        { color: themeStyles.colors.grey }
                      ]}>
                        {formatFieldName(field as string)}
                      </Text>
                      <TextInput
                        style={[
                          styles.fieldInput,
                          { color: themeStyles.colors.white }
                        ]}
                        value={receiptData[field]?.toString() || ''}
                        onChangeText={(text) => handleInputChange(field, text)}
                        placeholder={getFieldPlaceholder(field as string)}
                        placeholderTextColor={themeStyles.colors.grey}
                        onFocus={() => startEditing(field as string)}
                        onBlur={stopEditing}
                        keyboardType={field === 'amount' ? 'decimal-pad' : 'default'}
                      />
                    </View>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => startEditing(field as string)}
                    >
                      <Feather 
                        name="edit-2" 
                        size={16} 
                        color={activeField === field ? themeStyles.colors.greenThemeColor : themeStyles.colors.grey} 
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </Animated.View>
            </View>
            
            {/* Show Raw OCR */}
            <TouchableOpacity 
              style={[
                styles.extractedTextButton,
                { 
                  backgroundColor: themeStyles.colors.darkGrey,
                  ...themeStyles.shadow.sm
                }
              ]}
              onPress={() => {
                Alert.alert(
                  t('extractedText', 'Extracted Text'),
                  receiptData.extractedText || t('noTextFound', 'No text found'),
                  [{ text: t('close', 'Close') }]
                );
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Feather name="file-text" size={16} color={themeStyles.colors.grey} />
              <Text style={[
                styles.extractedTextButtonText,
                { color: themeStyles.colors.grey }
              ]}>
                {t('viewRawText', 'View Raw OCR Text')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer with Action Button */}
          <View style={[
            styles.footer,
            { 
              backgroundColor: themeStyles.colors.black_grey,
              borderTopColor: themeStyles.colors.darkGrey,
              ...themeStyles.shadow.lg
            }
          ]}>
            <TouchableOpacity 
              style={[
                styles.footerButton, 
                { 
                  backgroundColor: themeStyles.colors.greenThemeColor,
                  ...themeStyles.shadow.md
                },
                isSaving && { opacity: 0.6 }
              ]} 
              onPress={handleSaveAndContinue}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={themeStyles.colors.white} />
              ) : (
                <>
                  <Text style={[
                    styles.footerButtonText,
                    { color: themeStyles.colors.white }
                  ]}>
                    {t('saveAndContinue', 'Save and Continue')}
                  </Text>
                  <MaterialIcons name="check-circle" size={20} color={themeStyles.colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Image Modal */}
      <Modal 
        visible={isModalVisible} 
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={[
              styles.closeButton,
              { backgroundColor: themeStyles.colors.darkGrey }
            ]} 
            onPress={closeModal}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={24} color={themeStyles.colors.white} />
          </TouchableOpacity>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.fullScreenImage} 
            resizeMode="contain" 
          />
          <View style={styles.modalControls}>
            <TouchableOpacity 
              style={[
                styles.modalButton,
                { backgroundColor: themeStyles.colors.darkGrey }
              ]}
            >
              <Feather name="download" size={24} color={themeStyles.colors.white} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.modalButton,
                { backgroundColor: themeStyles.colors.darkGrey }
              ]}
            >
              <Feather name="share" size={24} color={themeStyles.colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(16),
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(16),
    borderBottomWidth: 1,
  },
  backButton: {
    padding: moderateScale(8),
    borderRadius: moderateScale(20),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: horizontalScale(16),
    paddingBottom: verticalScale(100),
  },
  infoCard: {
    borderRadius: moderateScale(12),
    padding: horizontalScale(16),
    marginBottom: verticalScale(16),
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: moderateScale(14),
    marginLeft: horizontalScale(8),
    flex: 1,
  },
  imageContainer: {
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: verticalScale(140),
    borderRadius: moderateScale(12),
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: verticalScale(4),
    paddingHorizontal: horizontalScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlayText: {
    marginLeft: horizontalScale(4),
    fontSize: moderateScale(12),
  },
  formContainer: {
    borderRadius: moderateScale(12),
    padding: horizontalScale(16),
  },
  formTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: verticalScale(16),
    borderBottomWidth: 1,
    paddingBottom: verticalScale(4),
  },
  formFieldsContainer: {
    gap: verticalScale(16),
  },
  formField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(12),
    padding: horizontalScale(16),
  },
  fieldIconContainer: {
    marginRight: horizontalScale(8),
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(2),
  },
  fieldInput: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    padding: 0,
  },
  editButton: {
    padding: moderateScale(4),
  },
  extractedTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(16),
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
  },
  extractedTextButtonText: {
    marginLeft: horizontalScale(8),
    fontSize: moderateScale(14),
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: horizontalScale(16),
    borderTopWidth: 1,
  },
  footerButton: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  footerButtonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginRight: horizontalScale(8),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: verticalScale(50),
    right: horizontalScale(20),
    zIndex: 10,
    padding: moderateScale(8),
    borderRadius: moderateScale(20),
  },
  fullScreenImage: {
    width: width * 0.9,
    height: height * 0.6,
    borderRadius: moderateScale(12),
  },
  modalControls: {
    flexDirection: 'row',
    marginTop: verticalScale(16),
    gap: horizontalScale(16),
  },
  modalButton: {
    padding: moderateScale(16),
    borderRadius: moderateScale(20),
  },
});