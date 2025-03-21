# EAS Update Guide for TruckLogistics

This guide explains how to use EAS Update to deliver over-the-air updates to your TruckLogistics app.

## Overview

EAS Update lets you push JavaScript and asset updates to your app without going through the app stores. This is useful for:

- Fixing bugs quickly
- Updating content
- Adding new features that don't require native code changes

## Update Channels

We use three update channels that match our environments:

- **production**: For updates to the app store version
- **preview**: For testing updates before releasing to production
- **development**: For development client builds

## Creating Updates

### Local Development

To create and test an update locally:

```bash
# First, pull environment variables for the target environment
eas env:pull --environment preview

# Create an update for the preview channel
eas update --branch preview --message "Description of changes" --environment preview
```

### From CI/CD

Updates are automatically created by our GitHub Actions workflow:

- When code is pushed to the `develop` branch, a preview update is created
- When code is pushed to the `main` branch, a production update is created

## Managing Updates

### View Updates

To view all updates for your project:

```bash
npx eas update:list
```

### View a Specific Update

```bash
npx eas update:view [UPDATE_ID]
```

### Rolling Back

If you need to roll back to a previous update:

```bash
# List recent updates
npx eas update:list

# Find the update ID you want to roll back to
npx eas update --branch production --message "Rolling back to stable version" --environment production --id [UPDATE_ID]
```

## Best Practices

1. **Always specify the environment**: 
   - Use `--environment` flag to ensure the correct environment variables are included

2. **Descriptive messages**:
   - Include meaningful commit messages that describe what changed

3. **Use branches for feature testing**:
   - For testing specific features, create custom branches:
   ```bash
   eas update --branch feature-x --message "Testing new feature X" --environment preview
   ```

4. **Testing before production**:
   - Always test updates on the preview channel before pushing to production

5. **Verify environment variables**:
   - Make sure environment-specific variables are correctly set before publishing

## Troubleshooting

### Update not showing up in app

1. Check that the app is using the correct update channel
2. Verify the app has an internet connection
3. Force reload the app by closing and reopening it

### Updates failing to publish

1. Check your Expo account credentials
2. Ensure your environment variables are properly set
3. Verify that your JavaScript code compiles correctly

### Debugging update issues

Use the Expo development client to test updates before publishing:

```bash
expo start --dev-client
```

## Additional Resources

- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Environment Variables in EAS](https://docs.expo.dev/build-reference/variables/)