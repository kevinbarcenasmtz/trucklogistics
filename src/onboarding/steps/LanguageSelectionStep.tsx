// src/onboarding/steps/LanguageSelectionStep.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import * as Haptics from 'expo-haptics';
import React, { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Alert, 
  Image, 
  Platform, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { Language, OnboardingStepProps } from '../types';
import { saveLanguagePreference } from '../utils/storage';

interface LanguageOption {
  descText: ReactNode;
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
  actionText: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇺🇸',
    actionText: 'Start Your Journey →',
    descText: 'Manage your trucks with confidence',
  },
  {
    code: 'es',
    label: 'Spanish',
    nativeLabel: 'Español',
    flag: '🇪🇸',
    actionText: 'Comienza tu Viaje →',
    descText: 'Maneje sus camiones con confianza',
  },
];

export const LanguageSelectionStep: React.FC<OnboardingStepProps> = ({ context, onComplete }) => {
  const { t, i18n } = useTranslation();
  const { getBackground, getText, getButton, themeStyles, isDarkTheme } = useAppTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLanguageSelect = async (language: Language) => {
    // Prevent multiple selections
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Save language preference
      await Promise.all([
        saveLanguagePreference(language), 
        i18n.changeLanguage(language)
      ]);

      // Simple delay for smooth transition (adjust as needed)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Complete the step
      onComplete({ language });

    } catch (error) {
      console.error('Failed to set language:', error);
      setIsProcessing(false);
      
      Alert.alert(
        t('error', 'Error'),
        t('languageChangeError', 'Failed to change language. Please try again.'),
        [
          {
            text: t('cancel', 'Cancel'),
            style: 'cancel',
          },
          {
            text: t('retry', 'Retry'),
            onPress: () => handleLanguageSelect(language),
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackground('screen') }]}>
      <View style={styles.headerContainer}>
        <Image
          source={require('@/assets/icons/logo.jpg')}
          style={[
            styles.logo,
            {
              borderRadius: 60,
              backgroundColor: getBackground('screen'),
            },
            Platform.select({
              ios: {
                shadowColor: themeStyles.colors.black,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDarkTheme ? 0.4 : 0.2,
                shadowRadius: 5,
              },
              android: { elevation: 5 },
            }),
          ]}
        />
        <Text style={[styles.appTitle, { color: getText('primary') }]}>
          Trucking Logistics Pro
        </Text>
        <Text style={[styles.title, { color: getText('primary') }]}>
          {t('selectLanguage', 'Ready to hit the road?')}
        </Text>
      </View>

      <View style={styles.formContainer}>
        {LANGUAGE_OPTIONS.map(option => {
          return (
            <TouchableOpacity
              key={option.code}
              style={[
                styles.routeButton,
                {
                  backgroundColor: getBackground('card'),
                  borderLeftColor: getButton('primary').backgroundColor,
                  borderLeftWidth: moderateScale(8),
                  ...themeStyles.shadow.sm,
                },
              ]}
              onPress={() => handleLanguageSelect(option.code)}
              activeOpacity={0.7}
              disabled={isProcessing}
            >
              <View style={styles.routeInfo}>
                <View
                  style={[
                    styles.flagContainer,
                    {
                      backgroundColor: getBackground('contrast'),
                    },
                  ]}
                >
                  <Text style={styles.routeFlag}>{option.flag}</Text>
                </View>
                <View style={styles.destinationInfo}>
                  <Text style={[styles.destination, { color: getText('primary') }]}>
                    {option.nativeLabel} Route
                  </Text>
                  <Text style={[styles.journey, { color: getText('primary') }]}>
                    {option.actionText}
                  </Text>
                  <Text style={[styles.distance, { color: getText('secondary') }]}>
                    {option.descText}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.footerText, { color: getText('secondary') }]}>
        {t('chooseLater', 'You can change the language later in settings')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: horizontalScale(24),
    paddingTop: verticalScale(32),
    paddingBottom: verticalScale(46),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(32),
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    height: moderateScale(120),
    width: moderateScale(120),
    resizeMode: 'cover',
    marginBottom: verticalScale(16),
  },
  appTitle: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    lineHeight: moderateScale(30),
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    textAlign: 'center',
    marginTop: verticalScale(14),
  },
  formContainer: {
    width: '100%',
    gap: verticalScale(16),
    marginBottom: verticalScale(58),
  },
  routeButton: {
    padding: moderateScale(16),
    borderRadius: moderateScale(8),
    marginVertical: verticalScale(6),
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(16),
  },
  routeFlag: {
    fontSize: moderateScale(20),
  },
  destinationInfo: {
    flex: 1,
  },
  destination: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  journey: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginVertical: verticalScale(2),
  },
  distance: {
    fontSize: moderateScale(12),
  },
  footerText: {
    fontSize: moderateScale(13),
    textAlign: 'center',
    lineHeight: moderateScale(48),
  },
});