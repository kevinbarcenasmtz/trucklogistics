import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from "expo-router";
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from "@/src/theme";
import FormButton from '@/src/components/forms/FormButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LanguageScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');

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
      setCurrentLang(language);
      
      // Save selected language
      await AsyncStorage.setItem('userLanguage', language);
      
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
      { backgroundColor: themeStyles.colors.background }
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
              { borderRadius: themeStyles.borderRadius.circle(120) }
            ]}
          />
          <Text style={[
            styles.title,
            { color: themeStyles.colors.text.primary }
          ]}>Trucking Logistics Pro</Text>
          <Text style={[
            styles.subtitle,
            { color: themeStyles.colors.text.secondary }
          ]}>
            {t('selectLanguage')}
          </Text>
        </View>
        
        <View style={styles.formContainer}>
          <FormButton
            buttonTitle={t('english')}
            onPress={() => handleLanguageChange('en')}
            backgroundColor={currentLang === 'en' ? themeStyles.colors.greenThemeColor : '#4A4A4A'}
            textColor="white" // Always white text
            
          />
          <FormButton
            buttonTitle={t('spanish')}
            onPress={() => handleLanguageChange('es')}
            backgroundColor={currentLang === 'es' ? themeStyles.colors.greenThemeColor : '#4A4A4A'}
            textColor="white" // Always white text
          />
        </View>
        
        <View style={styles.footerContainer}>
          <Text style={[
            styles.footerText,
            { color: themeStyles.colors.text.secondary }
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
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    height: 120,
    width: 120,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginTop: 16,
    gap: 8,
  },
  footerContainer: {
    marginTop: 24,
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  }
});