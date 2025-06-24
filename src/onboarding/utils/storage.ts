// src/onboarding/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureStorage } from '../../security/SecureStorage';
import { Language, OnboardingProgress } from '../types';

const STORAGE_KEYS = {
  ONBOARDING_PROGRESS: 'onboarding_progress',
  USER_LANGUAGE: 'userLanguage',
  LANGUAGE_SELECTED: 'languageSelected',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
  AUTH_STATE: 'auth_state',
  ONBOARDING_KEY: 'hasSeenOnboarding',
} as const;

export const saveOnboardingProgress = async (progress: OnboardingProgress): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save onboarding progress:', error);
  }
};

export const getOnboardingProgress = async (): Promise<OnboardingProgress | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get onboarding progress:', error);
    return null;
  }
};

export const saveLanguagePreference = async (language: Language): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER_LANGUAGE, language),
      AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE_SELECTED, 'true'),
    ]);
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }
};

export const getLanguagePreference = async (): Promise<Language | null> => {
  try {
    const language = await AsyncStorage.getItem(STORAGE_KEYS.USER_LANGUAGE);
    return language as Language | null;
  } catch (error) {
    console.error('Failed to get language preference:', error);
    return null;
  }
};

export const markOnboardingComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Failed to mark onboarding complete:', error);
  }
};

export const hasSeenOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Failed to check onboarding state:', error);
    return false;
  }
};

// Updated to use SecureStorage for auth tokens
export const isAuthenticatedFromStorage = async (): Promise<boolean> => {
  try {
    return await SecureStorage.hasAuthToken();
  } catch (error) {
    console.error('Failed to check auth state:', error);
    return false;
  }
};

export const clearOnboardingData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ONBOARDING_PROGRESS,
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      STORAGE_KEYS.ONBOARDING_KEY,
    ]);
  } catch (error) {
    console.error('Failed to clear onboarding data:', error);
  }
};
