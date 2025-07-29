// src/hooks/useAppTheme.ts
import { getThemeStyles } from '@/src/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

export type ThemeType = 'light' | 'dark';
export type ThemePreference = ThemeType | 'system';

const THEME_STORAGE_KEY = 'trucklogistics_theme';
const THEME_SYSTEM: 'system' = 'system';
const THEME_LIGHT: 'light' = 'light';
const THEME_DARK: 'dark' = 'dark';

// SEMANTIC COLOR INTERFACE - Designer Friendly
export interface AppThemeColors {
  // === BACKGROUNDS ===
  screenBackground: string; // Main screen background
  cardBackground: string; // Cards, elevated surfaces
  inputBackground: string; // Form inputs, search bars
  modalBackground: string; // Modals, overlays

  // === TEXT COLORS ===
  textPrimary: string; // Main text, headings
  textSecondary: string; // Captions, descriptions
  textMuted: string; // Disabled, placeholder text
  textInverse: string; // Text on colored backgrounds

  // === INTERACTIVE COLORS ===
  primary: string; // Primary buttons, links, active states
  primaryHover: string; // Primary hover states
  borderDefault: string; // Default borders, dividers
  borderFocus: string; // Focused input borders

  // === SEMANTIC COLORS ===
  success: string; // Success states, confirmations
  warning: string; // Warnings, cautions
  error: string; // Errors, destructive actions
  info: string; // Information, help text

  // === TRUCK-SPECIFIC SEMANTICS ===
  fuel: string; // Fuel-related indicators
  maintenance: string; // Maintenance alerts
  route: string; // Route, navigation elements
  cargo: string; // Cargo, inventory elements

  // === UTILITY COLORS ===
  white: string;
  black: string;
  transparent: string;

  // === LEGACY SUPPORT (for migration) ===
  themeStyles: ReturnType<typeof getThemeStyles>;
  isDarkTheme: boolean;
}

// HELPER FUNCTIONS INTERFACE
export interface AppThemeHelpers extends AppThemeColors {
  // Theme management
  themePreference: ThemePreference;
  setTheme: (theme: ThemePreference) => Promise<boolean>;
  isChangingTheme: boolean;
  themeConstants: {
    THEME_SYSTEM: 'system';
    THEME_LIGHT: 'light';
    THEME_DARK: 'dark';
  };

  // Semantic helper functions
  getBackground: (variant?: 'screen' | 'card' | 'input' | 'modal') => string;
  getText: (variant?: 'primary' | 'secondary' | 'muted' | 'inverse') => string;
  getBorder: (variant?: 'default' | 'focus') => string;
  getButton: (variant?: 'primary' | 'secondary' | 'ghost' | 'danger') => {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
  };
  getSemantic: (type: 'success' | 'warning' | 'error' | 'info') => string;
  getTruckSemantic: (type: 'fuel' | 'maintenance' | 'route' | 'cargo') => string;
}

