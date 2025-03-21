// app.config.js
const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';
const IS_PROD = process.env.APP_VARIANT === 'production' || !process.env.APP_VARIANT;

// Get the app name based on environment
const getAppName = () => {
  if (IS_DEV) return 'TruckLogistics Dev';
  if (IS_PREVIEW) return 'TruckLogistics Beta';
  return 'TruckLogistics';
};

// Get the bundle identifier based on environment
const getBundleIdentifier = () => {
  if (IS_DEV) return 'com.kevin14767.trucklogistics.dev';
  if (IS_PREVIEW) return 'com.kevin14767.trucklogistics.beta';
  return 'com.kevin14767.trucklogistics';
};

// Get the version suffix based on environment
const getVersionSuffix = () => {
  if (IS_DEV) return '-dev';
  if (IS_PREVIEW) return '-beta';
  return '';
};

// Import base config from app.json
const { expo: baseConfig } = require('./app.json');

// Create the dynamic configuration
module.exports = ({ config }) => {
  return {
    ...baseConfig,
    name: getAppName(),
    version: baseConfig.version + getVersionSuffix(),
    ios: {
      ...baseConfig.ios,
      bundleIdentifier: getBundleIdentifier(),
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST || './GoogleService-InfoDev.plist',
      
    },
    modules: {
      ios: {
        podfileProperties: {
          'use_modular_headers': true
        }
      }
    },
    android: {
      ...baseConfig.android || {},
      package: getBundleIdentifier(),
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json'
    },
    extra: {
      ...baseConfig.extra,
      // API URLs
      ocrApiUrl: process.env.EXPO_PUBLIC_OCR_API_URL,
      
      // API Keys (for runtime access)
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      
      ocrApiKey: process.env.EXPO_PUBLIC_OCR_API_KEY,
      anthropicApiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
      
      // Other configuration
      environment: process.env.APP_VARIANT || 'production'
    },
    updates: {
      enabled: !IS_DEV,
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/8178d963-9b4a-44b4-ae89-042607e45d02"
    },
    runtimeVersion: "1.0.0" + getVersionSuffix()
  };
};