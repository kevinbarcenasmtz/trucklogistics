import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import Onboarding from "react-native-onboarding-swiper";
import { useTranslation } from 'react-i18next';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from "@/src/theme";

interface DotsProps {
  selected: boolean;
}

const Dots: React.FC<DotsProps> = ({ selected }) => {
  return (
    <View
      style={[
        styles.dot,
        selected ? styles.selectedDot : styles.unselectedDot,
      ]}
    />
  );
};

const Skip = ({ ...props }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  return (
    <TouchableOpacity 
      style={styles.button} 
      {...props}
    >
      <Text style={[
        styles.buttonText,
        { color: themeStyles.colors.text.primary }
      ]}>{t('skip', 'Skip')}</Text>
    </TouchableOpacity>
  );
};

const Next = ({ ...props }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  return (
    <TouchableOpacity 
      style={styles.button} 
      {...props}
    >
      <Text style={[
        styles.buttonText,
        { color: themeStyles.colors.text.primary }
      ]}>{t('next', 'Next')}</Text>
    </TouchableOpacity>
  );
};

const Done = ({ ...props }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  return (
    <TouchableOpacity 
      style={styles.button} 
      {...props}
    >
      <Text style={[
        styles.buttonText,
        { color: themeStyles.colors.text.primary }
      ]}>{t('getStarted', 'Get Started')}</Text>
    </TouchableOpacity>
  );
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
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

  const pages = [
    {
      backgroundColor: themeStyles.colors.background,
      image: (
        <Image
          source={require("@/assets/icons/trucking_logistics.png")}
          style={styles.image}
        />
      ),
      title: t('onboardingTitle1', 'Welcome to TruckLogistics'),
      subtitle: t('onboardingSubtitle1', 'Streamline your logistics operations with our powerful tools.'),
      titleStyles: [
        styles.title,
        { color: themeStyles.colors.text.primary }
      ],
      subTitleStyles: [
        styles.subtitle,
        { color: themeStyles.colors.text.secondary }
      ],
    },
    {
      backgroundColor: themeStyles.colors.surface,
      image: (
        <Image
          source={require("@/assets/icons/pngwing.com(1).png")}
          style={styles.image}
        />
      ),
      title: t('onboardingTitle2', 'Track with Ease'),
      subtitle: t('onboardingSubtitle2', 'Monitor your fleet in real-time and optimize routes.'),
      titleStyles: [
        styles.title,
        { color: themeStyles.colors.text.primary }
      ],
      subTitleStyles: [
        styles.subtitle,
        { color: themeStyles.colors.text.secondary }
      ],
    },
    {
      backgroundColor: themeStyles.colors.primary,
      image: (
        <Image
          source={require("@/assets/icons/pngwing.com(2).png")}
          style={styles.image}
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
    />
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  image: {
    width: 350,
    height: 350,
    resizeMode: "contain",
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 48,
    marginBottom: 24,
  },
  selectedDot: {
    backgroundColor: '#111827',
    transform: [{scale: 1.2}],
  },
  unselectedDot: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
});