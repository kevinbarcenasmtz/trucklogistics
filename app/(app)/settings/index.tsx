// app/(app)/settings/index.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from '@/src/theme';
import { useRouter } from "expo-router";
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/src/context/AuthContext';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnimatedSwitch = Animated.createAnimatedComponent(Switch);

export default function Settings() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user, logout, userData } = useAuth();
  // Get all theme-related values from context
  const { theme, themePreference, isDarkTheme, setTheme, themeConstants } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [form, setForm] = useState({
    emailNotifications: true,
    pushNotifications: false,
  });

  // Handle theme change
  const handleThemeChange = async () => {
    try {
      await Haptics.selectionAsync();
      
      // Cycle through theme options: system -> light -> dark -> system
      const nextTheme = 
        themePreference === themeConstants.THEME_SYSTEM ? themeConstants.THEME_LIGHT :
        themePreference === themeConstants.THEME_LIGHT ? themeConstants.THEME_DARK :
        themeConstants.THEME_SYSTEM;
      
      // Call setTheme from the context
      await setTheme(nextTheme);
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  };

  // Get current theme label for display
  const getThemeLabel = () => {
    switch(themePreference) {
      case themeConstants.THEME_SYSTEM:
        return 'System';
      case themeConstants.THEME_LIGHT:
        return 'Light';
      case themeConstants.THEME_DARK:
        return 'Dark';
      default:
        return 'System';
    }
  };

  const handleLanguageChange = async () => {
    try {
      await Haptics.selectionAsync();
      setIsLanguageLoading(true);
      const newLanguage = i18n.language === 'en' ? 'es' : 'en';
      await i18n.changeLanguage(newLanguage);
      
      // Save language preference
      try {
        await AsyncStorage.setItem('userLanguage', newLanguage);
        await AsyncStorage.setItem('languageSelected', 'true');
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    } catch (error) {
      console.log('Error changing language:', error);
    } finally {
      setIsLanguageLoading(false);
    }
  };

  const handleLogout = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getLocation = () => {
    if (!userData) return t('unknownLocation');
    const { city = '', state = '' } = userData;
    return `${city}, ${state}`.trim().replace(/^, |, $/g, '');
  };

  const getFullName = () => {
    if (!userData) return t('defaultName');
    const { fname = '', lname = '' } = userData;
    return `${fname} ${lname}`.trim();
  };

  const renderAvatar = () => {
    if (userData?.fname && userData?.lname) {
      const initials = `${userData.fname[0]}${userData.lname[0]}`.toUpperCase();
      return (
        <View style={[
          styles.avatar,
          { 
            backgroundColor: themeStyles.colors.greenThemeColor,
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
          }
        ]}>
          <Text style={[
            styles.avatarText,
            { color: themeStyles.colors.white }
          ]}>{initials}</Text>
        </View>
      );
    }
    return (
      <View style={[
        styles.avatar,
        { 
          backgroundColor: themeStyles.colors.greenThemeColor,
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
        }
      ]}>
        <Text style={[
          styles.avatarText,
          { color: themeStyles.colors.white }
        ]}>JD</Text>
      </View>
    );
  };

  // Get background color based on theme
  const getBackgroundColor = () => isDarkTheme 
    ? themeStyles.colors.black_grey 
    : themeStyles.colors.background;

  // Get card background color based on theme
  const getCardBackgroundColor = () => isDarkTheme 
    ? themeStyles.colors.darkGrey 
    : themeStyles.colors.surface;

  // Get primary text color based on theme
  const getTextColor = () => isDarkTheme 
    ? themeStyles.colors.white 
    : themeStyles.colors.text.primary;

  // Get secondary text color based on theme
  const getSecondaryTextColor = () => isDarkTheme 
    ? themeStyles.colors.grey 
    : themeStyles.colors.text.secondary;

  // Get border color based on theme
  const getBorderColor = () => isDarkTheme 
    ? themeStyles.colors.transParent 
    : themeStyles.colors.border;

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: getBackgroundColor()
    }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[
            styles.headerTitle,
            { color: getTextColor() }
          ]}>{t('settings')}</Text>
          <Text style={[
            styles.headerSubtitle,
            { color: getSecondaryTextColor() }
          ]}>{t('manageAccount')}</Text>
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
                backgroundColor: getCardBackgroundColor(),
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
              }
            ]}
          >
            {renderAvatar()}
            <Text style={[
              styles.profileName,
              { color: getTextColor() }
            ]}>{getFullName()}</Text>
            <Text style={[
              styles.profileEmail,
              { color: getSecondaryTextColor() }
            ]}>{userData?.email || t('defaultEmail')}</Text>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.actionButtonWrapper}
                onPress={() => router.push("/(app)/settings/edit")}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.profileAction,
                  { backgroundColor: themeStyles.colors.greenThemeColor }
                ]}>
                  <Text style={[
                    styles.profileActionText,
                    { color: themeStyles.colors.white }
                  ]}>{t('editProfile')}</Text>
                  <Feather color={themeStyles.colors.white} name="edit" size={16} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButtonWrapper}
                onPress={handleLogout} 
                disabled={isLoggingOut}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.profileAction,
                  { backgroundColor: themeStyles.colors.greenThemeColor }
                ]}>
                  <Text style={[
                    styles.profileActionText,
                    { color: themeStyles.colors.white }
                  ]}>
                    {isLoggingOut ? t('loggingOut', 'Logging out...') : t('logOut')}
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
            <Text style={[
              styles.sectionTitle,
              { color: getSecondaryTextColor() }
            ]}>{t('preferences')}</Text>

            <View style={[
              styles.sectionBody,
              { 
                backgroundColor: getCardBackgroundColor(),
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
              }
            ]}>
              <View style={[
                styles.rowWrapper, 
                styles.rowFirst,
                { borderColor: getBorderColor() }
              ]}>
                <TouchableOpacity 
                  onPress={handleLanguageChange}
                  style={styles.row}
                  activeOpacity={0.6}
                >
                  <View style={[
                    styles.rowIcon, 
                    { backgroundColor: '#fe9400' }
                  ]}>
                    <Feather 
                      color={isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.white} 
                      name="globe" 
                      size={20} 
                    />
                  </View>
                  <Text style={[
                    styles.rowLabel,
                    { color: getTextColor() }
                  ]}>{t('languagePreference')}</Text>
                  <View style={styles.rowSpacer} />
                  {isLanguageLoading ? (
                    <ActivityIndicator 
                      size="small" 
                      color={themeStyles.colors.greenThemeColor} 
                    />
                  ) : (
                    <>
                      <Text style={[
                        styles.rowValue,
                        { color: getSecondaryTextColor() }
                      ]}>
                        {i18n.language === 'en' ? t('english') : t('spanish')}
                      </Text>
                      <Feather 
                        color={getSecondaryTextColor()} 
                        name="chevron-right" 
                        size={20} 
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={[
                styles.rowWrapper,
                { borderColor: getBorderColor() }
              ]}>
                <TouchableOpacity 
                  onPress={handleThemeChange}
                  style={styles.row}
                  activeOpacity={0.6}
                >
                  <View style={[
                    styles.rowIcon, 
                    { backgroundColor: '#007AFF' }
                  ]}>
                    <Feather 
                      color={isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.white} 
                      name={isDarkTheme ? "moon" : "sun"} 
                      size={20} 
                    />
                  </View>
                  <Text style={[
                    styles.rowLabel,
                    { color: getTextColor() }
                  ]}>{t('darkMode')}</Text>
                  <View style={styles.rowSpacer} />
                  <Text style={[
                    styles.rowValue,
                    { color: getSecondaryTextColor() }
                  ]}>
                    {getThemeLabel()}
                  </Text>
                  <Feather 
                    color={getSecondaryTextColor()} 
                    name="chevron-right" 
                    size={20} 
                  />
                </TouchableOpacity>
              </View>

              <View style={[
                styles.rowWrapper,
                { borderColor: getBorderColor() }
              ]}>
                <View style={styles.row}>
                  <View style={[
                    styles.rowIcon, 
                    { backgroundColor: '#32c759' }
                  ]}>
                    <Feather 
                      color={isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.white}
                      name="navigation" 
                      size={20} 
                    />
                  </View>
                  <Text style={[
                    styles.rowLabel,
                    { color: getTextColor() }
                  ]}>{t('location')}</Text>
                  <View style={styles.rowSpacer} />
                  <Text style={[
                    styles.rowValue,
                    { color: getSecondaryTextColor() }
                  ]}>{getLocation()}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: getSecondaryTextColor() }
            ]}>{t('notifications')}</Text>

            <View style={[
              styles.sectionBody,
              { 
                backgroundColor: getCardBackgroundColor(),
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
              }
            ]}>
              <View style={[
                styles.rowWrapper, 
                styles.rowFirst,
                { borderColor: getBorderColor() }
              ]}>
                <View style={styles.row}>
                  <View style={[
                    styles.rowIcon, 
                    { backgroundColor: '#38C959' }
                  ]}>
                    <Feather 
                      color={isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.white} 
                      name="at-sign" 
                      size={20} 
                    />
                  </View>
                  <Text style={[
                    styles.rowLabel,
                    { color: getTextColor() }
                  ]}>{t('emailNotifications')}</Text>
                  <View style={styles.rowSpacer} />
                  <AnimatedSwitch
                    entering={FadeIn}
                    onValueChange={emailNotifications => {
                      Haptics.selectionAsync();
                      setForm({ ...form, emailNotifications });
                    }}
                    value={form.emailNotifications}
                    trackColor={{ 
                      false: isDarkTheme ? '#555555' : '#D0D0D0', 
                      true: themeStyles.colors.greenThemeColor 
                    }}
                    thumbColor={isDarkTheme ? '#f4f3f4' : '#FFFFFF'}
                    ios_backgroundColor={isDarkTheme ? '#555555' : '#D0D0D0'}
                  />
                </View>
              </View>

              <View style={[
                styles.rowWrapper,
                { borderColor: getBorderColor() }
              ]}>
                <View style={styles.row}>
                  <View style={[
                    styles.rowIcon, 
                    { backgroundColor: '#38C959' }
                  ]}>
                    <Feather 
                      color={isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.white} 
                      name="bell" 
                      size={20} 
                    />
                  </View>
                  <Text style={[
                    styles.rowLabel,
                    { color: getTextColor() }
                  ]}>{t('pushNotifications')}</Text>
                  <View style={styles.rowSpacer} />
                  <AnimatedSwitch
                    entering={FadeIn}
                    onValueChange={pushNotifications => {
                      Haptics.selectionAsync();
                      setForm({ ...form, pushNotifications });
                    }}
                    value={form.pushNotifications}
                    trackColor={{ 
                      false: isDarkTheme ? '#555555' : '#D0D0D0', 
                      true: themeStyles.colors.greenThemeColor 
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