
# TruckLogistics

Mobile application for logistics management built with React Native and Expo.

## Project Information

* **Project Name:** trucklogistics
* **Expo Account:** kevin14767
* **Android Package:** com.kevin14767.trucklogistics
* **iOS Bundle ID:** com.kevin14767.trucklogistics

## Development Setup

### Prerequisites

* Node.js (v16+)
* npm or yarn
* Expo CLI (`npm install -g expo-cli`)
* iOS: XCode & CocoaPods (for iOS development)
* Android: Android Studio & SDK (for Android development)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/username/trucklogistics.git
   cd trucklogistics
   ```
2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```
3. Start the development server
   ```bash
   npx expo start
   ```

### Development Build

Create a development build for testing:

```bash
# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

## Building for Production

This project uses EAS Build for creating production builds:

```bash
# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production
```

## Continuous Integration

This project uses GitHub Actions for CI/CD pipelines:

* Automated testing on pull requests
* Build verification
* Preview builds for feature branches
