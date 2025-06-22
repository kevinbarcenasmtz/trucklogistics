import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import enTranslation from './locales/en.json';
import esTranslation from './locales/es.json';

// Set up resources
const resources = {
  en: {
    translation: enTranslation,
  },
  es: {
    translation: esTranslation,
  },
};

// Get device language
const deviceLanguage = getLocales()[0]?.languageCode || 'en';

// Initialize i18next
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: deviceLanguage, // language to use if no language is detected
    fallbackLng: 'en', // fallback language
    compatibilityJSON: 'v3', // required for React Native
    interpolation: {
      escapeValue: false, // not needed for React
    },
    react: {
      useSuspense: false, // not using suspense
    },
  });

// Function to load saved language
export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('userLanguage');
    if (savedLanguage) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('Failed to load saved language:', error);
  }
};

// Load saved language
loadSavedLanguage();

export default i18n;
