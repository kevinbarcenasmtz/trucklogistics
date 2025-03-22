// src/components/camera/ImageDetailsScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ScrollView, 
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from '@/src/theme';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import OCRProcessor from './OCRprocessor';
import { AIClassificationService } from '@/src/services/AIClassificationService';
import { AIClassifiedReceipt, Receipt } from '@/src/types/ReceiptInterfaces';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

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
  
  // Handle OCR recognition completion
  const handleTextRecognized = async (text: string) => {
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
      })
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
        confidence: classified?.confidence || 0.5
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

  // Navigate to verification screen
  const handleContinue = () => {
    if (!recognizedText) {
      alert('Please extract the text first');
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
      timestamp: new Date().toISOString()
    };
    
    // Merge with classified data (if available)
    const receiptData = classifiedData 
      ? { ...defaultReceipt, ...classifiedData }
      : defaultReceipt;
    
    // Navigate to verification screen with receipt data and image URI
    router.push({
      pathname: '/camera/verification',
      params: { 
        receipt: JSON.stringify(receiptData),
        uri: uri as string 
      }
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
    return (obj[property] !== undefined && obj[property] !== null) ? obj[property] : defaultValue;
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: themeStyles.colors.black_grey }
    ]}>
      {/* Header */}
      <View style={[
        styles.header,
        { 
          borderBottomColor: themeStyles.colors.darkGrey
        }
      ]}>
        <TouchableOpacity 
          style={[
            styles.backButton,
            { backgroundColor: themeStyles.colors.darkGrey }
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color={themeStyles.colors.white} />
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          { color: themeStyles.colors.white }
        ]}>{t('receiptScanner', 'Receipt Scanner')}</Text>
        <View style={styles.rightHeaderPlaceholder} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Image Container */}
          <View style={[
            styles.imageContainer,
            { 
              backgroundColor: themeStyles.colors.darkGrey,
              ...themeStyles.shadow.md
            }
          ]}>
            <Image 
              source={{ uri: uri as string }} 
              style={styles.image}
              resizeMode="cover" 
            />
            {!recognizedText && (
              <View style={styles.imagePlaceholder}>
                <Text style={[
                  styles.imagePlaceholderText,
                  { color: themeStyles.colors.white }
                ]}>
                  {t('tapToScan', 'Tap to scan receipt')}
                </Text>
              </View>
            )}
          </View>
          
          {/* Text Recognition Results */}
          {recognizedText ? (
            <Animated.View 
              style={[
                styles.textContainer,
                {
                  backgroundColor: themeStyles.colors.darkGrey,
                  ...themeStyles.shadow.sm,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <MaterialIcons name="document-scanner" size={20} color={themeStyles.colors.greenThemeColor} />
                <Text style={[
                  styles.sectionTitle,
                  { color: themeStyles.colors.white }
                ]}>{t('recognizedText', 'Recognized Text')}</Text>
              </View>
              <ScrollView style={styles.textScroll}>
                <Text style={[
                  styles.recognizedText,
                  { color: themeStyles.colors.grey }
                ]}>{recognizedText}</Text>
              </ScrollView>
            </Animated.View>
          ) : (
            <TouchableOpacity 
              style={[
                styles.actionButton,
                { 
                  backgroundColor: themeStyles.colors.greenThemeColor,
                  ...themeStyles.shadow.md
                }
              ]}
              onPress={startOCR}
            >
              <MaterialIcons name="document-scanner" size={24} color={themeStyles.colors.white} />
              <Text style={[
                styles.buttonText,
                { color: themeStyles.colors.white }
              ]}>{t('scanReceipt', 'Scan Receipt')}</Text>
            </TouchableOpacity>
          )}
          
          {/* Classification Results */}
          {classifiedData && (
            <View style={[
              styles.classificationContainer,
              { 
                backgroundColor: themeStyles.colors.darkGrey,
                ...themeStyles.shadow.sm
              }
            ]}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="auto-awesome" size={20} color={themeStyles.colors.greenThemeColor} />
                <Text style={[
                  styles.sectionTitle,
                  { color: themeStyles.colors.white }
                ]}>{t('aiClassification', 'AI Classification')}</Text>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(safeGetProperty(classifiedData, 'confidence', 0)) }
                ]}>
                  <Text style={[
                    styles.confidenceText,
                    { color: themeStyles.colors.black_grey }
                  ]}>
                    {Math.round((safeGetProperty(classifiedData, 'confidence', 0) * 100))}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.classificationGrid}>
                <View style={styles.classificationItem}>
                  <Text style={[
                    styles.itemLabel,
                    { color: themeStyles.colors.grey }
                  ]}>{t('receiptType', 'Type')}</Text>
                  <View style={[
                    styles.typeTag,
                    { backgroundColor: themeStyles.colors.greenThemeColor }
                  ]}>
                    <Text style={[
                      styles.typeTagText,
                      { color: themeStyles.colors.white }
                    ]}>
                      {safeGetProperty(classifiedData, 'type', 'Other')}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.classificationItem}>
                  <Text style={[
                    styles.itemLabel,
                    { color: themeStyles.colors.grey }
                  ]}>{t('amount', 'Amount')}</Text>
                  <Text style={[
                    styles.itemValueLarge,
                    { color: themeStyles.colors.white }
                  ]}>
                    {formatCurrency(safeGetProperty(classifiedData, 'amount', ''))}
                  </Text>
                </View>
                
                <View style={styles.classificationItem}>
                  <Text style={[
                    styles.itemLabel,
                    { color: themeStyles.colors.grey }
                  ]}>{t('date', 'Date')}</Text>
                  <Text style={[
                    styles.itemValue,
                    { color: themeStyles.colors.white }
                  ]}>
                    {safeGetProperty(classifiedData, 'date', 'Unknown')}
                  </Text>
                </View>
                
                <View style={styles.classificationItem}>
                  <Text style={[
                    styles.itemLabel,
                    { color: themeStyles.colors.grey }
                  ]}>{t('vendor', 'Vendor')}</Text>
                  <Text style={[
                    styles.itemValue,
                    { color: themeStyles.colors.white }
                  ]} numberOfLines={1}>
                    {safeGetProperty(classifiedData, 'vendorName', 'Unknown Vendor')}
                  </Text>
                </View>
                
                <View style={styles.classificationItem}>
                  <Text style={[
                    styles.itemLabel,
                    { color: themeStyles.colors.grey }
                  ]}>{t('vehicle', 'Vehicle')}</Text>
                  <Text style={[
                    styles.itemValue,
                    { color: themeStyles.colors.white }
                  ]}>
                    {safeGetProperty(classifiedData, 'vehicle', 'Unknown Vehicle')}
                  </Text>
                </View>
                
                {safeGetProperty(classifiedData, 'location', '') && (
                  <View style={styles.classificationItem}>
                    <Text style={[
                      styles.itemLabel,
                      { color: themeStyles.colors.grey }
                    ]}>{t('location', 'Location')}</Text>
                    <Text style={[
                      styles.itemValue,
                      { color: themeStyles.colors.white }
                    ]} numberOfLines={1}>
                      {safeGetProperty(classifiedData, 'location', '')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* Classification Loading */}
          {isClassifying && (
            <View style={[
              styles.classifyingContainer,
              { 
                backgroundColor: themeStyles.colors.darkGrey,
                ...themeStyles.shadow.sm
              }
            ]}>
              <ActivityIndicator size="small" color={themeStyles.colors.greenThemeColor} />
              <Text style={[
                styles.classifyingText,
                { color: themeStyles.colors.grey }
              ]}>{t('analyzing', 'Analyzing receipt...')}</Text>
            </View>
          )}
          
          {/* Continue Button */}
          {recognizedText && !isClassifying && (
            <View style={styles.buttonWrapper}>
              <TouchableOpacity 
                style={[
                  styles.continueButton,
                  { 
                    backgroundColor: themeStyles.colors.greenThemeColor,
                    borderColor: themeStyles.colors.white,
                    ...themeStyles.shadow.md
                  }
                ]}
                onPress={handleContinue}
              >
                <Text style={[
                  styles.buttonText,
                  { color: themeStyles.colors.white }
                ]}>{t('continue', 'Continue')}</Text>
                <Feather name="arrow-right" size={20} color={themeStyles.colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* OCR Processing Component */}
      {showOCR && (
        <OCRProcessor 
          imageUri={uri as string} 
          onTextRecognized={handleTextRecognized} 
        />
      )}
    </View>
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
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  backButton: {
    padding: moderateScale(8),
    borderRadius: moderateScale(20),
  },
  rightHeaderPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  buttonWrapper: {
    marginTop: verticalScale(24),
    marginBottom: verticalScale(48),
    paddingHorizontal: horizontalScale(16),
  },
  scrollViewContent: {
    paddingBottom: verticalScale(120),
  },
  contentContainer: {
    padding: horizontalScale(16),
  },
  imageContainer: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    marginBottom: verticalScale(16),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  imagePlaceholderText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  textContainer: {
    width: '100%',
    borderRadius: moderateScale(12),
    padding: horizontalScale(16),
    marginBottom: verticalScale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginLeft: horizontalScale(8),
  },
  textScroll: {
    maxHeight: verticalScale(100),
  },
  recognizedText: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
  },
  actionButton: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: verticalScale(16),
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: moderateScale(16),
    marginLeft: horizontalScale(8),
  },
  classificationContainer: {
    width: '100%',
    borderRadius: moderateScale(12),
    padding: horizontalScale(16),
    marginBottom: verticalScale(16),
  },
  classificationGrid: {
    marginTop: verticalScale(8),
  },
  classificationItem: {
    marginBottom: verticalScale(8),
  },
  itemLabel: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(2),
  },
  itemValue: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  itemValueLarge: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
  },
  typeTag: {
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(4),
    alignSelf: 'flex-start',
  },
  typeTagText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  confidenceBadge: {
    marginLeft: 'auto',
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(10),
  },
  confidenceText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  classifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
  },
  classifyingText: {
    marginLeft: horizontalScale(8),
    fontSize: moderateScale(14),
  },
  continueButton: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});