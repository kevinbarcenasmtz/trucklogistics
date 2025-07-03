// app/(app)/settings/index.tsx
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { useAuth } from '@/src/context/AuthContextMigration';
import { useTheme } from '@/src/context/ThemeContext';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useSettingsStateMachine } from '@/src/machines/settingsStateMachine';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { LanguageSelector } from '@/src/components/settings/LanguageSelector';
import { NotificationSettings } from '@/src/components/settings/NotificationSettings';
import { ThemeToggle } from '@/src/components/settings/ThemeToggle';

export default function Settings() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user, logout, userData } = useAuth();

  // Theme management
  const { themePreference, setTheme, isChangingTheme, themeConstants } = useTheme();

  // Single hook for all theme values
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

  const { state, dispatch } = useSettingsStateMachine({
    email: true,
    push: false,
  });

  // Pure calculations from state machine
  const isSaving = state.type === 'saving';
  const isLoading = isSaving;
  const isLanguageLoading = isSaving && state.operation === 'language';
  const isLoggingOut = isSaving && state.operation === 'logout';
  const isThemeChanging = (isSaving && state.operation === 'theme') || isChangingTheme;

  // Simplified handlers - business logic only
  const handleThemeChange = async () => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }

    dispatch({ type: 'START_THEME_CHANGE' });

    try {
      const nextTheme =
        themePreference === themeConstants.THEME_SYSTEM
          ? themeConstants.THEME_LIGHT
          : themePreference === themeConstants.THEME_LIGHT
            ? themeConstants.THEME_DARK
            : themeConstants.THEME_SYSTEM;

      const success = await setTheme(nextTheme);

      if (!success) {
        dispatch({
          type: 'OPERATION_ERROR',
          error: t('themeChangeError', 'Failed to change theme. Please try again.'),
          context: 'theme',
        });
        Alert.alert(
          t('error', 'Error'),
          t('themeChangeError', 'Failed to change theme. Please try again.')
        );
        return;
      }

      dispatch({
        type: 'OPERATION_SUCCESS',
        message: t('themeChanged', 'Theme changed successfully'),
        operation: 'theme',
      });
    } catch (error) {
      console.error('Error changing theme:', error);
      dispatch({
        type: 'OPERATION_ERROR',
        error: t('themeChangeError', 'Failed to change theme. Please try again.'),
        context: 'theme',
      });
      Alert.alert(
        t('error', 'Error'),
        t('themeChangeError', 'Failed to change theme. Please try again.')
      );
    }
  };

  const handleLanguageChange = async () => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }

    dispatch({ type: 'START_LANGUAGE_CHANGE' });

    try {
      const newLanguage = i18n.language === 'en' ? 'es' : 'en';
      await i18n.changeLanguage(newLanguage);

      await AsyncStorage.setItem('userLanguage', newLanguage);
      await AsyncStorage.setItem('languageSelected', 'true');

      dispatch({
        type: 'OPERATION_SUCCESS',
        message: t('languageChanged', 'Language changed successfully'),
        operation: 'language',
      });
    } catch (error) {
      console.error('Error changing language:', error);
      dispatch({
        type: 'OPERATION_ERROR',
        error: t('languageChangeError', 'Failed to change language. Please try again.'),
        context: 'language',
      });
      Alert.alert(
        t('error', 'Error'),
        t('languageChangeError', 'Failed to change language. Please try again.')
      );
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('logout', 'Logout'),
      t('logoutConfirmation', 'Are you sure you want to logout?'),
      [
        { text: t('cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('logout', 'Logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (error) {
              console.warn('Haptic feedback not supported:', error);
            }

            dispatch({ type: 'START_LOGOUT' });

            try {
              await logout();
              dispatch({
                type: 'OPERATION_SUCCESS',
                message: t('loggedOut', 'Logged out successfully'),
                operation: 'logout',
              });
            } catch (error) {
              console.error('Logout error:', error);
              dispatch({
                type: 'OPERATION_ERROR',
                error: t('logoutError', 'Failed to logout. Please try again.'),
                context: 'logout',
              });
              Alert.alert(
                t('error', 'Error'),
                t('logoutError', 'Failed to logout. Please try again.')
              );
            }
          },
        },
      ]
    );
  };

  const handleEmailNotificationChange = (value: boolean) => {
    try {
      Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
    dispatch({
      type: 'UPDATE_NOTIFICATIONS',
      notifications: { ...state.data.notifications, email: value },
    });
  };

  const handlePushNotificationChange = (value: boolean) => {
    try {
      Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
    dispatch({
      type: 'UPDATE_NOTIFICATIONS',
      notifications: { ...state.data.notifications, push: value },
    });
  };

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
          {/* Profile Section - Keep as is since it's already clean */}
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

          <ErrorBoundary
            fallback={
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
                  {t('preferences', 'Preferences')}
                </Text>
                <View style={[styles.sectionBody, { backgroundColor: surfaceColor, padding: 20 }]}>
                  <Text style={{ color: textColor, textAlign: 'center' }}>
                    {t('preferencesError', 'Unable to load preferences. Please try refreshing.')}
                  </Text>
                </View>
              </View>
            }
          >
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
                <LanguageSelector
                  isLoading={isLanguageLoading}
                  onLanguageChange={handleLanguageChange}
                  disabled={isLoading}
                />

                <ThemeToggle
                  isLoading={isThemeChanging}
                  onThemeChange={handleThemeChange}
                  themePreference={themePreference}
                  disabled={isLoading}
                />

                <View style={[styles.rowWrapper, { borderColor }]}>
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
          </ErrorBoundary>

          {/* Notifications Section - NOW WITH ERROR BOUNDARY */}
          <ErrorBoundary
            fallback={
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>
                  {t('notifications', 'Notifications')}
                </Text>
                <View style={[styles.sectionBody, { backgroundColor: surfaceColor, padding: 20 }]}>
                  <Text style={{ color: textColor, textAlign: 'center' }}>
                    {t(
                      'notificationsError',
                      'Unable to load notifications. Please try refreshing.'
                    )}
                  </Text>
                </View>
              </View>
            }
          >
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
                <NotificationSettings
                  emailNotifications={state.data.notifications.email}
                  pushNotifications={state.data.notifications.push}
                  onEmailChange={handleEmailNotificationChange}
                  onPushChange={handlePushNotificationChange}
                  disabled={isLoading}
                />
              </View>
            </View>
          </ErrorBoundary>
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
