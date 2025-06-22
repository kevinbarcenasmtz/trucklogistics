// src/onboarding/steps/WelcomeStep.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from '@/src/theme';
import { OnboardingStepProps } from '../types';
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface DotsProps {
  selected: boolean;
}

const Dots: React.FC<DotsProps> = ({ selected }) => {
  const { isDarkTheme } = useTheme();
  
  return (
    <View
      style={[
        styles.dot,
        {
          backgroundColor: selected 
            ? (isDarkTheme ? '#ffff' : '#29292b') // Dark theme: green, Light theme: white
            : isDarkTheme 
              ? 'rgba(255, 255, 255, 0.3)' // Dark theme: semi-transparent white
              : 'rgba(255, 255, 255, 0.4)', // Light theme: semi-transparent white
          borderWidth: selected ? 0 : 1,
          borderColor: isDarkTheme 
            ? 'rgba(255, 255, 255, 0.3)' // Dark theme: light border
            : 'rgba(0, 0, 0, 0.2)', // Light theme: dark border
          ...Platform.select({
            ios: {
              shadowColor: isDarkTheme ? '#FFFFFF' : '#000',
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
  const { isDarkTheme } = useTheme();
  
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
      <Text style={[
        styles.buttonText,
        { color: isDarkTheme ? '#FFFFFF' : '#111827' }
      ]}>{t('skip', 'Skip')}</Text>
    </TouchableOpacity>
  );
};

const Next = ({ ...props }) => {
  const { t } = useTranslation();
  const { isDarkTheme } = useTheme();
  
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
      <Text style={[
        styles.buttonText,
        { color: isDarkTheme ? '#FFFFFF' : '#111827' }
      ]}>{t('next', 'Next')}</Text>
    </TouchableOpacity>
  );
};

const Done = ({ ...props }) => {
  const { t } = useTranslation();
  
  return (
    <TouchableOpacity 
      style={[styles.button, styles.doneButton]} 
      {...props}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        props.onPress?.();
      }}
    >
      <Text style={[
        styles.buttonText,
        styles.doneButtonText,
        { color: '#FFFFFF' }
      ]}>{t('getStarted', 'Get Started')}</Text>
    </TouchableOpacity>
  );
};

export const WelcomeStep: React.FC<OnboardingStepProps> = ({
  onComplete,
  onBack,
  canGoBack
}) => {
  const { t } = useTranslation();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const insets = useSafeAreaInsets();

  const getBackgroundColor = (isSpecial = false) => {
    if (isSpecial) {
      return '#004d40'; // Green background for last slide
    }
    return isDarkTheme 
      ? themeStyles.colors.black_grey 
      : themeStyles.colors.background;
  };

  const getTextColor = (isSpecial = false) => {
    if (isSpecial) {
      return '#FFFFFF'; // White text on green background
    }
    return isDarkTheme 
      ? themeStyles.colors.white 
      : themeStyles.colors.text.primary;
  };

  const getSubtitleColor = (isSpecial = false) => {
    if (isSpecial) {
      return 'rgba(255, 255, 255, 0.9)'; // Semi-transparent white
    }
    return isDarkTheme 
      ? themeStyles.colors.grey 
      : themeStyles.colors.text.secondary;
  };

  const pages = [
    {
      backgroundColor: getBackgroundColor(),
      image: (
        <Image
          source={require("@/assets/icons/logistics1.png")}
          style={[
            styles.image,
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
      ),
      title: t('onboardingTitle1', 'Welcome to Trucking Logistics Pro'),
      subtitle: t('onboardingSubtitle1', 'Simplify your logistics with advanced tools for seamless trucking operations.'),
      titleStyles: [
        styles.title,
        { color: getTextColor() }
      ],
      subTitleStyles: [
        styles.subtitle,
        { color: getSubtitleColor() }
      ],
    },
    {
      backgroundColor: getBackgroundColor(),
      image: (
        <Image
          source={require("@/assets/icons/logistics2.png")}
          style={[
            styles.image,
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
      ),
      title: t('onboardingTitle2', 'Generate Insightful Reports'),
      subtitle: t('onboardingSubtitle2', 'Track and analyze your performance with professional-grade reporting tools.'),
      titleStyles: [
        styles.title,
        { color: getTextColor() }
      ],
      subTitleStyles: [
        styles.subtitle,
        { color: getSubtitleColor() }
      ],
    },
    {
      backgroundColor: getBackgroundColor(true),
      image: (
        <Image
          source={require("@/assets/icons/logistics3.png")}
          style={[
            styles.image,
            Platform.select({
              ios: {
                shadowColor: themeStyles.colors.black,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.4,
                shadowRadius: 5,
              },
              android: {
                elevation: 5,
              },
            }),
          ]}
        />
      ),
      title: t('onboardingTitle3', 'Stay on Track'),
      subtitle: t('onboardingSubtitle3', 'Real-time navigation and scheduling for efficient deliveries.'),
      titleStyles: [
        styles.title,
        { color: getTextColor(true) }
      ],
      subTitleStyles: [
        styles.subtitle,
        { color: getSubtitleColor(true) }
      ],
    },
  ];

  return (
    <View style={{ flex: 1 }}>
       <StatusBar 
        hidden={false}
        style="light" 
        backgroundColor="transparent"
        translucent={true}
      />
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
    // backgroundColor: '#29292b',
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  doneButtonText: {
    color: '#FFFFFF',
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
    width: horizontalScale(280), // Larger, more prominent
    height: verticalScale(200),  // Better proportions
    resizeMode: "contain",
  },
  title: {
    fontSize: moderateScale(32), // Slightly larger
    fontWeight: '700',
    lineHeight: moderateScale(38),
    textAlign: "center",
    marginBottom: verticalScale(12),
    paddingHorizontal: horizontalScale(20),
  },
  subtitle: {
    fontSize: moderateScale(17), // Slightly larger for readability
    textAlign: "center",
    lineHeight: moderateScale(26),
    paddingHorizontal: horizontalScale(28),
    marginBottom: verticalScale(30),
  },
});