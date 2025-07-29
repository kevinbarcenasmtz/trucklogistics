import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface ThemeToggleProps {
  isLoading: boolean;
  onThemeChange: () => void;
  themePreference: 'system' | 'light' | 'dark';
  disabled?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isLoading,
  onThemeChange,
  themePreference,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { textPrimary, textSecondary, primary, borderDefault, white, black, isDarkTheme } =
    useAppTheme();

  const getThemeLabel = () => {
    if (isLoading) return t('changing', 'Changing...');

    switch (themePreference) {
      case 'system':
        return t('themeSystem', 'System');
      case 'light':
        return t('themeLight', 'Light');
      case 'dark':
        return t('themeDark', 'Dark');
      default:
        return t('themeSystem', 'System');
    }
  };

  const renderThemeValue = () => {
    if (isLoading) {
      return <ActivityIndicator size="small" color={primary} />;
    }

    return (
      <>
        <Text style={[styles.rowValue, { color: textSecondary }]}>{getThemeLabel()}</Text>
        <Feather color={textSecondary} name="chevron-right" size={20} />
      </>
    );
  };

  return (
    <View style={[styles.rowWrapper, { borderColor: borderDefault }]}>
      <TouchableOpacity
        onPress={onThemeChange}
        style={styles.row}
        activeOpacity={0.6}
        disabled={disabled || isLoading}
      >
        <View style={[styles.rowIcon, { backgroundColor: '#007AFF' }]}>
          <Feather
            color={isDarkTheme ? black : white}
            name={isDarkTheme ? 'moon' : 'sun'}
            size={20}
          />
        </View>
        <Text style={[styles.rowLabel, { color: textPrimary }]}>{t('theme', 'Theme')}</Text>
        <View style={styles.rowSpacer} />
        {renderThemeValue()}
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  rowWrapper: {
    borderTopWidth: 1,
    backdropFilter: 'blur(10px)',
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
