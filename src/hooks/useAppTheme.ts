// src/hooks/useAppTheme.ts
import { getThemeStyles } from '@/src/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

// Theme types (moved from ThemeContext)
export type ThemeType = 'light' | 'dark';
export type ThemePreference = ThemeType | 'system';

// Theme constants
const THEME_STORAGE_KEY = 'trucklogistics_theme';
const THEME_SYSTEM: 'system' = 'system';
const THEME_LIGHT: 'light' = 'light';
const THEME_DARK: 'dark' = 'dark';

export interface AppThemeColors {
  // Core UI colors - calculated once
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  secondaryTextColor: string;
  borderColor: string;
  // Interactive colors
  primaryColor: string;
  successColor: string;
  errorColor: string;
  warningColor: string;
  infoColor: string;
  // Onboarding special colors
  specialBackgroundColor: string;
  specialTextColor: string;
  specialSecondaryTextColor: string;
  // Button colors
  buttonPrimaryBg: string;
  buttonSecondaryBg: string;
  buttonDisabledBg: string;
  // Theme utilities
  themeStyles: ReturnType<typeof getThemeStyles>;
  isDarkTheme: boolean;
}

export interface AppThemeHelpers extends AppThemeColors {
  // Theme preference management (replaces ThemeContext)
  themePreference: ThemePreference;
  setTheme: (theme: ThemePreference) => Promise<boolean>;
  isChangingTheme: boolean;
  themeConstants: {
    THEME_SYSTEM: 'system';
    THEME_LIGHT: 'light';
    THEME_DARK: 'dark';
  };
  // Helper functions for dynamic colors
  getBackgroundColor: (isSpecial?: boolean) => string;
  getTextColor: (isSpecial?: boolean) => string;
  getSecondaryTextColor: (isSpecial?: boolean) => string;
  getSurfaceColor: (elevated?: boolean) => string;
  getButtonBackground: (variant?: 'primary' | 'secondary' | 'disabled') => string;
}

export const useAppTheme = (): AppThemeHelpers => {
  // Theme preference state management
  const [themePreference, setThemePreference] = useState<ThemePreference>(THEME_SYSTEM);
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());
  const [isChangingTheme, setIsChangingTheme] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (
          savedTheme === THEME_LIGHT ||
          savedTheme === THEME_DARK ||
          savedTheme === THEME_SYSTEM
        ) {
          setThemePreference(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        setThemePreference(THEME_SYSTEM);
      }
    };

    loadThemePreference();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  // Calculate effective theme
  const isDarkTheme = useMemo(() => {
    if (themePreference === THEME_SYSTEM) {
      return systemColorScheme === 'dark';
    }
    return themePreference === THEME_DARK;
  }, [themePreference, systemColorScheme]);

  const theme: ThemeType = isDarkTheme ? 'dark' : 'light';
  const themeStyles = useMemo(() => getThemeStyles(theme), [theme]);

  // Theme change function (replaces ThemeContext setTheme)
  const setTheme = useCallback(async (newTheme: ThemePreference): Promise<boolean> => {
    setIsChangingTheme(true);

    try {
      // Save to storage first
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);

      // Update state only after successful storage
      setThemePreference(newTheme);

      console.log(`Theme changed to: ${newTheme}`);
      return true; // Success
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      return false; // Failure
    } finally {
      setIsChangingTheme(false);
    }
  }, []);

  // Calculate all colors once - memoized for performance
  const colors = useMemo(() => {
    const backgroundColor = isDarkTheme
      ? themeStyles.colors.black_grey
      : themeStyles.colors.background;
    const surfaceColor = isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.surface;
    const textColor = isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary;
    const secondaryTextColor = isDarkTheme
      ? themeStyles.colors.grey
      : themeStyles.colors.text.secondary;
    const borderColor = isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.border;

    // Interactive colors
    const primaryColor = themeStyles.colors.greenThemeColor;
    const successColor = themeStyles.colors.greenThemeColor;
    const errorColor = themeStyles.colors.status.error;
    const warningColor = themeStyles.colors.status.warning;
    const infoColor = themeStyles.colors.status.info;

    // Special colors (for onboarding, welcome screens, etc.)
    const specialBackgroundColor = themeStyles.colors.greenThemeColor;
    const specialTextColor = '#FFFFFF';
    const specialSecondaryTextColor = 'rgba(255, 255, 255, 0.9)';

    // Button colors
    const buttonPrimaryBg = themeStyles.colors.greenThemeColor;
    const buttonSecondaryBg = surfaceColor;
    const buttonDisabledBg = isDarkTheme ? '#444444' : '#E0E0E0';

    return {
      backgroundColor,
      surfaceColor,
      textColor,
      secondaryTextColor,
      borderColor,
      primaryColor,
      successColor,
      errorColor,
      warningColor,
      infoColor,
      specialBackgroundColor,
      specialTextColor,
      specialSecondaryTextColor,
      buttonPrimaryBg,
      buttonSecondaryBg,
      buttonDisabledBg,
    };
  }, [themeStyles, isDarkTheme]);

  // Helper functions - memoized to prevent recreation
  const helpers = useMemo(
    () => ({
      getBackgroundColor: (isSpecial = false) => {
        return isSpecial ? colors.specialBackgroundColor : colors.backgroundColor;
      },

      getTextColor: (isSpecial = false) => {
        return isSpecial ? colors.specialTextColor : colors.textColor;
      },

      getSecondaryTextColor: (isSpecial = false) => {
        return isSpecial ? colors.specialSecondaryTextColor : colors.secondaryTextColor;
      },

      getSurfaceColor: (elevated = false) => {
        if (elevated && isDarkTheme) {
          return themeStyles.colors.surface; // Slightly lighter for elevated surfaces
        }
        return colors.surfaceColor;
      },

      getButtonBackground: (variant: 'primary' | 'secondary' | 'disabled' = 'primary') => {
        switch (variant) {
          case 'primary':
            return colors.buttonPrimaryBg;
          case 'secondary':
            return colors.buttonSecondaryBg;
          case 'disabled':
            return colors.buttonDisabledBg;
          default:
            return colors.buttonPrimaryBg;
        }
      },
    }),
    [colors, themeStyles, isDarkTheme]
  );

  return {
    // Direct colors
    ...colors,
    // Theme preference management (replaces ThemeContext)
    themePreference,
    setTheme,
    isChangingTheme,
    themeConstants: {
      THEME_SYSTEM,
      THEME_LIGHT,
      THEME_DARK,
    },
    // Utils
    themeStyles,
    isDarkTheme,
    // Helper functions
    ...helpers,
  };
};
