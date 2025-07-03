// src/onboarding/steps/LanguageSelectionStep.tsx
import FormButton from '@/src/components/forms/FormButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { Language, OnboardingStepProps } from '../types';
import { saveLanguagePreference } from '../utils/storage';

interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
];

export const LanguageSelectionStep: React.FC<OnboardingStepProps> = ({ context, onComplete }) => {
  const { t, i18n } = useTranslation();
  const {
    getBackgroundColor,
    getTextColor,
    getSecondaryTextColor,
    buttonPrimaryBg,
    surfaceColor,
    themeStyles,
    isDarkTheme,
  } = useAppTheme();

  const handleLanguageSelect = async (language: Language) => {
    try {
      // Save preference and change language
      await Promise.all([saveLanguagePreference(language), i18n.changeLanguage(language)]);

      // Complete the step with language data
      onComplete({ language });
    } catch (error) {
      console.error('Failed to set language:', error);

      // Show user-friendly error
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
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <View style={styles.headerContainer}>
        <Image
          source={require('@/assets/icons/logo.jpg')}
          style={[
            styles.logo,
            {
              borderRadius: themeStyles.borderRadius.circle(120),
              backgroundColor: getBackgroundColor(),
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
        <Text style={[styles.appTitle, { color: getTextColor() }]}>Trucking Logistics Pro</Text>
        <Text style={[styles.title, { color: getTextColor() }]}>
          {t('selectLanguage', 'Choose your preferred language')}
        </Text>
      </View>

      <View style={styles.formContainer}>
        {LANGUAGE_OPTIONS.map(option => (
          <FormButton
            key={option.code}
            buttonTitle={`${option.flag} ${option.nativeLabel}`}
            onPress={() => handleLanguageSelect(option.code)}
            backgroundColor={
              context.selectedLanguage === option.code ? surfaceColor : buttonPrimaryBg
            }
            textColor={context.selectedLanguage === option.code ? getTextColor() : '#FFFFFF'}
            style={styles.languageButton}
          />
        ))}
      </View>

      <Text style={[styles.footerText, { color: getSecondaryTextColor() }]}>
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
  languageButton: {
    marginVertical: 0,
    height: verticalScale(52),
  },
  footerText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(48),
  },
});
