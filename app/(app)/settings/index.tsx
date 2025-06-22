// app/(app)/settings/index.tsx - COMPLETE ENHANCED VERSION
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
  
  // ✅ ENHANCED: Get all theme values including loading state
  const { 
    theme, 
    themePreference, 
    isDarkTheme, 
    setTheme, 
    isChangingTheme, // ✅ NEW: Loading state
    themeConstants 
  } = useTheme();
  
  const themeStyles = getThemeStyles(theme);
  
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [form, setForm] = useState({
    emailNotifications: true,
    pushNotifications: false,
  });

  // ✅ ENHANCED: Better error handling and user feedback
  const handleThemeChange = async () => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
    
    // Cycle through theme options: system -> light -> dark -> system
    const nextTheme = 
      themePreference === themeConstants.THEME_SYSTEM ? themeConstants.THEME_LIGHT :
      themePreference === themeConstants.THEME_LIGHT ? themeConstants.THEME_DARK :
      themeConstants.THEME_SYSTEM;
    
    // Call setTheme with proper error handling
    const success = await setTheme(nextTheme);
    
    if (!success) {
      Alert.alert(
        t('error', 'Error'),
        t('themeChangeError', 'Failed to change theme. Please try again.'),
        [{ text: t('ok', 'OK') }]
      );
    }
  };

  // Get current theme label for display
  const getThemeLabel = () => {
    if (isChangingTheme) return t('changing', 'Changing...'); // ✅ Loading text
    
    switch(themePreference) {
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
      setIsLanguageLoading(true);
      const newLanguage = i18n.language === 'en' ? 'es' : 'en';
      await i18n.changeLanguage(newLanguage);
      await AsyncStorage.setItem('userLanguage', newLanguage);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(
        t('error', 'Error'),
        t('languageChangeError', 'Failed to change language. Please try again.')
      );
    } finally {
      setIsLanguageLoading(false);
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
              setIsLoggingOut(true);
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(
                t('error', 'Error'),
                t('logoutError', 'Failed to logout. Please try again.')
              );
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/(app)/settings/edit');
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent, 
    disabled = false,
    loading = false 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    disabled?: boolean;
    loading?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { 
          backgroundColor: themeStyles.colors.darkGrey,
          opacity: disabled || loading ? 0.6 : 1,
        }
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <View style={styles.settingItemLeft}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={themeStyles.colors.greenThemeColor} 
          />
        ) : (
          <Feather 
            name={icon as any} 
            size={20} 
            color={themeStyles.colors.greenThemeColor} 
          />
        )}
        
        <View style={styles.settingItemContent}>
          <Text style={[styles.settingItemTitle, { color: themeStyles.colors.text.primary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingItemSubtitle, { color: themeStyles.colors.text.secondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      
      {rightComponent || (
        <Feather 
          name="chevron-right" 
          size={20} 
          color={themeStyles.colors.text.secondary} 
        />
      )}
    </TouchableOpacity>
  );

  const SwitchItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onValueChange,
    disabled = false 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View
      style={[
        styles.settingItem,
        { 
          backgroundColor: themeStyles.colors.darkGrey,
          opacity: disabled ? 0.6 : 1,
        }
      ]}
    >
      <View style={styles.settingItemLeft}>
        <Feather 
          name={icon as any} 
          size={20} 
          color={themeStyles.colors.greenThemeColor} 
        />
        
        <View style={styles.settingItemContent}>
          <Text style={[styles.settingItemTitle, { color: themeStyles.colors.text.primary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingItemSubtitle, { color: themeStyles.colors.text.secondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      
      <AnimatedSwitch
        entering={FadeIn.delay(300)}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: themeStyles.colors.border,
          true: themeStyles.colors.greenThemeColor,
        }}
        thumbColor={value ? '#FFFFFF' : themeStyles.colors.text.secondary}
        ios_backgroundColor={themeStyles.colors.border}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.colors.background }]}>
      <View style={[styles.header, { backgroundColor: themeStyles.colors.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={themeStyles.colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: themeStyles.colors.text.primary }]}>
          {t('settings', 'Settings')}
        </Text>
        
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <Animated.View 
          entering={FadeIn.delay(100)}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: themeStyles.colors.text.primary }]}>
            {t('profile', 'Profile')}
          </Text>
          
          <View style={[styles.profileCard, { backgroundColor: themeStyles.colors.darkGrey }]}>
            <View style={styles.profileInfo}>
              <View style={[styles.avatar, { backgroundColor: themeStyles.colors.greenThemeColor }]}>
                <Text style={styles.avatarText}>
                  {userData?.fname?.charAt(0)?.toUpperCase() || user?.fname?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              
              <View style={styles.profileDetails}>
                <Text style={[styles.profileName, { color: themeStyles.colors.text.primary }]}>
                  {userData?.fname || user?.fname || ''} {userData?.lname || user?.lname || ''}
                </Text>
                <Text style={[styles.profileEmail, { color: themeStyles.colors.text.secondary }]}>
                  {userData?.email || user?.email || ''}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Feather name="edit-2" size={18} color={themeStyles.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Appearance Section */}
        <Animated.View 
          entering={FadeIn.delay(200)}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: themeStyles.colors.text.primary }]}>
            {t('appearance', 'Appearance')}
          </Text>
          
          <SettingItem
            icon={isDarkTheme ? "moon" : "sun"}
            title={t('theme', 'Theme')}
            subtitle={getThemeLabel()}
            onPress={handleThemeChange}
            disabled={isChangingTheme}
            loading={isChangingTheme}
          />
          
          <SettingItem
            icon="globe"
            title={t('language', 'Language')}
            subtitle={i18n.language === 'en' ? 'English' : 'Español'}
            onPress={handleLanguageChange}
            disabled={isLanguageLoading}
            loading={isLanguageLoading}
          />
        </Animated.View>

        {/* Notifications Section */}
        <Animated.View 
          entering={FadeIn.delay(300)}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: themeStyles.colors.text.primary }]}>
            {t('notifications', 'Notifications')}
          </Text>
          
          <SwitchItem
            icon="mail"
            title={t('emailNotifications', 'Email Notifications')}
            subtitle={t('emailNotificationsDesc', 'Receive updates via email')}
            value={form.emailNotifications}
            onValueChange={(value) => setForm(prev => ({ ...prev, emailNotifications: value }))}
          />
          
          <SwitchItem
            icon="bell"
            title={t('pushNotifications', 'Push Notifications')}
            subtitle={t('pushNotificationsDesc', 'Receive push notifications')}
            value={form.pushNotifications}
            onValueChange={(value) => setForm(prev => ({ ...prev, pushNotifications: value }))}
          />
        </Animated.View>

        {/* Support Section */}
        <Animated.View 
          entering={FadeIn.delay(400)}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: themeStyles.colors.text.primary }]}>
            {t('support', 'Support')}
          </Text>
          
          <SettingItem
            icon="help-circle"
            title={t('help', 'Help & Support')}
            onPress={() => {/* Navigate to help */}}
          />
          
          <SettingItem
            icon="info"
            title={t('about', 'About')}
            onPress={() => {/* Navigate to about */}}
          />
          
          <SettingItem
            icon="star"
            title={t('rateApp', 'Rate App')}
            onPress={() => {/* Open app store */}}
          />
        </Animated.View>

        {/* Account Section */}
        <Animated.View 
          entering={FadeIn.delay(500)}
          style={[styles.section, styles.lastSection]}
        >
          <Text style={[styles.sectionTitle, { color: themeStyles.colors.text.primary }]}>
            {t('account', 'Account')}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.settingItem,
              styles.logoutButton,
              { 
                backgroundColor: themeStyles.colors.darkGrey,
                opacity: isLoggingOut ? 0.6 : 1,
              }
            ]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <View style={styles.settingItemLeft}>
              {isLoggingOut ? (
                <ActivityIndicator 
                  size="small" 
                  color={themeStyles.colors.status.error} 
                />
              ) : (
                <Feather 
                  name="log-out" 
                  size={20} 
                  color={themeStyles.colors.status.error} 
                />
              )}
              
              <Text style={[
                styles.settingItemTitle, 
                { color: themeStyles.colors.status.error }
              ]}>
                {isLoggingOut ? t('loggingOut', 'Logging out...') : t('logout', 'Logout')}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    paddingTop: Platform.OS === 'ios' ? verticalScale(8) : verticalScale(16),
  },
  backButton: {
    padding: moderateScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '600',
  },
  headerRight: {
    width: moderateScale(40),
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: verticalScale(24),
    paddingHorizontal: horizontalScale(20),
  },
  lastSection: {
    marginBottom: verticalScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: verticalScale(12),
    paddingHorizontal: horizontalScale(4),
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: '600',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: verticalScale(2),
  },
  profileEmail: {
    fontSize: moderateScale(14),
  },
  editButton: {
    padding: moderateScale(8),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(8),
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemContent: {
    marginLeft: horizontalScale(12),
    flex: 1,
  },
  settingItemTitle: {
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  settingItemSubtitle: {
    fontSize: moderateScale(14),
    marginTop: verticalScale(2),
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  footer: {
    height: verticalScale(40),
  },
});