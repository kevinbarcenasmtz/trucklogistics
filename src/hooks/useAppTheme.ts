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

export interface AppThemeColors {
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  secondaryTextColor: string;
  borderColor: string;
  primaryColor: string;
  successColor: string;
  errorColor: string;
  warningColor: string;
  infoColor: string;
  specialBackgroundColor: string;
  specialTextColor: string;
  specialSecondaryTextColor: string;
  buttonPrimaryBg: string;
  buttonSecondaryBg: string;
  buttonDisabledBg: string;
  themeStyles: ReturnType<typeof getThemeStyles>;
  isDarkTheme: boolean;
}

export interface AppThemeHelpers extends AppThemeColors {
  themePreference: ThemePreference;
  setTheme: (theme: ThemePreference) => Promise<boolean>;
  isChangingTheme: boolean;
  themeConstants: {
    THEME_SYSTEM: 'system';
    THEME_LIGHT: 'light';
    THEME_DARK: 'dark';
  };
  getBackgroundColor: (isSpecial?: boolean) => string;
  getTextColor: (isSpecial?: boolean) => string;
  getSecondaryTextColor: (isSpecial?: boolean) => string;
  getSurfaceColor: (elevated?: boolean) => string;
  getButtonBackground: (variant?: 'primary' | 'secondary' | 'disabled') => string;
}

export const useAppTheme = (): AppThemeHelpers => {
  const [themePreference, setThemePreference] = useState<ThemePreference>(THEME_SYSTEM);
  const [systemColorScheme, setSystemColorScheme] = useState(Appearance.getColorScheme());
  const [isChangingTheme, setIsChangingTheme] = useState(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === THEME_LIGHT || savedTheme === THEME_DARK || savedTheme === THEME_SYSTEM) {
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

  // SIMPLIFIED color calculations
  const colors = useMemo(() => {
    const backgroundColor = themeStyles.colors.background;
    const surfaceColor = themeStyles.colors.surface;
    const textColor = themeStyles.colors.text.primary;
    const secondaryTextColor = themeStyles.colors.text.secondary;
    const borderColor = themeStyles.colors.border;
    const primaryColor = themeStyles.colors.primary;

    // Special colors - use theme-aware values
    const specialBackgroundColor = primaryColor;
    const specialTextColor = themeStyles.colors.white;
    const specialSecondaryTextColor = isDarkTheme 
      ? 'rgba(255, 255, 255, 0.9)' 
      : 'rgba(255, 255, 255, 0.8)';

    // Button colors
    const buttonPrimaryBg = primaryColor;
    const buttonSecondaryBg = surfaceColor;
    const buttonDisabledBg = isDarkTheme ? '#374151' : '#E5E7EB';

    return {
      backgroundColor,
      surfaceColor,
      textColor,
      secondaryTextColor,
      borderColor,
      primaryColor,
      successColor: themeStyles.colors.status.success,
      errorColor: themeStyles.colors.status.error,
      warningColor: themeStyles.colors.status.warning,
      infoColor: themeStyles.colors.status.info,
      specialBackgroundColor,
      specialTextColor,
      specialSecondaryTextColor,
      buttonPrimaryBg,
      buttonSecondaryBg,
      buttonDisabledBg,
    };
  }, [themeStyles, isDarkTheme]);

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
        return colors.surfaceColor; // Simplified - no elevation variants for now
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
    themeStyles,
    isDarkTheme,
    ...helpers,
  };
};