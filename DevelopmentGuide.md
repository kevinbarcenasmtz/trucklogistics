# iOS iPhone Development Guide for TruckLogistics

This guide provides a straightforward workflow for developing the TruckLogistics Expo app on a physical iOS iPhone, based on the approach that worked successfully.

## Project Structure

TruckLogistics/
├── trucklogistics/ # Expo frontend app
└── trucklogistics-ocr/ # Node.js OCR backend service

## Simple iPhone Development Workflow

### Step 1: Create a Development Build

```bash
# Navigate to your Expo app directory
cd trucklogistics

# Create an iOS development build
eas build --platform ios --profile development

```

This command creates a development build that can be installed on your iPhone. It will generate a QR code and a URL for installation.

### Step 2: Install on Your iPhone

After the build completes:

1. Click the "Install" button in the EAS Build artifact section to display the QR code
2. Scan the QR code with your iPhone's camera
3. Tap the link that appears to download and install the development build

If the QR code doesn't appear, you can also access it through:

- The build URL provided in the terminal
- The Expo website under your project's builds section
- The Expo Orbit mobile app (available on the App Store)

### Step 3: Start the Development Server

```bash
# With the app installed on your iPhone, start the development server
npx expo start --dev-client --scheme trucklogistics-dev
```

This starts the Metro bundler and creates a development server on your local network.

### Step 4: Connect Your iPhone App

1. Open the TruckLogistics app on your iPhone
2. The app should automatically connect to the development server if your iPhone and computer are on the same network
3. You can now make changes to your code and see them reflected on your iPhone when you reload the app

## Connecting to Your OCR Backend

To enable your iPhone app to communicate with your OCR backend:

1. Start your OCR backend service:

```bash
# In a separate terminal window
cd trucklogistics-ocr
npm start
```

2. Configure your app to use your computer's local IP address:

```javascript
// Update your API endpoint configuration
const API_URL = __DEV__
  ? 'http://192.168.1.x:3000' // Replace with your computer's IP address
  : 'https://your-production-server.com';
```

3. You can find your computer's IP address using:

```bash
ipconfig getifaddr en0  # For WiFi on Mac
```

## Making Code Changes

With this setup, your development workflow is simple:

1. Edit your code in the `trucklogistics` directory
2. Save your changes
3. The app on your iPhone will either automatically refresh or you can manually refresh it

For JavaScript/TypeScript changes, you don't need to rebuild the app. For native code changes (like adding new dependencies that require native modules), you'll need to run the build command again.

## Troubleshooting

### App Not Connecting to Development Server

If your app doesn't automatically connect to the development server:

1. Make sure your iPhone and computer are on the same WiFi network
2. Shake your iPhone to open the developer menu
3. Tap "Change server" and enter your computer's IP address manually (e.g., `http://192.168.1.x:8081`)

### Backend Connectivity Issues

If your app can't connect to your OCR backend:

1. Verify your backend is running (you should see server logs)
2. Check that you're using the correct IP address
3. Ensure no firewall is blocking the connection
4. Consider using ngrok if direct connection doesn't work:

   ```bash
   npx ngrok http 3000
   ```

   Then update your API_URL to the ngrok URL.

## Preparing for Production

When your app is ready for testing or production:

```bash
# Create a TestFlight build
eas build --platform ios --profile preview

# Create a production build
eas build --platform ios --profile production
```

## Resources

- [Expo Development Builds Documentation](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Application Services (EAS) Build](https://docs.expo.dev/build/introduction/)
- [Developing for iOS](https://docs.expo.dev/workflow/ios-simulator/)

---

Updated commands for eas build:
For iOS Simulator
eas build --platform ios --profile simulator

For Physical iPhone Device  
eas build --platform ios --profile development

For Preview/Beta Testing
eas build --platform ios --profile preview

For Production
eas build --platform ios --profile production

Start
npx expo start --dev-client --scheme trucklogistics-dev

Alternatively if you run "npx expo run:ios --device" the metro bundler will start with "Metro waiting on exp+trucklogistics://expo-development-client/?url=http%3A%2F%2F192.168.1.36%3A8081". Saved this url so next time I start the app it should be able to use that url.

npx expo start --dev-client --scheme trucklogistics-dev

- `--dev-client`: Tells Expo to expect a development build (not Expo Go)
- `--scheme trucklogistics-dev`: Uses your app's custom scheme (matches your app.config.js)

Step 2: Alternative with Specific Network Configuration

If you need to force it to use your specific IP address (192.168.1.36):

```bash
npx expo start --dev-client --scheme trucklogistics-dev --lan
```

The `--lan` flag ensures Metro binds to your local network interface.

Step 3: Manual URL Connection (if needed)

If the automatic connection doesn't work, you can manually enter the development server URL in your development build:

1. Open the TruckLogistics development app on your iPhone
2. Shake the device to open the developer menu
3. Tap "Configure Metro"
4. Enter: `http://192.168.1.36:8081`

Why This Works

Your development build was configured with the scheme `trucklogistics-dev` (from your app.config.js), so using `--scheme trucklogistics-dev` ensures the Metro bundler generates the correct deep link URL that your development build recognizes.

The URL format `exp+trucklogistics://expo-development-client/?url=...` is automatically generated when you use the `--dev-client` flag with the correct scheme.
