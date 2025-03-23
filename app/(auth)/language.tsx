// app/(auth)/language.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { useRouter } from "expo-router";
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from "@/src/theme";
import FormButton from '@/src/components/forms/FormButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export default function LanguageScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');

  // Get background color based on theme
  const getBackgroundColor = () => isDarkTheme 
    ? themeStyles.colors.black_grey 
    : themeStyles.colors.background;

  // Get text color based on theme
  const getTextColor = () => isDarkTheme 
    ? themeStyles.colors.white 
    : themeStyles.colors.text.primary;

  // Get secondary text color based on theme
  const getSecondaryTextColor = () => isDarkTheme 
    ? themeStyles.colors.grey 
    : themeStyles.colors.text.secondary;

  // Initialize with current language on mount
  useEffect(() => {
    const getCurrentLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('userLanguage');
        if (savedLanguage) {
          setCurrentLang(savedLanguage);
        }
      } catch (error) {
        console.error('Error getting saved language:', error);
      }
    };
    
    getCurrentLanguage();
  }, []);

  const handleLanguageChange = async (language: string) => {
    try {
      await Haptics.selectionAsync();
      setCurrentLang(language);
      
      // Save selected language
      await AsyncStorage.setItem('userLanguage', language);
      
      // Mark language selection as completed
      await AsyncStorage.setItem('languageSelected', 'true');
      
      // Change language
      await i18n.changeLanguage(language);
      
      // Navigate to onboarding
      router.push("/(auth)/onboarding");
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert('Error', 'Failed to change language. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[
      styles.safeArea,
      { backgroundColor: getBackgroundColor() }
    ]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
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
          <Text style={[
            styles.title,
            { color: getTextColor() }
          ]}>Trucking Logistics Pro</Text>
          <Text style={[
            styles.subtitle,
            { color: getSecondaryTextColor() }
          ]}>
            {t('selectLanguage')}
          </Text>
        </View>
        
        <View style={styles.formContainer}>
          <FormButton
            buttonTitle={t('english')}
            onPress={() => handleLanguageChange('en')}
            backgroundColor={currentLang === 'en' ? themeStyles.colors.greenThemeColor : isDarkTheme ? '#4A4A4A' : '#E0E0E0'}
            textColor={currentLang === 'en' || isDarkTheme ? "white" : '#333333'}
          />
          <FormButton
            buttonTitle={t('spanish')}
            onPress={() => handleLanguageChange('es')}
            backgroundColor={currentLang === 'es' ? themeStyles.colors.greenThemeColor : isDarkTheme ? '#4A4A4A' : '#E0E0E0'}
            textColor={currentLang === 'es' || isDarkTheme ? "white" : '#333333'}
          />
        </View>
        
        <View style={styles.footerContainer}>
          <Text style={[
            styles.footerText,
            { color: getSecondaryTextColor() }
          ]}>
            {t('chooseLater')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: horizontalScale(24),
    paddingTop: verticalScale(32),
    paddingBottom: verticalScale(24),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(32),
  },
  logo: {
    height: moderateScale(120),
    width: moderateScale(120),
    resizeMode: 'cover',
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    lineHeight: moderateScale(34),
    marginTop: verticalScale(16),
  },
  subtitle: {
    fontSize: moderateScale(16),
    marginTop: verticalScale(4),
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginTop: verticalScale(16),
    gap: verticalScale(8),
  },
  footerContainer: {
    marginTop: verticalScale(24),
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: verticalScale(24),
  },
  footerText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  }
});