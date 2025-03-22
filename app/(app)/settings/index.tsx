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
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [form, setForm] = useState({
    darkMode: false,
    emailNotifications: true,
    pushNotifications: false,
  });

  const handleLanguageChange = async () => {
    try {
      await Haptics.selectionAsync();
      setIsLanguageLoading(true);
      const newLanguage = i18n.language === 'en' ? 'es' : 'en';
      await i18n.changeLanguage(newLanguage);
      
      // Save language preference
      try {
        await AsyncStorage.setItem('userLanguage', newLanguage);
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
      alert("Failed to log out. Please try again.");
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
            ...themeStyles.shadow.md
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
          ...themeStyles.shadow.md
        }
      ]}>
        <Text style={[
          styles.avatarText,
          { color: themeStyles.colors.white }
        ]}>JD</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: themeStyles.colors.black_grey 
    }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[
            styles.headerTitle,
            { color: themeStyles.colors.white }
          ]}>{t('settings')}</Text>
          <Text style={[
            styles.headerSubtitle,
            { color: themeStyles.colors.grey }
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
                backgroundColor: themeStyles.colors.darkGrey,
                ...themeStyles.shadow.sm
              }
            ]}
          >
            {renderAvatar()}
            <Text style={[
              styles.profileName,
              { color: themeStyles.colors.white }
            ]}>{getFullName()}</Text>
            <Text style={[
              styles.profileEmail,
              { color: themeStyles.colors.grey }
            ]}>{userData?.email || t('defaultEmail')}</Text>

            <TouchableOpacity
              onPress={() => router.push("/(app)/settings/edit")}>
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

            <TouchableOpacity onPress={handleLogout} disabled={isLoggingOut}>
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
          </Animated.View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: themeStyles.colors.grey }
            ]}>{t('preferences')}</Text>

            <View style={[
              styles.sectionBody,
              { 
                backgroundColor: themeStyles.colors.darkGrey,
              }
            ]}>
              <View style={[
                styles.rowWrapper, 
                styles.rowFirst,
                { borderColor: themeStyles.colors.transParent }
              ]}>
                <TouchableOpacity 
                  onPress={handleLanguageChange}
                  style={styles.row}
                >
                  <View style={[
                    styles.rowIcon, 
                    { backgroundColor: '#fe9400' }
                  ]}>
                    <Feather 
                      color={themeStyles.colors.darkGrey} 
                      name="globe" 
                      size={20} 
                    />
                  </View>
                  <Text style={[
                    styles.rowLabel,
                    { color: themeStyles.colors.white }
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
                        { color: themeStyles.colors.grey }
                      ]}>
                        {i18n.language === 'en' ? t('english') : t('spanish')}
                      </Text>
                      <Feather 
                        color={themeStyles.colors.grey} 
                        name="chevron-right" 
                        size={20} 
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={[
                styles.rowWrapper,
                { borderColor: themeStyles.colors.transParent }
              ]}>
                <View style={styles.row}>
                  <View style={[
                    styles.rowIcon, 
                    { backgroundColor: '#007AFF' }
                  ]}>
                    <Feather 
                      color={themeStyles.colors.darkGrey} 
                      name="moon" 
                      size={20} 
                    />
                  </View>
                  <Text style={[
                    styles.rowLabel,
                    { color: themeStyles.colors.white }
                  ]}>{t('darkMode')}</Text>
                  <View style={styles.rowSpacer} />
                  <AnimatedSwitch
                    entering={FadeIn}
                    onValueChange={darkMode => {
                      Haptics.selectionAsync();
                      setForm({ ...form, darkMode });
                    }}
                    value={form.darkMode}
                    trackColor={{ 
                      false: '#767577', 
                      true: themeStyles.colors.greenThemeColor 
                    }}
                    thumbColor="#f4f3f4"
                  />
                </View>
              </View>

              <View style={[
                styles.rowWrapper,
                { borderColor: themeStyles.colors.transParent }
              ]}>
                <View style={styles.row}>
                  <View style={[
                    styles.rowIcon, 
                    { backgroundColor: '#32c759' }
                  ]}>
                    <Feather 
                      color={themeStyles.colors.darkGrey}
                      name="navigation" 
                      size={20} 
                    />
                  </View>
                  <Text style={[
                    styles.rowLabel,
                    { color: themeStyles.colors.white }
                  ]}>{t('location')}</Text>
                  <View style={styles.rowSpacer} />
                  <Text style={[
                    styles.rowValue,
                    { color: themeStyles.colors.grey }
                  ]}>{getLocation()}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: themeStyles.colors.grey }
            ]}>{t('notifications')}</Text>

            <View style={[
              styles.sectionBody,
              { backgroundColor: themeStyles.colors.darkGrey }
            ]}>
              <View style={[
                styles.rowWrapper, 
                styles.rowFirst,
                { borderColor: themeStyles.colors.transParent }
              ]}>
                <View style={styles.row}>
                  <View style={[
                    styles.rowIcon, 
                    { backgroundColor: '#38C959' }
                  ]}>
                    <Feather 
                      color={themeStyles.colors.darkGrey} 
                      name="at-sign" 
                      size={20} 
                    />
                  </View>
                  <Text style={[
                    styles.rowLabel,
                    { color: themeStyles.colors.white }
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
                      false: '#767577', 
                      true: themeStyles.colors.greenThemeColor 
                    }}
                    thumbColor="#f4f3f4"
                  />
                </View>
              </View>

              <View style={[
                styles.rowWrapper,
                { borderColor: themeStyles.colors.transParent }
              ]}>
                <View style={styles.row}>
                  <View style={[
                    styles.rowIcon, 
                    { backgroundColor: '#38C959' }
                  ]}>
                    <Feather 
                      color={themeStyles.colors.darkGrey} 
                      name="bell" 
                      size={20} 
                    />
                  </View>
                  <Text style={[
                    styles.rowLabel,
                    { color: themeStyles.colors.white }
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
                      false: '#767577', 
                      true: themeStyles.colors.greenThemeColor 
                    }}
                    thumbColor="#f4f3f4"
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
    fontSize: moderateScale(34),
    fontWeight: '800',
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
  profileAction: {
    marginTop: verticalScale(16),
    paddingVertical: verticalScale(8),
    paddingHorizontal: horizontalScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(8),
    minWidth: horizontalScale(120),
    gap: horizontalScale(8),
  },
  profileActionText: {
    fontSize: moderateScale(16),
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
    transform: [{ scale: 1.1 }],
  },
  rowSpacer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: moderateScale(12),
    marginTop: verticalScale(4),
  }
});