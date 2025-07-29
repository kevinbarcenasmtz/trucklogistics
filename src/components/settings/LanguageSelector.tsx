// src/components/settings/LanguageSelector.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

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
  const { textPrimary, textSecondary, primary, borderDefault, white, black, isDarkTheme } =
    useAppTheme();

  const renderLanguageValue = () => {
    if (isLoading) {
      return <ActivityIndicator size="small" color={primary} />;
    }

    return (
      <>
        <Text style={[styles.rowValue, { color: textSecondary }]}>
          {i18n.language === 'en' ? t('english', 'English') : t('spanish', 'Español')}
        </Text>
        <Feather color={textSecondary} name="chevron-right" size={20} />
      </>
    );
  };

  return (
    <View style={[styles.rowWrapper, styles.rowFirst, { borderColor: borderDefault }]}>
      <TouchableOpacity
        onPress={onLanguageChange}
        style={styles.row}
        activeOpacity={0.6}
        disabled={disabled || isLoading}
      >
        <View style={[styles.rowIcon, { backgroundColor: '#fe9400' }]}>
          <Feather color={isDarkTheme ? black : white} name="globe" size={20} />
        </View>
        <Text style={[styles.rowLabel, { color: textPrimary }]}>
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
