# Environment Variables Setup for TruckLogistics

This document describes how to set up environment variables for the TruckLogistics app across different environments.

## Required Environment Variables

For each environment (development, preview, production), set up the following variables in the Expo Dashboard or using EAS CLI:

### Public Variables (Available in App Code)

- `EXPO_PUBLIC_API_URL`: The URL of the backend API
  - Development: https://dev-api.trucklogistics.com
  - Preview: https://staging-api.trucklogistics.com
  - Production: https://api.trucklogistics.com

### Build Configuration Variables

- `APP_VARIANT`: Determines app configuration (bundle ID, app name)
  - Development: "development"
  - Preview: "preview"
  - Production: "production"

### Secret Variables (For Build Process)

- `GOOGLE_SERVICES_JSON`: The content of your `google-services.json` file (for Firebase on Android)
- `GOOGLE_SERVICE_INFO_PLIST`: The content of your `GoogleService-Info.plist` file (for Firebase on iOS)
- `SENTRY_AUTH_TOKEN`: Authentication token for Sentry error reporting

## Setting Up Environment Variables

### Using EAS CLI

1. Create variables for production:

   ```bash
   eas env:create --environment production --key EXPO_PUBLIC_API_URL --value https://api.trucklogistics.com --type plain
   eas env:create --environment production --key APP_VARIANT --value production --type plain
   eas env:create --environment production --key GOOGLE_SERVICES_JSON --scope project --type secret --file /path/to/production/google-services.json
   eas env:create --environment production --key GOOGLE_SERVICE_INFO_PLIST --scope project --type secret --file /path/to/production/GoogleService-Info.plist
   eas env:create --environment production --key SENTRY_AUTH_TOKEN --value your-token --type sensitive
   ```

2. Create variables for preview:

   ```bash
   eas env:create --environment preview --key EXPO_PUBLIC_API_URL --value https://staging-api.trucklogistics.com --type plain
   eas env:create --environment preview --key APP_VARIANT --value preview --type plain
   eas env:create --environment preview --key GOOGLE_SERVICES_JSON --scope project --type secret --file /path/to/staging/google-services.json
   eas env:create --environment preview --key GOOGLE_SERVICE_INFO_PLIST --scope project --type secret --file /path/to/staging/GoogleService-Info.plist
   eas env:create --environment preview --key SENTRY_AUTH_TOKEN --value your-token --type sensitive
   ```

3. Create variables for development:
   ```bash
   eas env:create --environment development --key EXPO_PUBLIC_API_URL --value https://dev-api.trucklogistics.com --type plain
   eas env:create --environment development --key APP_VARIANT --value development --type plain
   eas env:create --environment development --key GOOGLE_SERVICES_JSON --scope project --type secret --file /path/to/dev/google-services.json
   eas env:create --environment development --key GOOGLE_SERVICE_INFO_PLIST --scope project --type secret --file /path/to/dev/GoogleService-Info.plist
   eas env:create --environment development --key SENTRY_AUTH_TOKEN --value your-token --type sensitive
   ```

### Using Expo Dashboard

1. Navigate to your project in the [Expo Dashboard](https://expo.dev)
2. Go to "Environment Variables" section
3. Add each variable, selecting the appropriate environment and type

## For Local Development

Pull environment variables for local development:

```bash
eas env:pull --environment development
```

This will create a `.env.local` file with all readable variables (plain and sensitive, but not secret).

Make sure to add `.env*` to your `.gitignore` file.

## GitHub Action Secrets

For the CI/CD pipeline, add these secrets to your GitHub repository:

- `EXPO_TOKEN`: Your Expo account token (get with `npx expo account:credentials:view`)
- `EXPO_PUBLIC_API_URL_PRODUCTION`: Production API URL
- `EXPO_PUBLIC_API_URL_STAGING`: Staging API URL
- `EXPO_PUBLIC_API_URL_DEV`: Development API URL

These secrets will be used in the GitHub Actions workflow.
