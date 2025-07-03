// src/components/settings/LanguageSelector.tsx
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';

interface LanguageSelectorProps {
  isLoading: boolean;
  onLanguageChange: () => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  isLoading,
  onLanguageChange,
  disabled = false,
}) => {
  const { t, i18n } = useTranslation();
  const {
    textColor,
    secondaryTextColor,
    primaryColor,
    borderColor,
    themeStyles,
    isDarkTheme,
  } = useAppTheme();

  const renderLanguageValue = () => {
    if (isLoading) {
      return <ActivityIndicator size="small" color={primaryColor} />;
    }

    return (
      <>
        <Text style={[styles.rowValue, { color: secondaryTextColor }]}>
          {i18n.language === 'en' ? t('english', 'English') : t('spanish', 'Español')}
        </Text>
        <Feather color={secondaryTextColor} name="chevron-right" size={20} />
      </>
    );
  };

  return (
    <View style={[styles.rowWrapper, styles.rowFirst, { borderColor }]}>
      <TouchableOpacity
        onPress={onLanguageChange}
        style={styles.row}
        activeOpacity={0.6}
        disabled={disabled || isLoading}
      >
        <View style={[styles.rowIcon, { backgroundColor: '#fe9400' }]}>
          <Feather
            color={isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.white}
            name="globe"
            size={20}
          />
        </View>
        <Text style={[styles.rowLabel, { color: textColor }]}>
          {t('languagePreference', 'Language')}
        </Text>
        <View style={styles.rowSpacer} />
        {renderLanguageValue()}
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  rowWrapper: {
    borderTopWidth: 1,
    backdropFilter: 'blur(10px)',
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  row: {
    paddingVertical: verticalScale(16),
    paddingRight: horizontalScale(16),
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: verticalScale(70),
  },
  rowIcon: {
    marginRight: horizontalScale(16),
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(8),
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  rowLabel: {
    fontSize: moderateScale(16),
    fontWeight: '500' as const,
    flex: 1,
    flexWrap: 'wrap' as const,
  },
  rowSpacer: {
    flex: 1,
  },
  rowValue: {
    fontSize: moderateScale(16),
    marginRight: horizontalScale(8),
  },
};