// src/screens/camera/OCRProcessor.tsx
import { useTheme } from '@/src/context/ThemeContext';
import { OcrService } from '@/src/services/OcrService';
import { getThemeStyles, horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

interface OCRProcessorProps {
  imageUri: string;
  onTextRecognized: (text: string) => void;
  onError?: (error: string) => void;
}

const OCRProcessor: React.FC<OCRProcessorProps> = ({
  imageUri,
  onTextRecognized,
  onError = errorMsg => console.error(errorMsg),
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'preparing' | 'processing' | 'analyzing' | 'finalizing'>(
    'preparing'
  );
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  // Create rotation interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    if (imageUri) {
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start continuous rotation animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
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
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsProcessing(false);
          // Pass text to parent component
          onTextRecognized(text || '');
        });
      }, 500);
    } catch (error: any) {
      console.error('OCR Error:', error);

      // Fade out animation on error
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsProcessing(false);
        // Call the error handler with an appropriate message
        onError(
          typeof error === 'string'
            ? error
            : error?.message || 'Text extraction failed. Please try again with a clearer image.'
        );
      });
    }
  };

  // Return null if not processing
  if (!isProcessing) return null;

  // Get stage message
  const getStageMessage = () => {
    switch (stage) {
      case 'preparing':
        return t('preparingImage', 'Preparing image...');
      case 'processing':
        return t('extractingText', 'Extracting text...');
      case 'analyzing':
        return t('analyzingContent', 'Analyzing content...');
      case 'finalizing':
        return t('finalizing', 'Finalizing results...');
      default:
        return t('processing', 'Processing...');
    }
  };

  // We need a semi-transparent background that works in both themes
  const overlayBackgroundColor = isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)';

  // Get background color for icon container based on theme
  const getIconContainerBackgroundColor = () => {
    if (isDarkTheme) {
      // Use a safe fallback for dark theme
      return themeStyles.colors.darkGrey || '#29292b';
    }
    return themeStyles.colors.surface;
  };

  // Get background color for progress bar based on theme
  const getProgressBackgroundColor = () => {
    if (isDarkTheme) {
      // Use a safe fallback for dark theme
      return themeStyles.colors.black_grey || '#1c1c1e';
    }
    return themeStyles.colors.border;
  };

  return (
    <View style={[styles.overlay, { backgroundColor: overlayBackgroundColor }]}>
      <Animated.View
        style={[
          styles.processingCard,
          {
            backgroundColor: isDarkTheme
              ? themeStyles.colors.darkGrey
              : themeStyles.colors.background,
            ...themeStyles.shadow.md,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: getIconContainerBackgroundColor() }]}
        >
          <Animated.View
            style={{
              transform: [{ rotate: spin }],
            }}
          >
            <MaterialIcons name="autorenew" size={28} color={themeStyles.colors.greenThemeColor} />
          </Animated.View>
        </View>

        <Text
          style={[
            styles.processingTitle,
            { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary },
          ]}
        >
          {t('processingImage', 'Processing Image')}
        </Text>

        <Text
          style={[
            styles.stageText,
            { color: isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.secondary },
          ]}
        >
          {getStageMessage()}
        </Text>

        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBackground, { backgroundColor: getProgressBackgroundColor() }]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: themeStyles.colors.greenThemeColor,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.progressText,
              { color: isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.secondary },
            ]}
          >{`${Math.round(progress)}%`}</Text>
        </View>

        <View style={styles.stageIndicator}>
          <MaterialIcons
            name="image"
            size={20}
            color={
              progress >= 25
                ? themeStyles.colors.greenThemeColor
                : isDarkTheme
                  ? themeStyles.colors.grey
                  : themeStyles.colors.text.secondary
            }
          />
          <View
            style={[
              styles.stageLine,
              { backgroundColor: getProgressBackgroundColor() },
              progress >= 50 && { backgroundColor: themeStyles.colors.greenThemeColor },
            ]}
          />
          <MaterialIcons
            name="text-fields"
            size={20}
            color={
              progress >= 50
                ? themeStyles.colors.greenThemeColor
                : isDarkTheme
                  ? themeStyles.colors.grey
                  : themeStyles.colors.text.secondary
            }
          />
          <View
            style={[
              styles.stageLine,
              { backgroundColor: getProgressBackgroundColor() },
              progress >= 75 && { backgroundColor: themeStyles.colors.greenThemeColor },
            ]}
          />
          <MaterialIcons
            name="auto-awesome"
            size={20}
            color={
              progress >= 75
                ? themeStyles.colors.greenThemeColor
                : isDarkTheme
                  ? themeStyles.colors.grey
                  : themeStyles.colors.text.secondary
            }
          />
          <View
            style={[
              styles.stageLine,
              { backgroundColor: getProgressBackgroundColor() },
              progress >= 90 && { backgroundColor: themeStyles.colors.greenThemeColor },
            ]}
          />
          <MaterialIcons
            name="check-circle"
            size={20}
            color={
              progress >= 100
                ? themeStyles.colors.greenThemeColor
                : isDarkTheme
                  ? themeStyles.colors.grey
                  : themeStyles.colors.text.secondary
            }
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
