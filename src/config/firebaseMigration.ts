// src/config/firebaseMigration.ts
import { initializeApp, getApps, getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

// Define the FirebaseConfig interface (unchanged)
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  [key: string]: string | undefined;
}

// Firebase configuration using environment variables (unchanged)
const firebaseConfig: FirebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:
    Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:
    Constants.expoConfig?.extra?.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:
    Constants.expoConfig?.extra?.firebaseStorageBucket ||
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    Constants.expoConfig?.extra?.firebaseMessagingSenderId ||
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate configuration (unchanged)
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

  if (missingFields.length > 0) {
    console.error(`Firebase config missing required fields: ${missingFields.join(', ')}`);
    // Only show alert in development
    if (__DEV__) {
      Alert.alert(
        'Firebase Configuration Error',
        `Missing required Firebase configuration. Please check your environment variables.`,
        [{ text: 'OK' }]
      );
    }
    return false;
  }
  return true;
};

// Validate the config when the module is imported
validateFirebaseConfig();

// Initialize Firebase app using modular API
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Get default app
}

// Initialize Firebase services using modular API (without app parameter)
export const auth = getAuth();
export const firestore = getFirestore();
export { app };