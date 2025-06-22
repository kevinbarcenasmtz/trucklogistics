import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedGestureHandler, 
  useAnimatedStyle,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from '@/src/theme';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import FormButton from '@/src/components/forms/FormButton';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingSlide {
  key: string;
  title: string;
  subtitle: string;
  image: any;
  backgroundColor?: string;
}

interface OnboardingSlidesProps {
  currentStep: 'intro' | 'features' | 'permissions';
  onNext: () => void;
  onPrevious?: () => void;
  canProceed: boolean;
  isLoading: boolean;
  stepIndex: number;
  totalSteps: number;
}

export const OnboardingSlides: React.FC<OnboardingSlidesProps> = ({
  currentStep,
  onNext,
  onPrevious,
  canProceed,
  isLoading,
  stepIndex,
  totalSteps,
}) => {
  const { t } = useTranslation();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  const translateX = useSharedValue(0);

  // Reset animation when step changes
  useEffect(() => {
    translateX.value = withSpring(0);
  }, [currentStep, translateX]);

  const getTextColor = () => isDarkTheme 
    ? themeStyles.colors.white 
    : themeStyles.colors.text.primary;

  const getSecondaryTextColor = () => isDarkTheme 
    ? themeStyles.colors.grey 
    : themeStyles.colors.text.secondary;

  const getBackgroundColor = () => isDarkTheme 
    ? themeStyles.colors.black_grey 
    : themeStyles.colors.background;

  const slides: Record<string, OnboardingSlide> = {
    intro: {
      key: 'intro',
      title: t('onboardingTitle1', 'Welcome to Trucking Logistics Pro'),
      subtitle: t('onboardingSubtitle1', 'Simplify your logistics with advanced tools for seamless trucking operations.'),
      image: require('@/assets/icons/trucking_logistics.png'),
    },
    features: {
      key: 'features',
      title: t('onboardingTitle2', 'Generate Insightful Reports'),
      subtitle: t('onboardingSubtitle2', 'Track and analyze your performance with professional-grade reporting tools.'),
      image: require('@/assets/icons/pngwing.com(1).png'),
    },
    permissions: {
      key: 'permissions',
      title: t('onboardingTitle3', 'Stay on Track'),
      subtitle: t('onboardingSubtitle3', 'Real-time navigation and scheduling for efficient deliveries.'),
      image: require('@/assets/icons/pngwing.com(2).png'),
      backgroundColor: '#004d40',
    },
  };

  const currentSlide = slides[currentStep];
  const isLastSlide = stepIndex === totalSteps - 1;

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      // Only allow gesture if content is ready
    },
    onActive: (event) => {
      // Only move within reasonable bounds
      const clampedTranslation = Math.max(
        Math.min(event.translationX, screenWidth / 2), 
        -screenWidth / 2
      );
      translateX.value = clampedTranslation;
    },
    onEnd: (event) => {
      const velocity = event.velocityX;
      const shouldGoNext = (event.translationX < -screenWidth / 4 || velocity < -500) && !isLastSlide;
      const shouldGoPrevious = (event.translationX > screenWidth / 4 || velocity > 500) && stepIndex > 0;
      
      if (shouldGoNext) {
        // Animate out and then trigger state change
        translateX.value = withSpring(-screenWidth, {
          damping: 20,
          stiffness: 300,
        }, (finished) => {
          if (finished) {
            runOnJS(onNext)();
          }
        });
      } else if (shouldGoPrevious && onPrevious) {
        // Animate out and then trigger state change
        translateX.value = withSpring(screenWidth, {
          damping: 20,
          stiffness: 300,
        }, (finished) => {
          if (finished) {
            runOnJS(onPrevious)();
          }
        });
      } else {
        // Snap back to original position
        translateX.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const renderProgressDots = () => (
    <View style={styles.dotsContainer}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index <= stepIndex 
                ? '#004d40'
                : isDarkTheme 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'rgba(0, 0, 0, 0.2)',
            },
            index === stepIndex && styles.activeDot,
          ]}
        />
      ))}
    </View>
  );

  // Don't render if no current slide
  if (!currentSlide) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[
        styles.container,
        { backgroundColor: currentSlide.backgroundColor || getBackgroundColor() }
      ]}>
        {/* Header with back button */}
        <View style={styles.header}>
          {onPrevious && stepIndex > 0 && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onPrevious}
              disabled={isLoading}
            >
              <Feather 
                name="arrow-left" 
                size={24} 
                color={currentSlide.backgroundColor ? '#FFFFFF' : getTextColor()} 
              />
            </TouchableOpacity>
          )}
          <View style={styles.headerSpacer} />
        </View>

        {/* Swipeable Content - Wrap the entire content */}
        <PanGestureHandler onGestureEvent={gestureHandler} enabled={!isLoading}>
          <Animated.View style={[styles.content, animatedStyle]}>
            {/* Always render current slide content */}
            <Image
              key={currentSlide.key} // Force re-render when slide changes
              source={currentSlide.image}
              style={styles.image}
              resizeMode="contain"
            />
            
            <View style={styles.textContainer}>
              <Text style={[
                styles.title,
                { 
                  color: currentSlide.backgroundColor 
                    ? '#FFFFFF' 
                    : getTextColor() 
                }
              ]}>
                {currentSlide.title}
              </Text>
              
              <Text style={[
                styles.subtitle,
                { 
                  color: currentSlide.backgroundColor 
                    ? 'rgba(255, 255, 255, 0.9)' 
                    : getSecondaryTextColor() 
                }
              ]}>
                {currentSlide.subtitle}
              </Text>
            </View>
          </Animated.View>
        </PanGestureHandler>

        {/* Footer */}
        <View style={styles.footer}>
          {renderProgressDots()}
          
          <FormButton
            buttonTitle={
              isLoading 
                ? t('loading', 'Loading...') 
                : isLastSlide 
                  ? t('getStarted', 'Get Started') 
                  : t('next', 'Next')
            }
            onPress={onNext}
            disabled={!canProceed || isLoading}
            backgroundColor="#004d40"
            textColor="#FFFFFF"
            style={styles.nextButton}
          />
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(16),
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(16),
    zIndex: 10, // Keep header above content
  },
  backButton: {
    padding: moderateScale(8),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(24),
  },
  image: {
    width: horizontalScale(280),
    height: verticalScale(280),
    marginBottom: verticalScale(32),
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(48),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(16),
    lineHeight: moderateScale(36),
  },
  subtitle: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    lineHeight: moderateScale(24),
    paddingHorizontal: horizontalScale(16),
  },
  footer: {
    paddingHorizontal: horizontalScale(24),
    paddingBottom: verticalScale(48),
    zIndex: 10, // Keep footer above content
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(32),
    gap: horizontalScale(8),
  },
  dot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  activeDot: {
    transform: [{ scale: 1.2 }],
  },
  nextButton: {
    marginVertical: 0,
  },
});