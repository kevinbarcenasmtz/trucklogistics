// src/hooks/useAppTheme.ts
import { getThemeStyles } from '@/src/theme';
import { useTheme } from '../context/ThemeContext';

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
  // Helper functions for dynamic colors
  getBackgroundColor: (isSpecial?: boolean) => string;
  getTextColor: (isSpecial?: boolean) => string;
  getSecondaryTextColor: (isSpecial?: boolean) => string;
  getSurfaceColor: (elevated?: boolean) => string;
  getButtonBackground: (variant?: 'primary' | 'secondary' | 'disabled') => string;
}

export const useAppTheme = (): AppThemeHelpers => {
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  // Calculate all colors once
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

  // Helper functions for dynamic color selection
  const getBackgroundColor = (isSpecial = false) => {
    return isSpecial ? specialBackgroundColor : backgroundColor;
  };

  const getTextColor = (isSpecial = false) => {
    return isSpecial ? specialTextColor : textColor;
  };

  const getSecondaryTextColor = (isSpecial = false) => {
    return isSpecial ? specialSecondaryTextColor : secondaryTextColor;
  };

  const getSurfaceColor = (elevated = false) => {
    if (elevated && isDarkTheme) {
      return themeStyles.colors.surface; // Slightly lighter for elevated surfaces
    }
    return surfaceColor;
  };

  const getButtonBackground = (variant: 'primary' | 'secondary' | 'disabled' = 'primary') => {
    switch (variant) {
      case 'primary':
        return buttonPrimaryBg;
      case 'secondary':
        return buttonSecondaryBg;
      case 'disabled':
        return buttonDisabledBg;
      default:
        return buttonPrimaryBg;
    }
  };

  return {
    // Direct colors
    backgroundColor,
    surfaceColor,
    textColor,
    secondaryTextColor,
    borderColor,

    // Interactive colors
    primaryColor,
    successColor,
    errorColor,
    warningColor,
    infoColor,

    // Special colors
    specialBackgroundColor,
    specialTextColor,
    specialSecondaryTextColor,

    // Button colors
    buttonPrimaryBg,
    buttonSecondaryBg,
    buttonDisabledBg,

    // Utils
    themeStyles,
    isDarkTheme,

    // Helper functions
    getBackgroundColor,
    getTextColor,
    getSecondaryTextColor,
    getSurfaceColor,
    getButtonBackground,
  };
};
