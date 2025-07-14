const fs = require('fs');
// const path = require('path');

const IS_DEV = process.env.APP_VARIANT === 'development';
// const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const variants = {
  development: {
    name: 'TruckLogistics Dev',
    bundleId: 'com.kevin14767.trucklogistics.dev',
    versionSuffix: '.1',
  },
  preview: {
    name: 'TruckLogistics Beta',
    bundleId: 'com.kevin14767.trucklogistics.beta',
    versionSuffix: '.2',
  },
  production: {
    name: 'TruckLogistics',
    bundleId: 'com.kevin14767.trucklogistics',
    versionSuffix: '',
  },
};

const currentVariant = variants[process.env.APP_VARIANT] || variants.production;

const config = {
  name: currentVariant.name,
  slug: 'trucklogistics',
  version: `1.0${currentVariant.versionSuffix}`,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'trucklogistics-dev',
  userInterfaceStyle: 'automatic',
  newArchEnabled: false,

  ios: {
    supportsTablet: true,
    bundleIdentifier: currentVariant.bundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSPhotoLibraryUsageDescription:
        'This app needs access to your photos to upload receipts and documents',
      NSCameraUsageDescription:
        'This app needs access to your camera to scan receipts and documents',
      NSMicrophoneUsageDescription:
        'This app needs access to your microphone when recording videos',
      NSFaceIDUsageDescription:
        'This app uses Face ID to securely authenticate you and protect your account',
    },
  },
  android: {
    package: currentVariant.bundleId,
  },

  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    "expo-secure-store",
    'expo-router',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-google-signin/google-signin',
    [
      'expo-image-picker',
      {
        photosPermission:
          'The app needs access to your photos to upload receipts and documents',
        cameraPermission:
          'The app needs access to your camera to scan receipts and documents',
        microphonePermission:
          'The app needs access to your microphone when recording videos',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: '8178d963-9b4a-44b4-ae89-042607e45d02',
    },
    environment: process.env.APP_VARIANT || 'production',
  },

  updates: {
    enabled: !IS_DEV,
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/8178d963-9b4a-44b4-ae89-042607e45d02',
  },

  runtimeVersion: `1.0${currentVariant.versionSuffix}`,
  owner: 'kevin14767',
};

// Only add Google Services files if they exist
if (fs.existsSync('./GoogleService-Info.plist')) {
  config.ios.googleServicesFile = './GoogleService-Info.plist';
}

if (fs.existsSync('./google-services.json')) {
  config.android.googleServicesFile = './google-services.json';
}

module.exports = config;
