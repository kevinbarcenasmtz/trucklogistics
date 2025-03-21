// src/theme/ThemeToggle.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme, ThemePreference } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getThemeStyles } from '../theme';

export default function ThemeToggle(): JSX.Element {
  const { 
    theme,
    themePreference, 
    setTheme, 
    isDarkTheme,
    themeConstants: { THEME_SYSTEM, THEME_LIGHT, THEME_DARK } 
  } = useTheme();
  
  // Get theme styles
  const themeStyles = getThemeStyles(theme);

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

  // Use theme-consistent icon size from typography
  const iconSize = themeStyles.typography.fontSize.md;
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { padding: themeStyles.spacing.sm }
      ]}
      onPress={() => setTheme(getNextTheme())}
      accessibilityLabel="Toggle theme"
      accessibilityHint={`Current theme is ${getThemeLabel()}, tap to change`}
    >
     <Ionicons
        name={getThemeIcon() as keyof typeof Ionicons.glyphMap}
        size={iconSize}
        color={themeStyles.colors.text.primary}
      />
      <Text style={[
        styles.label,
        { 
          marginLeft: themeStyles.spacing.sm,
          fontSize: themeStyles.typography.fontSize.sm,
          color: themeStyles.colors.text.primary
        }
      ]}>
        {getThemeLabel()}
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