// src/onboarding/steps/WelcomeStep.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { OnboardingStepProps } from '../types';

let globalCurrentPage = 0;

interface DotsProps {
  selected: boolean;
}
interface ShadowImageProps {
  source: any;
  isDarkTheme: boolean;
  themeStyles: any;
  backgroundColor: string;
}


const Dots: React.FC<DotsProps> = ({ selected }) => {
  const { isDarkTheme, textColor, borderColor, specialTextColor, specialSecondaryTextColor } =
    useAppTheme();

  // Page 1 (index 1) is the green page, pages 0 and 2 are normal
  const isOnGreenPage = globalCurrentPage === 1;

  const dotColor = selected
    ? isOnGreenPage
      ? specialTextColor
      : textColor
    : isOnGreenPage
      ? specialSecondaryTextColor
      : isDarkTheme
        ? 'rgba(255, 255, 255, 0.3)'
        : 'rgba(0, 0, 0, 0.2)';

  return (
    <View
      style={[
        styles.dot,
        {
          backgroundColor: dotColor,
          borderWidth: selected ? 0 : 1,
          borderColor: isOnGreenPage ? specialSecondaryTextColor : borderColor,
          ...Platform.select({
            ios: {
              shadowColor: isOnGreenPage ? specialTextColor : textColor,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 1,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        selected && styles.selectedDot,
      ]}
    />
  );
};

const Skip = ({ ...props }) => {
  const { t } = useTranslation();
  const { textColor, specialTextColor } = useAppTheme();
  const isOnGreenPage = globalCurrentPage === 1;

  return (
    <TouchableOpacity
      style={styles.button}
      {...props}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        props.onPress?.();
      }}
    >
      <Text style={[styles.buttonText, { color: isOnGreenPage ? specialTextColor : textColor }]}>
        {t('skip', 'Skip')}
      </Text>
    </TouchableOpacity>
  );
};

const Next = ({ ...props }) => {
  const { t } = useTranslation();
  const { textColor, specialTextColor } = useAppTheme();
  const isOnGreenPage = globalCurrentPage === 1;

  return (
    <TouchableOpacity
      style={styles.button}
      {...props}
      activeOpacity={0.7}
      onPress={() => {
        // Track page advancement
        globalCurrentPage = Math.min(globalCurrentPage + 1, 2);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        props.onPress?.();
      }}
    >
      <Text style={[styles.buttonText, { color: isOnGreenPage ? specialTextColor : textColor }]}>
        {t('next', 'Next')}
      </Text>
    </TouchableOpacity>
  );
};

const Done = ({ ...props }) => {
  const { t } = useTranslation();
  const { primaryColor } = useAppTheme();
  // Done button is on the last page (index 2), which should be normal theme

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles.doneButton,
        {
          backgroundColor: primaryColor,
        },
      ]}
      {...props}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        props.onPress?.();
      }}
    >
      <Text
        style={[
          styles.buttonText,
          styles.doneButtonText,
          {
            color: '#FFFFFF', // Always white text on primary button
          },
        ]}
      >
        {t('getStarted', 'Get Started')}
      </Text>
    </TouchableOpacity>
  );
};

const ShadowImage: React.FC<ShadowImageProps> = ({ source, isDarkTheme, themeStyles, backgroundColor }) => (
  <Image
    source={source}
    style={[
      styles.image,
      { backgroundColor },
      Platform.select({
        ios: {
          shadowColor: themeStyles.colors.black,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDarkTheme ? 0.4 : 0.2,
          shadowRadius: 5,
        },
        android: {
          elevation: 5,
        },
      }),
    ]}
  />
);

export const WelcomeStep: React.FC<OnboardingStepProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const {
    getBackgroundColor,
    getTextColor,
    getSecondaryTextColor,
    specialBackgroundColor,
    specialTextColor,
    specialSecondaryTextColor,
    themeStyles,
    isDarkTheme,
  } = useAppTheme();

  // Reset global page counter when component mounts
  React.useEffect(() => {
    globalCurrentPage = 0;
  }, []);

  const pages = [
    // Page 0: Normal theme (white/dark background, black/white dots and text)
    {
      backgroundColor: getBackgroundColor(),
      image: <ShadowImage 
        source={require('@/assets/icons/logistics1.png')} 
        isDarkTheme={isDarkTheme} 
        themeStyles={themeStyles}
        backgroundColor={getBackgroundColor()}
      />, 
      title: t('onboardingTitle1', 'Welcome to Trucking Logistics Pro'),
      subtitle: t(
        'onboardingSubtitle1',
        'Simplify your logistics with advanced tools for seamless trucking operations.'
      ),
      titleStyles: [styles.title, { color: getTextColor() }],
      subTitleStyles: [styles.subtitle, { color: getSecondaryTextColor() }],
    },
    // Page 1: Green theme (green background, white dots and text)
    {
      backgroundColor: specialBackgroundColor,
      image: <ShadowImage 
        source={require('@/assets/icons/logistics2.png')} 
        isDarkTheme={isDarkTheme} 
        themeStyles={themeStyles}
        backgroundColor={specialBackgroundColor} 
      />,
      title: t('onboardingTitle2', 'Generate Insightful Reports'),
      subtitle: t(
        'onboardingSubtitle2',
        'Track and analyze your performance with professional-grade reporting tools.'
      ),
      titleStyles: [styles.title, { color: specialTextColor }],
      subTitleStyles: [styles.subtitle, { color: specialSecondaryTextColor }],
    },
    // Page 2: Back to normal theme (white/dark background, black/white dots and text)
    {
      backgroundColor: getBackgroundColor(),
      image: <ShadowImage 
      source={require('@/assets/icons/logistics3.png')} 
      isDarkTheme={isDarkTheme} 
      themeStyles={themeStyles}
      backgroundColor={getBackgroundColor()}
    />,
      title: t('onboardingTitle3', 'Stay on Track'),
      subtitle: t(
        'onboardingSubtitle3',
        'Real-time navigation and scheduling for efficient deliveries.'
      ),
      titleStyles: [styles.title, { color: getTextColor() }],
      subTitleStyles: [styles.subtitle, { color: getSecondaryTextColor() }],
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden={true} style="light" backgroundColor="transparent" translucent={true} />
      <Onboarding
        pages={pages}
        onDone={onComplete}
        onSkip={onComplete}
        DotComponent={Dots}
        NextButtonComponent={Next}
        SkipButtonComponent={Skip}
        DoneButtonComponent={Done}
        showNext={true}
        showSkip={true}
        showDone={true}
        controlStatusBar={false}
        bottomBarHighlight={false}
        transitionAnimationDuration={300}
        allowFontScaling={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    marginHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(12),
    paddingHorizontal: horizontalScale(20),
    borderRadius: moderateScale(8),
  },
  doneButton: {
    paddingVertical: verticalScale(14),
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  doneButtonText: {
    fontWeight: '600',
  },
  dot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    marginHorizontal: horizontalScale(4),
    marginBottom: verticalScale(20),
  },
  selectedDot: {
    transform: [{ scale: 1.3 }],
  },
  image: {
    width: horizontalScale(280),
    height: verticalScale(200),
    resizeMode: 'contain',
  },
  title: {
    fontSize: moderateScale(32),
    fontWeight: '700',
    lineHeight: moderateScale(38),
    textAlign: 'center',
    marginBottom: verticalScale(12),
    paddingHorizontal: horizontalScale(20),
  },
  subtitle: {
    fontSize: moderateScale(17),
    textAlign: 'center',
    lineHeight: moderateScale(26),
    paddingHorizontal: horizontalScale(28),
    marginBottom: verticalScale(30),
  },
});
