// src/components/settings/NotificationSettings.tsx
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Switch, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';

const AnimatedSwitch = Animated.createAnimatedComponent(Switch);

interface NotificationSettingsProps {
  emailNotifications: boolean;
  pushNotifications: boolean;
  onEmailChange: (value: boolean) => void;
  onPushChange: (value: boolean) => void;
  disabled?: boolean;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  emailNotifications,
  pushNotifications,
  onEmailChange,
  onPushChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const {
    textColor,
    borderColor,
    primaryColor,
    themeStyles,
    isDarkTheme,
  } = useAppTheme();

  const renderNotificationRow = (
    iconName: string,
    backgroundColor: string,
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    isFirst: boolean = false
  ) => (
    <View style={[
      styles.rowWrapper, 
      isFirst && styles.rowFirst, 
      { borderColor }
    ]}>
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor }]}>
          <Feather
            color={isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.white}
            name={iconName as any}
            size={20}
          />
        </View>
        <Text style={[styles.rowLabel, { color: textColor }]}>
          {label}
        </Text>
        <View style={styles.rowSpacer} />
        <AnimatedSwitch
          entering={FadeIn}
          onValueChange={onValueChange}
          value={value}
          disabled={disabled}
          trackColor={{
            false: isDarkTheme ? '#555555' : '#D0D0D0',
            true: primaryColor + '80',
          }}
          thumbColor={isDarkTheme ? '#f4f3f4' : '#FFFFFF'}
          ios_backgroundColor={isDarkTheme ? '#555555' : '#D0D0D0'}
        />
      </View>
    </View>
  );

  return (
    <>
      {renderNotificationRow(
        'at-sign',
        '#38C959',
        t('emailNotifications', 'Email Notifications'),
        emailNotifications,
        onEmailChange,
        true
      )}
      {renderNotificationRow(
        'bell',
        '#38C959',
        t('pushNotifications', 'Push Notifications'),
        pushNotifications,
        onPushChange
      )}
    </>
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
};