export const useAppTheme = (): AppThemeHelpers => {
  const [themePreference, setThemePreference] = useState<ThemePreference>(THEME_SYSTEM);
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());
  const [isChangingTheme, setIsChangingTheme] = useState(false);

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

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const isDarkTheme = useMemo(() => {
    if (themePreference === THEME_SYSTEM) {
      return systemColorScheme === 'dark';
    }
    return themePreference === THEME_DARK;
  }, [themePreference, systemColorScheme]);

  const theme: ThemeType = isDarkTheme ? 'dark' : 'light';
  const themeStyles = useMemo(() => getThemeStyles(theme), [theme]);

  const setTheme = useCallback(async (newTheme: ThemePreference): Promise<boolean> => {
    setIsChangingTheme(true);

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemePreference(newTheme);
      console.log(`Theme changed to: ${newTheme}`);
      return true;
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      return false;
    } finally {
      setIsChangingTheme(false);
    }
  }, []);

  // SEMANTIC COLOR MAPPING - Designer Friendly
  const colors = useMemo((): AppThemeColors => {
    return {
      // === BACKGROUNDS ===
      screenBackground: themeStyles.colors.background,
      cardBackground: themeStyles.colors.surface,
      inputBackground: themeStyles.colors.surfaceVariant,
      modalBackground: themeStyles.colors.surface,

      // === TEXT COLORS ===
      textPrimary: themeStyles.colors.onBackground,
      textSecondary: themeStyles.colors.onSurface,
      textMuted: themeStyles.colors.onSurfaceVariant,
      textInverse: themeStyles.colors.white,

      // === INTERACTIVE COLORS ===
      primary: themeStyles.colors.primary,
      primaryHover: themeStyles.colors.primaryVariant,
      borderDefault: themeStyles.colors.border,
      borderFocus: themeStyles.colors.primary,

      // === SEMANTIC COLORS ===
      success: themeStyles.colors.success,
      warning: themeStyles.colors.warning,
      error: themeStyles.colors.error,
      info: themeStyles.colors.info,

      // === TRUCK-SPECIFIC SEMANTICS ===
      fuel: themeStyles.colors.fuel,
      maintenance: themeStyles.colors.maintenance,
      route: themeStyles.colors.route,
      cargo: themeStyles.colors.cargo,

      // === UTILITY COLORS ===
      white: themeStyles.colors.white,
      black: themeStyles.colors.black,
      transparent: 'transparent',

      // === LEGACY SUPPORT ===
      themeStyles,
      isDarkTheme,
    };
  }, [themeStyles, isDarkTheme]);

  // SEMANTIC HELPER FUNCTIONS
  const helpers = useMemo(
    () => ({
      getBackground: (variant: 'screen' | 'card' | 'input' | 'modal' = 'screen') => {
        switch (variant) {
          case 'screen':
            return colors.screenBackground;
          case 'card':
            return colors.cardBackground;
          case 'input':
            return colors.inputBackground;
          case 'modal':
            return colors.modalBackground;
          default:
            return colors.screenBackground;
        }
      },

      getText: (variant: 'primary' | 'secondary' | 'muted' | 'inverse' = 'primary') => {
        switch (variant) {
          case 'primary':
            return colors.textPrimary;
          case 'secondary':
            return colors.textSecondary;
          case 'muted':
            return colors.textMuted;
          case 'inverse':
            return colors.textInverse;
          default:
            return colors.textPrimary;
        }
      },

      getBorder: (variant: 'default' | 'focus' = 'default') => {
        switch (variant) {
          case 'default':
            return colors.borderDefault;
          case 'focus':
            return colors.borderFocus;
          default:
            return colors.borderDefault;
        }
      },

      getButton: (variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary') => {
        switch (variant) {
          case 'primary':
            return {
              backgroundColor: colors.primary,
              textColor: colors.textInverse,
              borderColor: colors.primary,
            };
          case 'secondary':
            return {
              backgroundColor: colors.cardBackground,
              textColor: colors.textPrimary,
              borderColor: colors.borderDefault,
            };
          case 'ghost':
            return {
              backgroundColor: 'transparent',
              textColor: colors.primary,
              borderColor: colors.primary,
            };
          case 'danger':
            return {
              backgroundColor: colors.error,
              textColor: colors.textInverse,
              borderColor: colors.error,
            };
          default:
            return {
              backgroundColor: colors.primary,
              textColor: colors.textInverse,
              borderColor: colors.primary,
            };
        }
      },

      getSemantic: (type: 'success' | 'warning' | 'error' | 'info') => {
        switch (type) {
          case 'success':
            return colors.success;
          case 'warning':
            return colors.warning;
          case 'error':
            return colors.error;
          case 'info':
            return colors.info;
          default:
            return colors.info;
        }
      },

      getTruckSemantic: (type: 'fuel' | 'maintenance' | 'route' | 'cargo') => {
        switch (type) {
          case 'fuel':
            return colors.fuel;
          case 'maintenance':
            return colors.maintenance;
          case 'route':
            return colors.route;
          case 'cargo':
            return colors.cargo;
          default:
            return colors.primary;
        }
      },
    }),
    [colors]
  );

  return {
    ...colors,
    themePreference,
    setTheme,
    isChangingTheme,
    themeConstants: {
      THEME_SYSTEM,
      THEME_LIGHT,
      THEME_DARK,
    },
    ...helpers,
  };
};
