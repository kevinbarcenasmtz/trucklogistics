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
        selected ? styles.selectedDot : [
          styles.unselectedDot,
          { backgroundColor: isDarkTheme ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.2)" }
        ],
      ]}
    />
  );
};

const Skip = ({ ...props }) => {
  const { t } = useTranslation();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  return (
    <TouchableOpacity 
      style={styles.button} 
      {...props}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        props.onPress?.();
      }}
    >
      <Text style={[
        styles.buttonText,
        { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary }
      ]}>{t('skip', 'Skip')}</Text>
    </TouchableOpacity>
  );
};

const Next = ({ ...props }) => {
  const { t } = useTranslation();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  return (
    <TouchableOpacity 
      style={styles.button} 
      {...props}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        props.onPress?.();
      }}
    >
      <Text style={[
        styles.buttonText,
        { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary }
      ]}>{t('next', 'Next')}</Text>
    </TouchableOpacity>
  );
};

const Done = ({ ...props }) => {
  const { t } = useTranslation();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  return (
    <TouchableOpacity 
      style={styles.button} 
      {...props}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        props.onPress?.();
      }}
    >
      <Text style={[
        styles.buttonText,
        { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary }
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
      // Set the onboarding flag in AsyncStorage
      await AsyncStorage.setItem("onboardingCompleted", "true");
      // Navigate to the login screen
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };

  // Get background color based on theme
  const getBackgroundColor = (isDark = false) => {
    if (isDark) {
      return isDarkTheme 
        ? themeStyles.colors.black_grey 
        : themeStyles.colors.background;
    } else {
      return isDarkTheme
        ? themeStyles.colors.darkGrey
        : themeStyles.colors.surface;
    }
  };

  // Get dot color
  const getDotColor = () => isDarkTheme 
    ? '#FFFFFF'
    : themeStyles.colors.text.primary;

  const pages = [
    {
      backgroundColor: getBackgroundColor(true),
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
      title: t('onboardingTitle1', 'Welcome to TruckLogistics'),
      subtitle: t('onboardingSubtitle1', 'Streamline your logistics operations with our powerful tools.'),
      titleStyles: [
        styles.title,
        { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary }
      ],
      subTitleStyles: [
        styles.subtitle,
        { color: isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.secondary }
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
      title: t('onboardingTitle2', 'Track with Ease'),
      subtitle: t('onboardingSubtitle2', 'Monitor your fleet in real-time and optimize routes.'),
      titleStyles: [
        styles.title,
        { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary }
      ],
      subTitleStyles: [
        styles.subtitle,
        { color: isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.secondary }
      ],
    },
    {
      backgroundColor: themeStyles.colors.primary,
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
      title: t('onboardingTitle3', 'Analyze and Grow'),
      subtitle: t('onboardingSubtitle3', 'Get insights from comprehensive reports and analytics.'),
      titleStyles: [
        styles.title,
        { color: "#FFFFFF" }
      ],
      subTitleStyles: [
        styles.subtitle,
        { color: 'rgba(255, 255, 255, 0.9)' }
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
    />
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(8),
    paddingHorizontal: horizontalScale(16),
    borderRadius: moderateScale(4),
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  dot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    marginHorizontal: horizontalScale(4),
    marginBottom: verticalScale(16),
  },
  image: {
    width: horizontalScale(350),
    height: verticalScale(350),
    resizeMode: "contain",
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '600',
    lineHeight: moderateScale(32),
    textAlign: "center",
    marginBottom: verticalScale(16),
    paddingHorizontal: horizontalScale(24),
  },
  subtitle: {
    fontSize: moderateScale(16),
    textAlign: "center",
    lineHeight: moderateScale(24),
    paddingHorizontal: horizontalScale(48),
    marginBottom: verticalScale(24),
  },
  selectedDot: {
    backgroundColor: '#111827',
    transform: [{scale: 1.2}],
  },
  unselectedDot: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
});