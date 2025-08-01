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
  backgroundColor: string;
}

const Dots: React.FC<DotsProps> = ({ selected }) => {
  const { isDarkTheme, textPrimary, borderDefault, white, textSecondary, black } = useAppTheme();

  const isOnGreenPage = globalCurrentPage === 1;

  // Use solid colors instead of rgba with transparency
  const dotColor = selected
    ? isOnGreenPage
      ? white
      : textPrimary
    : isOnGreenPage
      ? textSecondary
      : isDarkTheme
        ? '#555555' // Solid color instead of rgba(255, 255, 255, 0.3)
        : '#CCCCCC'; // Solid color instead of rgba(0, 0, 0, 0.2)

  return (
    <View
      style={[
        styles.dot,
        {
          backgroundColor: dotColor,
          borderWidth: selected ? 0 : 1,
          borderColor: isOnGreenPage ? textSecondary : borderDefault,
          // Only apply shadow if we have a solid background color
          ...(dotColor.includes('rgba')
            ? {}
            : Platform.select({
                ios: {
                  shadowColor: isOnGreenPage ? white : isDarkTheme ? black : textPrimary,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 1,
                },
                android: {
                  elevation: 4,
                },
              })),
        },
        selected && styles.selectedDot,
      ]}
    />
  );
};

const Skip = ({ ...props }) => {
  const { t } = useTranslation();
  const { textPrimary, white } = useAppTheme();
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
      <Text style={[styles.buttonText, { color: isOnGreenPage ? white : textPrimary }]}>
        {t('skip', 'Skip')}
      </Text>
    </TouchableOpacity>
  );
};

const Next = ({ ...props }) => {
  const { t } = useTranslation();
  const { textPrimary, white } = useAppTheme();
  const isOnGreenPage = globalCurrentPage === 1;

  return (
    <TouchableOpacity
      style={styles.button}
      {...props}
      activeOpacity={0.7}
      onPress={() => {
        globalCurrentPage = Math.min(globalCurrentPage + 1, 2);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        props.onPress?.();
      }}
    >
      <Text style={[styles.buttonText, { color: isOnGreenPage ? white : textPrimary }]}>
        {t('next', 'Next')}
      </Text>
    </TouchableOpacity>
  );
};

const Done = ({ ...props }) => {
  const { t } = useTranslation();
  const { textPrimary } = useAppTheme();

  return (
    <TouchableOpacity
      style={styles.button}
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
          {
            color: textPrimary,
          },
        ]}
      >
        {t('getStarted', 'Get Started')}
      </Text>
    </TouchableOpacity>
  );
};

// Apply shadow to wrapper View with solid background
const ShadowImage: React.FC<ShadowImageProps> = ({ source, isDarkTheme, backgroundColor }) => {
  return <Image source={source} style={styles.image} />;
};

export const WelcomeStep: React.FC<OnboardingStepProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { getBackground, getText, primary, white, textSecondary, isDarkTheme } = useAppTheme();

  React.useEffect(() => {
    globalCurrentPage = 0;
  }, []);

  const pages = [
    {
      backgroundColor: getBackground('screen'),
      image: (
        <ShadowImage
          source={require('@/assets/icons/logistics1.png')}
          isDarkTheme={isDarkTheme}
          backgroundColor={getBackground('screen')}
        />
      ),
      title: t('onboardingTitle1', 'Welcome to Trucking Logistics Pro'),
      subtitle: t(
        'onboardingSubtitle1',
        'Simplify your logistics with advanced tools for seamless trucking operations.'
      ),
      titleStyles: [styles.title, { color: getText('primary') }],
      subTitleStyles: [styles.subtitle, { color: getText('secondary') }],
    },
    {
      backgroundColor: primary,
      image: (
        <ShadowImage
          source={require('@/assets/icons/logistics2.png')}
          isDarkTheme={isDarkTheme}
          backgroundColor={primary}
        />
      ),
      title: t('onboardingTitle2', 'Generate Insightful Reports'),
      subtitle: t(
        'onboardingSubtitle2',
        'Track and analyze your performance with professional-grade reporting tools.'
      ),
      titleStyles: [styles.title, { color: white }],
      subTitleStyles: [styles.subtitle, { color: textSecondary }],
    },
    {
      backgroundColor: getBackground('screen'),
      image: (
        <ShadowImage
          source={require('@/assets/icons/logistics3.png')}
          isDarkTheme={isDarkTheme}
          backgroundColor={getBackground('screen')}
        />
      ),
      title: t('onboardingTitle3', 'Stay on Track'),
      subtitle: t(
        'onboardingSubtitle3',
        'Real-time navigation and scheduling for efficient deliveries.'
      ),
      titleStyles: [styles.title, { color: getText('primary') }],
      subTitleStyles: [styles.subtitle, { color: getText('secondary') }],
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
    paddingVertical: verticalScale(8),
    paddingHorizontal: horizontalScale(20),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(20),
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    letterSpacing: 0.1,
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
