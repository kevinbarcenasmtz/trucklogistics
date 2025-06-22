import FormButton from '@/src/components/forms/FormButton';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, View } from 'react-native';

interface LanguageOption {
  code: 'en' | 'es';
  label: string;
  nativeLabel: string;
  flag?: string;
}

interface LanguageSelectionProps {
  selectedLanguage: 'en' | 'es' | null;
  onSelectLanguage: (language: 'en' | 'es') => void;
  isLoading: boolean;
  error: string | null;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
];

export const LanguageSelection: React.FC<LanguageSelectionProps> = ({
  selectedLanguage,
  onSelectLanguage,
  isLoading,
  error,
}) => {
  const { t } = useTranslation();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  const getBackgroundColor = () =>
    isDarkTheme ? themeStyles.colors.black_grey : themeStyles.colors.background;

  const getTextColor = () =>
    isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary;

  const getSecondaryTextColor = () =>
    isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.secondary;

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
              android: {
                elevation: 5,
              },
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
            onPress={() => onSelectLanguage(option.code)}
            disabled={false}
            backgroundColor={
              selectedLanguage === option.code
                ? '#004d40' // Your app's green theme color (direct hex)
                : '#F3F4F6' // Light gray background
            }
            textColor={
              selectedLanguage === option.code
                ? '#FFFFFF' // White text for selected
                : '#111827' // Dark text for unselected
            }
            style={[
              styles.languageButton,
              {
                opacity: isLoading ? 0.6 : 1,
                pointerEvents: isLoading ? 'none' : 'auto',
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.footerContainer}>
        <Text style={[styles.footerText, { color: getSecondaryTextColor() }]}>
          {t('chooseLater', 'You can change the language later in settings')}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: themeStyles.colors.status.error }]}>
            {error}
          </Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingContent,
              {
                backgroundColor: isDarkTheme
                  ? themeStyles.colors.darkGrey
                  : themeStyles.colors.surface,
                ...themeStyles.shadow.lg,
              },
            ]}
          >
            <ActivityIndicator size="large" color={themeStyles.colors.greenThemeColor} />
            <Text style={[styles.loadingText, { color: getTextColor() }]}>
              {t('applyingLanguage', 'Applying language...')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: horizontalScale(24),
    paddingTop: verticalScale(32),
    paddingBottom: verticalScale(24),
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
    marginTop: verticalScale(16),
  },
  formContainer: {
    width: '100%',
    gap: verticalScale(12),
    marginBottom: verticalScale(24),
  },
  languageButton: {
    marginVertical: 0,
    height: verticalScale(56),
  },
  selectedButton: {
    transform: [{ scale: 1.02 }],
  },
  footerContainer: {
    alignItems: 'center',
    paddingBottom: verticalScale(24),
  },
  footerText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  errorContainer: {
    position: 'absolute',
    bottom: verticalScale(100),
    left: horizontalScale(24),
    right: horizontalScale(24),
    alignItems: 'center',
    padding: moderateScale(16),
  },
  errorText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingContent: {
    padding: moderateScale(24),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    minWidth: horizontalScale(200),
  },
  loadingText: {
    marginTop: verticalScale(16),
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
});
