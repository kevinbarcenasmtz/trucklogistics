// app/(auth)/onboarding.tsx 
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from "react-native";
import { useRouter } from "expo-router";
import Onboarding from "react-native-onboarding-swiper";
import { useTranslation } from 'react-i18next';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from "@/src/theme";
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
            ? '#004d40' // Your green theme color
            : isDarkTheme 
              ? "rgba(255, 255, 255, 0.3)" 
              : "rgba(0, 0, 0, 0.2)"
        },
        selected && styles.selectedDot,
      ]}
    />
  );
};

const Skip = ({ ...props }) => {
  const { t } = useTranslation();
  const { theme, isDarkTheme } = useTheme();
  
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
  const { theme, isDarkTheme } = useTheme();
  
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
  const { theme } = useTheme();
  
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



export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem("onboardingCompleted", "true");
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };

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
          source={require("@/assets/icons/trucking_logistics.png")}
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
          source={require("@/assets/icons/pngwing.com(1).png")}
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
      backgroundColor: getBackgroundColor(true), // Special green background
      image: (
        <Image
          source={require("@/assets/icons/pngwing.com(2).png")}
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
    <Onboarding
      SkipButtonComponent={Skip}
      NextButtonComponent={Next}
      DoneButtonComponent={Done}
      DotComponent={Dots}
      onSkip={handleOnboardingComplete}
      onDone={handleOnboardingComplete}
      pages={pages}
      containerStyles={{ paddingBottom: 0 }}
      bottomBarHighlight={false}
      transitionAnimationDuration={300}
      allowFontScaling={false}
      showNext={true}
      showSkip={true}
      showDone={true}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(12),
    paddingHorizontal: horizontalScale(20),
    borderRadius: moderateScale(8),
  },
  doneButton: {
    backgroundColor: '#004d40',
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  doneButtonText: {
    color: '#FFFFFF',
  },
  dot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginHorizontal: horizontalScale(4),
    marginBottom: verticalScale(16),
  },
  selectedDot: {
    transform: [{ scale: 1.2 }],
  },
  image: {
    width: horizontalScale(300),
    height: verticalScale(300),
    resizeMode: "contain",
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    lineHeight: moderateScale(36),
    textAlign: "center",
    marginBottom: verticalScale(16),
    paddingHorizontal: horizontalScale(24),
  },
  subtitle: {
    fontSize: moderateScale(16),
    textAlign: "center",
    lineHeight: moderateScale(24),
    paddingHorizontal: horizontalScale(32),
    marginBottom: verticalScale(24),
  },
});