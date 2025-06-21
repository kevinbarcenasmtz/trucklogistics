// app.config.js
const fs = require('fs');
const path = require('path');

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';
const IS_PROD = process.env.APP_VARIANT === 'production' || !process.env.APP_VARIANT;

// Helper function to check if file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(path.resolve(filePath));
  } catch {
    return false;
  }
};

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
  if (IS_DEV) return '.1';
  if (IS_PREVIEW) return '.2';
  return '';
};

// Get Google Services file for iOS
const getIOSGoogleServicesFile = () => {
  if (process.env.GOOGLE_SERVICE_INFO_PLIST) {
    return process.env.GOOGLE_SERVICE_INFO_PLIST;
  }
  
  const devFile = './GoogleService-InfoDev.plist';
  const prodFile = './GoogleService-Info.plist';
  
  if (fileExists(devFile)) return devFile;
  if (fileExists(prodFile)) return prodFile;
  
  return undefined; // Don't specify if files don't exist
};

// Get Google Services file for Android
const getAndroidGoogleServicesFile = () => {
  if (process.env.GOOGLE_SERVICES_JSON) {
    return process.env.GOOGLE_SERVICES_JSON;
  }
  
  if (fileExists('./google-services.json')) {
    return './google-services.json';
  }
  
  return undefined; // Don't specify if file doesn't exist
};

module.exports = () => {
  const iosGoogleServices = getIOSGoogleServicesFile();
  const androidGoogleServices = getAndroidGoogleServicesFile();
  
  const config = {
    name: getAppName(),
    slug: "trucklogistics",
    version: "1.0.0" + getVersionSuffix(),
    orientation: "portrait",
    icon: "./assets/images/icon.png", // Fixed: removed leading slash
    scheme: "trucklogistics-dev",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: getBundleIdentifier(),
      infoPlist: {
        "ITSAppUsesNonExemptEncryption": false,
        "NSPhotoLibraryUsageDescription": "This app needs access to your photos to upload receipts and documents",
        "NSCameraUsageDescription": "This app needs access to your camera to scan receipts and documents",
        "NSMicrophoneUsageDescription": "This app needs access to your microphone when recording videos"
      },
    },
    android: {
      package: getBundleIdentifier(),
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      [
        "expo-image-picker",
        {
          "photosPermission": "The app needs access to your photos to upload receipts and documents",
          "cameraPermission": "The app needs access to your camera to scan receipts and documents",
          "microphonePermission": "The app needs access to your microphone when recording videos"
        }
      ],
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ],
      "@react-native-google-signin/google-signin"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "8178d963-9b4a-44b4-ae89-042607e45d02"
      },
      ocrApiUrl: process.env.EXPO_PUBLIC_OCR_API_URL,
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
      environment: process.env.APP_VARIANT || 'production'
    },
    updates: {
      enabled: !IS_DEV,
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/8178d963-9b4a-44b4-ae89-042607e45d02"
    },
    runtimeVersion: "1.0.0" + getVersionSuffix(),
    owner: "kevin14767"
  };

  // Only add Google Services files if they exist
  if (iosGoogleServices) {
    config.ios.googleServicesFile = iosGoogleServices;
  }
  
  if (androidGoogleServices) {
    config.android.googleServicesFile = androidGoogleServices;
  }

  return config;
};