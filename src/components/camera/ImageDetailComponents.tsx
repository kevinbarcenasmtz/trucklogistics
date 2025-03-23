// src/components/camera/ImageDetailsComponents.tsx
import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Animated 
} from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from '@/src/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AIClassifiedReceipt } from '@/src/types/ReceiptInterfaces';
import { SectionContainer } from './CameraUIComponents';

// Receipt Image Preview
export const ImagePreview = ({ 
  uri, 
  onScanPress 
}: { 
  uri: string, 
  onScanPress: () => void 
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';
  
  return (
    <View style={[
      styles.imageContainer,
      { 
        backgroundColor: isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.surface,
        ...themeStyles.shadow.md
      }
    ]}>
      <Image 
        source={{ uri }} 
        style={styles.image}
        resizeMode="cover" 
      />
      <View style={styles.imagePlaceholder}>
        <TouchableOpacity 
          style={[
            styles.scanButton,
            { backgroundColor: themeStyles.colors.greenThemeColor }
          ]}
          onPress={onScanPress}
        >
          <MaterialIcons name="document-scanner" size={24} color={themeStyles.colors.white} />
          <Text style={[
            styles.scanButtonText,
            { color: themeStyles.colors.white }
          ]}>{t('tapToScan', 'Tap to scan receipt')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Recognized Text Display
export const RecognizedTextDisplay = ({ 
  text, 
  fadeAnim, 
  slideAnim 
}: { 
  text: string, 
  fadeAnim: Animated.Value, 
  slideAnim: Animated.Value 
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';
  
  return (
    <Animated.View 
      style={[
        styles.textContainer,
        {
          backgroundColor: isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.surface,
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
          { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary }
        ]}>{t('recognizedText', 'Recognized Text')}</Text>
      </View>
      <ScrollView style={styles.textScroll}>
        <Text style={[
          styles.recognizedText,
          { color: isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.secondary }
        ]}>{text}</Text>
      </ScrollView>
    </Animated.View>
  );
};

// Classification Display
export const ClassificationDisplay = ({ 
  data,
  formatCurrency,
  getConfidenceColor,
  safeGetProperty
}: { 
  data: AIClassifiedReceipt,
  formatCurrency: (amount?: string) => string,
  getConfidenceColor: (confidence: number) => string,
  safeGetProperty: <T>(obj: any, property: string, defaultValue: T) => T
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';
  
  if (!data) return null;
  
  const confidencePercent = Math.round((safeGetProperty(data, 'confidence', 0) * 100));
  
  const renderClassificationItem = (
    label: string, 
    value: string | React.ReactNode,
    isLarge = false
  ) => (
    <View style={styles.classificationItem}>
      <Text style={[
        styles.itemLabel,
        { color: isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.secondary }
      ]}>{t(label.toLowerCase(), label)}</Text>
      
      {typeof value === 'string' ? (
        <Text style={[
          isLarge ? styles.itemValueLarge : styles.itemValue,
          { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary }
        ]} numberOfLines={1}>
          {value}
        </Text>
      ) : value}
    </View>
  );
  
  return (
    <SectionContainer
      title={t('aiClassification', 'AI Classification')}
      icon="auto-awesome"
      rightComponent={
        <View style={[
          styles.confidenceBadge,
          { backgroundColor: getConfidenceColor(safeGetProperty(data, 'confidence', 0)) }
        ]}>
          <Text style={[
            styles.confidenceText,
            { color: isDarkTheme ? themeStyles.colors.black_grey : themeStyles.colors.white }
          ]}>
            {confidencePercent}%
          </Text>
        </View>
      }
    >
      <View style={styles.classificationGrid}>
        {renderClassificationItem('Type', (
          <View style={[
            styles.typeTag,
            { backgroundColor: themeStyles.colors.greenThemeColor }
          ]}>
            <Text style={[
              styles.typeTagText,
              { color: themeStyles.colors.white }
            ]}>
              {safeGetProperty(data, 'type', 'Other')}
            </Text>
          </View>
        ))}
        
        {renderClassificationItem('Amount', 
          formatCurrency(safeGetProperty(data, 'amount', '')),
          true
        )}
        
        {renderClassificationItem('Date', 
          safeGetProperty(data, 'date', 'Unknown')
        )}
        
        {renderClassificationItem('Vendor', 
          safeGetProperty(data, 'vendorName', 'Unknown Vendor')
        )}
        
        {renderClassificationItem('Vehicle', 
          safeGetProperty(data, 'vehicle', 'Unknown Vehicle')
        )}
        
        {safeGetProperty(data, 'location', '') && (
          renderClassificationItem('Location', 
            safeGetProperty(data, 'location', '')
          )
        )}
      </View>
    </SectionContainer>
  );
};

// Analyzing indicator
export const AnalyzingIndicator = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';
  
  return (
    <View style={[
      styles.classifyingContainer,
      { 
        backgroundColor: isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.surface,
        ...themeStyles.shadow.sm
      }
    ]}>
      <MaterialIcons 
        name="analytics" 
        size={20} 
        color={themeStyles.colors.greenThemeColor} 
      />
      <Text style={[
        styles.classifyingText,
        { color: isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.secondary }
      ]}>{t('analyzing', 'Analyzing receipt...')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  scanButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    marginLeft: horizontalScale(8),
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
});