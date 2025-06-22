// src/config/googleSignIn.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

// Get Google client IDs from environment variables or constants
export const GOOGLE_IOS_CLIENT_ID =
  Constants.expoConfig?.extra?.googleIosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export const GOOGLE_WEB_CLIENT_ID =
  Constants.expoConfig?.extra?.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

/**
 * Initialize Google Sign-In
 */
export const initializeGoogleSignIn = () => {
  if (!GOOGLE_IOS_CLIENT_ID || !GOOGLE_WEB_CLIENT_ID) {
    console.warn(
      'Google Sign-In client IDs not properly configured. Check your environment variables.'
    );
  }

  GoogleSignin.configure({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
};

// Initialize immediately when imported
initializeGoogleSignIn();
