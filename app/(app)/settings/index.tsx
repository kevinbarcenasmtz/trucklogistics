// app/(app)/settings/index.tsx
import { useAuth } from '@/src/context/AuthContextMigration';
import { useTheme } from '@/src/context/ThemeContext';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

const AnimatedSwitch = Animated.createAnimatedComponent(Switch);

type SettingsState = 'idle' | 'changing-language' | 'logging-out' | 'changing-theme';

export default function Settings() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user, logout, userData } = useAuth();

  // Theme management
  const { themePreference, setTheme, isChangingTheme, themeConstants } = useTheme();

  // ✅ Single hook for all theme values
  const {
    backgroundColor,
    surfaceColor,
    textColor,
    secondaryTextColor,
    primaryColor,
    borderColor,
    themeStyles,
    isDarkTheme,
  } = useAppTheme();

  // ✅ Single state machine instead of multiple useState
  const [settingsState, setSettingsState] = useState<SettingsState>('idle');

  // ✅ Notification settings as separate state (independent business logic)
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: false,
  });

  // ✅ Calculated states instead of multiple useState
  const isLoading = settingsState !== 'idle';
  const isLanguageLoading = settingsState === 'changing-language';
  const isLoggingOut = settingsState === 'logging-out';
  const isThemeChanging = settingsState === 'changing-theme' || isChangingTheme;

  // Handle theme change with error handling
  const handleThemeChange = async () => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }

    setSettingsState('changing-theme');

    try {
      // Cycle through theme options: system -> light -> dark -> system
      const nextTheme =
        themePreference === themeConstants.THEME_SYSTEM
          ? themeConstants.THEME_LIGHT
          : themePreference === themeConstants.THEME_LIGHT
            ? themeConstants.THEME_DARK
            : themeConstants.THEME_SYSTEM;

      const success = await setTheme(nextTheme);

      if (!success) {
        Alert.alert(
          t('error', 'Error'),
          t('themeChangeError', 'Failed to change theme. Please try again.')
        );
      }
    } catch (error) {
      console.error('Error changing theme:', error);
      Alert.alert(
        t('error', 'Error'),
        t('themeChangeError', 'Failed to change theme. Please try again.')
      );
    } finally {
      setSettingsState('idle');
    }
  };

  // Get current theme label for display
  const getThemeLabel = () => {
    if (isThemeChanging) return t('changing', 'Changing...');

    switch (themePreference) {
      case themeConstants.THEME_SYSTEM:
        return t('themeSystem', 'System');
      case themeConstants.THEME_LIGHT:
        return t('themeLight', 'Light');
      case themeConstants.THEME_DARK:
        return t('themeDark', 'Dark');
      default:
        return t('themeSystem', 'System');
    }
  };

  const handleLanguageChange = async () => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }

    setSettingsState('changing-language');

    try {
      const newLanguage = i18n.language === 'en' ? 'es' : 'en';
      await i18n.changeLanguage(newLanguage);

      // Save language preference
      await AsyncStorage.setItem('userLanguage', newLanguage);
      await AsyncStorage.setItem('languageSelected', 'true');
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(
        t('error', 'Error'),
        t('languageChangeError', 'Failed to change language. Please try again.')
      );
    } finally {
      setSettingsState('idle');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('logout', 'Logout'),
      t('logoutConfirmation', 'Are you sure you want to logout?'),
      [
        {
          text: t('cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('logout', 'Logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (error) {
              console.warn('Haptic feedback not supported:', error);
            }

            setSettingsState('logging-out');

            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(
                t('error', 'Error'),
                t('logoutError', 'Failed to logout. Please try again.')
              );
            } finally {
              setSettingsState('idle');
            }
          },
        },
      ]
    );
  };

  // ✅ Flattened helper functions - simple calculations
  const getLocation = () => {
    if (!userData) return t('unknownLocation', 'Unknown Location');
    const { city = '', state = '' } = userData;
    return (
      `${city}, ${state}`.trim().replace(/^, |, $/g, '') || t('unknownLocation', 'Unknown Location')
    );
  };

  const getFullName = () => {
    if (!userData) return t('defaultName', 'User');
    const { fname = '', lname = '' } = userData;
    return `${fname} ${lname}`.trim() || t('defaultName', 'User');
  };

  const getInitials = () => {
    if (userData?.fname && userData?.lname) {
      return `${userData.fname[0]}${userData.lname[0]}`.toUpperCase();
    }
    return (
      user?.fname?.substring(0, 2)?.toUpperCase() ||
      user?.email?.substring(0, 2)?.toUpperCase() ||
      'JD'
    );
  };

  const renderAvatar = () => (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: primaryColor,
          ...Platform.select({
            ios: {
              shadowColor: themeStyles.colors.black,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
            },
            android: {
              elevation: 4,
            },
          }),
        },
      ]}
    >
      <Text style={[styles.avatarText, { color: themeStyles.colors.white }]}>{getInitials()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {t('settings', 'Settings')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: secondaryTextColor }]}>
            {t('manageAccount', 'Manage your account and preferences')}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: verticalScale(100) }}
        >
          <Animated.View
            entering={FadeIn.duration(600)}
            style={[
              styles.profile,
              {
                backgroundColor: surfaceColor,
                ...Platform.select({
                  ios: {
                    shadowColor: themeStyles.colors.black,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDarkTheme ? 0.3 : 0.1,
                    shadowRadius: 3,
                  },
                  android: {
                    elevation: 4,
                  },
                }),
              },
            ]}
          >
            {renderAvatar()}
            <Text style={[styles.profileName, { color: textColor }]}>{getFullName()}</Text>
            <Text style={[styles.profileEmail, { color: secondaryTextColor }]}>
              {userData?.email || user?.email || t('defaultEmail', 'user@example.com')}
            </Text>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.actionButtonWrapper}
                onPress={() => router.push('/(app)/settings/edit')}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <View
                  style={[
                    styles.profileAction,
                    {
                      backgroundColor: primaryColor,
                      opacity: isLoading ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.profileActionText, { color: themeStyles.colors.white }]}>
                    {t('editProfile', 'Edit Profile')}
                  </Text>
                  <Feather color={themeStyles.colors.white} name="edit" size={16} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonWrapper}
                onPress={handleLogout}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.profileAction,
                    {
                      backgroundColor: primaryColor,
                      opacity: isLoading ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.profileActionText, { color: themeStyles.colors.white }]}>
                    {isLoggingOut ? t('loggingOut', 'Logging out...') : t('logOut', 'Log Out')}
                  </Text>
                  {isLoggingOut ? (
                    <ActivityIndicator size="small" color={themeStyles.colors.white} />
                  ) : (
                    <Feather color={themeStyles.colors.white} name="log-out" size={16} />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
              {t('preferences', 'Preferences')}
            </Text>

            <View
              style={[
                styles.sectionBody,
                {
                  backgroundColor: surfaceColor,
                  ...Platform.select({
                    ios: {
                      shadowColor: themeStyles.colors.black,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isDarkTheme ? 0.2 : 0.1,
                      shadowRadius: 2,
                    },
                    android: {
                      elevation: 2,
                    },
                  }),
                },
              ]}
            >
              <View style={[styles.rowWrapper, styles.rowFirst, { borderColor: borderColor }]}>
                <TouchableOpacity
                  onPress={handleLanguageChange}
                  style={styles.row}
                  activeOpacity={0.6}
                  disabled={isLoading}
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
                  {isLanguageLoading ? (
                    <ActivityIndicator size="small" color={primaryColor} />
                  ) : (
                    <>
                      <Text style={[styles.rowValue, { color: secondaryTextColor }]}>
                        {i18n.language === 'en' ? t('english', 'English') : t('spanish', 'Español')}
                      </Text>
                      <Feather color={secondaryTextColor} name="chevron-right" size={20} />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={[styles.rowWrapper, { borderColor: borderColor }]}>
                <TouchableOpacity
                  onPress={handleThemeChange}
                  style={styles.row}
                  activeOpacity={0.6}
                  disabled={isLoading}
                >
                  <View style={[styles.rowIcon, { backgroundColor: '#007AFF' }]}>
                    <Feather
                      color={isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.white}
                      name={isDarkTheme ? 'moon' : 'sun'}
                      size={20}
                    />
                  </View>
                  <Text style={[styles.rowLabel, { color: textColor }]}>{t('theme', 'Theme')}</Text>
                  <View style={styles.rowSpacer} />
                  {isThemeChanging ? (
                    <ActivityIndicator size="small" color={primaryColor} />
                  ) : (
                    <>
                      <Text style={[styles.rowValue, { color: secondaryTextColor }]}>
                        {getThemeLabel()}
                      </Text>
                      <Feather color={secondaryTextColor} name="chevron-right" size={20} />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={[styles.rowWrapper, { borderColor: borderColor }]}>
                <View style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: '#32c759' }]}>
                    <Feather
                      color={isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.white}
                      name="navigation"
                      size={20}
                    />
                  </View>
                  <Text style={[styles.rowLabel, { color: textColor }]}>
                    {t('location', 'Location')}
                  </Text>
                  <View style={styles.rowSpacer} />
                  <Text style={[styles.rowValue, { color: secondaryTextColor }]}>
                    {getLocation()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
              {t('notifications', 'Notifications')}
            </Text>

            <View
              style={[
                styles.sectionBody,
                {
                  backgroundColor: surfaceColor,
                  ...Platform.select({
                    ios: {
                      shadowColor: themeStyles.colors.black,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isDarkTheme ? 0.2 : 0.1,
                      shadowRadius: 2,
                    },
                    android: {
                      elevation: 2,
                    },
                  }),
                },
              ]}
            >
              <View style={[styles.rowWrapper, styles.rowFirst, { borderColor: borderColor }]}>
                <View style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: '#38C959' }]}>
                    <Feather
                      color={isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.white}
                      name="at-sign"
                      size={20}
                    />
                  </View>
                  <Text style={[styles.rowLabel, { color: textColor }]}>
                    {t('emailNotifications', 'Email Notifications')}
                  </Text>
                  <View style={styles.rowSpacer} />
                  <AnimatedSwitch
                    entering={FadeIn}
                    onValueChange={email => {
                      try {
                        Haptics.selectionAsync();
                      } catch (error) {
                        console.warn('Haptic feedback not supported:', error);
                      }
                      setNotificationSettings(prev => ({ ...prev, email }));
                    }}
                    value={notificationSettings.email}
                    disabled={isLoading}
                    trackColor={{
                      false: isDarkTheme ? '#555555' : '#D0D0D0',
                      true: primaryColor + '80',
                    }}
                    thumbColor={isDarkTheme ? '#f4f3f4' : '#FFFFFF'}
                    ios_backgroundColor={isDarkTheme ? '#555555' : '#D0D0D0'}
                  />
                </View>
              </View>

              <View style={[styles.rowWrapper, { borderColor: borderColor }]}>
                <View style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: '#38C959' }]}>
                    <Feather
                      color={isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.white}
                      name="bell"
                      size={20}
                    />
                  </View>
                  <Text style={[styles.rowLabel, { color: textColor }]}>
                    {t('pushNotifications', 'Push Notifications')}
                  </Text>
                  <View style={styles.rowSpacer} />
                  <AnimatedSwitch
                    entering={FadeIn}
                    onValueChange={push => {
                      try {
                        Haptics.selectionAsync();
                      } catch (error) {
                        console.warn('Haptic feedback not supported:', error);
                      }
                      setNotificationSettings(prev => ({ ...prev, push }));
                    }}
                    value={notificationSettings.push}
                    disabled={isLoading}
                    trackColor={{
                      false: isDarkTheme ? '#555555' : '#D0D0D0',
                      true: primaryColor + '80',
                    }}
                    thumbColor={isDarkTheme ? '#f4f3f4' : '#FFFFFF'}
                    ios_backgroundColor={isDarkTheme ? '#555555' : '#D0D0D0'}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: verticalScale(14),
    flex: 1,
  },
  header: {
    paddingHorizontal: horizontalScale(24),
    marginBottom: verticalScale(16),
  },
  headerTitle: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: moderateScale(16),
    marginTop: verticalScale(4),
  },
  profile: {
    padding: horizontalScale(24),
    alignItems: 'center',
    borderRadius: moderateScale(16),
    marginHorizontal: horizontalScale(16),
    marginBottom: verticalScale(24),
    marginTop: verticalScale(4),
  },
  avatar: {
    height: moderateScale(80),
    width: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: moderateScale(24),
    fontWeight: '700',
  },
  profileName: {
    marginTop: verticalScale(16),
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  profileEmail: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(16),
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: verticalScale(16),
    gap: horizontalScale(8),
  },
  actionButtonWrapper: {
    flex: 1,
  },
  profileAction: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: horizontalScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(8),
    minWidth: horizontalScale(120),
    gap: horizontalScale(8),
  },
  profileActionText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  section: {
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    marginBottom: verticalScale(16),
    marginHorizontal: horizontalScale(24),
    fontSize: moderateScale(14),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionBody: {
    borderRadius: moderateScale(16),
    marginHorizontal: horizontalScale(16),
    paddingLeft: horizontalScale(16),
    overflow: 'hidden',
  },
  row: {
    paddingVertical: verticalScale(16),
    paddingRight: horizontalScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    height: verticalScale(70),
  },
  rowWrapper: {
    borderTopWidth: 1,
    backdropFilter: 'blur(10px)',
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  rowLabel: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
  rowValue: {
    fontSize: moderateScale(16),
    marginRight: horizontalScale(8),
  },
  rowIcon: {
    marginRight: horizontalScale(16),
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowSpacer: {
    flex: 1,
  },
});
