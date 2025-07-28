// src/theme/ThemeToggle.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ThemePreference, useAppTheme } from '../hooks/useAppTheme';

export default function ThemeToggle(): JSX.Element {
  const {
    themePreference,
    setTheme,
    isDarkTheme,
    isChangingTheme,
    themeStyles,
    themeConstants: { THEME_SYSTEM, THEME_LIGHT, THEME_DARK },
  } = useAppTheme();

  const getNextTheme = (): ThemePreference => {
    // Cycle through theme options: system -> light -> dark -> system
    switch (themePreference) {
      case THEME_SYSTEM:
        return THEME_LIGHT;
      case THEME_LIGHT:
        return THEME_DARK;
      case THEME_DARK:
        return THEME_SYSTEM;
      default:
        return THEME_SYSTEM;
    }
  };

  const getThemeIcon = (): string => {
    switch (themePreference) {
      case THEME_SYSTEM:
        return isDarkTheme ? 'moon' : 'sunny';
      case THEME_LIGHT:
        return 'sunny';
      case THEME_DARK:
        return 'moon';
      default:
        return 'settings-outline';
    }
  };

  const getThemeLabel = (): string => {
    switch (themePreference) {
      case THEME_SYSTEM:
        return 'System';
      case THEME_LIGHT:
        return 'Light';
      case THEME_DARK:
        return 'Dark';
      default:
        return 'Theme';
    }
  };

  // Proper error handling and user feedback
  const handleThemeChange = async () => {
    try {
      // Haptic feedback
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }

    const nextTheme = getNextTheme();
    const success = await setTheme(nextTheme);

    if (!success) {
      Alert.alert('Theme Error', 'Failed to change theme. Please try again.', [{ text: 'OK' }]);
    }
  };

  // Use theme-consistent icon size from typography
  const iconSize = themeStyles.typography.fontSize.md;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          padding: themeStyles.spacing.sm,
          opacity: isChangingTheme ? 0.6 : 1, // Visual feedback during change
        },
      ]}
      onPress={handleThemeChange}
      disabled={isChangingTheme} // Prevent double-taps
      accessibilityLabel="Toggle theme"
      accessibilityHint={`Current theme is ${getThemeLabel()}, tap to change`}
    >
      {isChangingTheme ? (
        // Show loading indicator during theme change
        <ActivityIndicator size="small" color={themeStyles.colors.text.primary} />
      ) : (
        <Ionicons
          name={getThemeIcon() as keyof typeof Ionicons.glyphMap}
          size={iconSize}
          color={themeStyles.colors.text.primary}
        />
      )}
      <Text
        style={[
          styles.label,
          {
            marginLeft: themeStyles.spacing.sm,
            fontSize: themeStyles.typography.fontSize.sm,
            color: themeStyles.colors.text.primary,
          },
        ]}
      >
        {isChangingTheme ? 'Changing...' : getThemeLabel()} {/* Loading text */}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: '500',
  },
});
