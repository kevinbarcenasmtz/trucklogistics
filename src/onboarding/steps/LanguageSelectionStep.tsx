// src/onboarding/steps/LanguageSelectionStep.tsx
import FormButton from '@/src/components/forms/FormButton';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
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

  const [isProcessing, setIsProcessing] = useState(false);

  const handleLanguageSelect = async (language: Language) => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      await saveLanguagePreference(language);
      await i18n.changeLanguage(language);

      setTimeout(() => {
        onComplete({ language });
      }, 400);
    } catch (err) {
      console.error('Failed to set language:', err);
      setTimeout(() => {
        onComplete({ language });
      }, 400);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <View style={styles.headerContainer}>
        <Image
          source={require('@/assets/icons/logo.jpg')}
          style={[
            styles.logo,
            { borderRadius: themeStyles.borderRadius.circle(120) },
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
            disabled={isProcessing}
            backgroundColor={
              context.selectedLanguage === option.code ? surfaceColor : buttonPrimaryBg
            }
            textColor={context.selectedLanguage === option.code ? getTextColor() : '#ffff'}
            style={[styles.languageButton, { opacity: isProcessing ? 0.7 : 1 }]}
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
