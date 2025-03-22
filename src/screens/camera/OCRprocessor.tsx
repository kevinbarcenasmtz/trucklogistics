// src/components/camera/OCRProcessor.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, moderateScale, verticalScale, horizontalScale } from '@/src/theme';
import { useTranslation } from 'react-i18next';
import { OcrService } from '@/src/services/OcrService';
import { MaterialIcons } from '@expo/vector-icons';

interface OCRProcessorProps {
  imageUri: string;
  onTextRecognized: (text: string) => void;
}

const OCRProcessor: React.FC<OCRProcessorProps> = ({ imageUri, onTextRecognized }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'preparing' | 'processing' | 'analyzing' | 'finalizing'>('preparing');
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  
  // Create rotation interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  useEffect(() => {
    if (imageUri) {
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
      
      // Start continuous rotation animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ).start();
      
      processImage(imageUri);
    }
  }, [imageUri]);

  const processImage = async (uri: string) => {
    setIsProcessing(true);
    setStage('preparing');
    
    try {
      // Start progress animation with stages
      const stageTimer = setTimeout(() => setStage('processing'), 1000);
      
      const interval = setInterval(() => {
        setProgress(prev => {
          // Different progression rates based on stage
          let increment = 5;
          if (prev < 20) increment = 10;
          else if (prev >= 70) increment = 3;
          
          // Update stage based on progress
          if (prev >= 30 && prev < 35) setStage('processing');
          else if (prev >= 60 && prev < 65) setStage('analyzing');
          else if (prev >= 85 && prev < 90) setStage('finalizing');
          
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return Math.min(90, prev + increment);
        });
      }, 300);
      
      // Process with OCR service
      const text = await OcrService.recognizeText(uri);
      
      // Complete progress
      clearInterval(interval);
      clearTimeout(stageTimer);
      setProgress(100);
      setStage('finalizing');
      
      // Short delay before completing to show 100%
      setTimeout(() => {
        // Fade out animation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 300,
            useNativeDriver: true
          })
        ]).start(() => {
          setIsProcessing(false);
          // Pass text to parent component
          onTextRecognized(text);
        });
      }, 500);
    } catch (error) {
      console.error('OCR Error:', error);
      
      // Fade out animation on error
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setIsProcessing(false);
        onTextRecognized('Text extraction failed. Please try again with a clearer image.');
      });
    }
  };

  // Return null if not processing
  if (!isProcessing) return null;
  
  // Get stage message
  const getStageMessage = () => {
    switch (stage) {
      case 'preparing': return t('preparingImage', 'Preparing image...');
      case 'processing': return t('extractingText', 'Extracting text...');
      case 'analyzing': return t('analyzingContent', 'Analyzing content...');
      case 'finalizing': return t('finalizing', 'Finalizing results...');
      default: return t('processing', 'Processing...');
    }
  };
  
  // Get icon for current stage
  const getStageIcon = () => {
    switch (stage) {
      case 'preparing': return 'image';
      case 'processing': return 'document-scanner';
      case 'analyzing': return 'analytics';
      case 'finalizing': return 'check-circle';
      default: return 'hourglass-empty';
    }
  };

  return (
    <View style={[
      styles.overlay,
      { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
    ]}>
      <Animated.View 
        style={[
          styles.processingCard,
          {
            backgroundColor: themeStyles.colors.darkGrey,
            ...themeStyles.shadow.md,
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <View style={[
          styles.iconContainer,
          { backgroundColor: themeStyles.colors.background.elevated || themeStyles.colors.background.card }
        ]}>
          <Animated.View style={{
            transform: [{ rotate: spin }]
          }}>
            <MaterialIcons 
              name="autorenew" 
              size={28} 
              color={themeStyles.colors.greenThemeColor} 
            />
          </Animated.View>
        </View>
        
        <Text style={[
          styles.processingTitle,
          { color: themeStyles.colors.white }
        ]}>{t('processingImage', 'Processing Image')}</Text>
        
        <Text style={[
          styles.stageText,
          { color: themeStyles.colors.grey }
        ]}>{getStageMessage()}</Text>
        
        <View style={styles.progressBarContainer}>
          <View style={[
            styles.progressBackground,
            { backgroundColor: themeStyles.colors.background.elevated || themeStyles.colors.black_grey }
          ]}>
            <Animated.View 
              style={[
                styles.progressFill,
                { 
                  width: `${progress}%`,
                  backgroundColor: themeStyles.colors.greenThemeColor 
                }
              ]}
            />
          </View>
          <Text style={[
            styles.progressText,
            { color: themeStyles.colors.grey }
          ]}>{`${Math.round(progress)}%`}</Text>
        </View>
        
        <View style={styles.stageIndicator}>
          <MaterialIcons 
            name={getStageIcon()} 
            size={20} 
            color={progress >= 25 ? themeStyles.colors.greenThemeColor : themeStyles.colors.grey} 
          />
          <View style={[
            styles.stageLine, 
            { backgroundColor: themeStyles.colors.background.elevated || themeStyles.colors.black_grey },
            progress >= 50 && { backgroundColor: themeStyles.colors.greenThemeColor }
          ]} />
          <MaterialIcons 
            name="text-fields" 
            size={20} 
            color={progress >= 50 ? themeStyles.colors.greenThemeColor : themeStyles.colors.grey} 
          />
          <View style={[
            styles.stageLine, 
            { backgroundColor: themeStyles.colors.background.elevated || themeStyles.colors.black_grey },
            progress >= 75 && { backgroundColor: themeStyles.colors.greenThemeColor }
          ]} />
          <MaterialIcons 
            name="auto-awesome" 
            size={20} 
            color={progress >= 75 ? themeStyles.colors.greenThemeColor : themeStyles.colors.grey} 
          />
          <View style={[
            styles.stageLine, 
            { backgroundColor: themeStyles.colors.background.elevated || themeStyles.colors.black_grey },
            progress >= 90 && { backgroundColor: themeStyles.colors.greenThemeColor }
          ]} />
          <MaterialIcons 
            name="check-circle" 
            size={20} 
            color={progress >= 100 ? themeStyles.colors.greenThemeColor : themeStyles.colors.grey} 
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  processingCard: {
    padding: verticalScale(20),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    width: '80%',
    maxWidth: 350,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  processingTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginBottom: verticalScale(8),
  },
  stageText: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(16),
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: verticalScale(16),
  },
  progressBackground: {
    height: verticalScale(8),
    borderRadius: moderateScale(4),
    overflow: 'hidden',
    marginBottom: verticalScale(4),
  },
  progressFill: {
    height: '100%',
    borderRadius: moderateScale(4),
  },
  progressText: {
    fontSize: moderateScale(12),
    textAlign: 'right',
  },
  stageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: horizontalScale(4),
  },
  stageLine: {
    flex: 1,
    height: 2,
    marginHorizontal: horizontalScale(4),
  },
});

export default OCRProcessor;