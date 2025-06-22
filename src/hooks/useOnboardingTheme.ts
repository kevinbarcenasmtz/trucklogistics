// src/hooks/useOnboardingTheme.ts
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from '@/src/theme';

export interface OnboardingThemeColors {
  backgroundColor: string;
  textColor: string;
  secondaryTextColor: string;
  specialBackgroundColor: string;
  specialTextColor: string;
  specialSecondaryTextColor: string;
  isDarkTheme: boolean;
  themeStyles: ReturnType<typeof getThemeStyles>;
}

export interface OnboardingThemeHelpers extends OnboardingThemeColors {
  getBackgroundColor: (isSpecial?: boolean) => string;
  getTextColor: (isSpecial?: boolean) => string;
  getSecondaryTextColor: (isSpecial?: boolean) => string;
}

export const useOnboardingTheme = (): OnboardingThemeHelpers => {
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  // Base colors
  const backgroundColor = isDarkTheme
    ? themeStyles.colors.black_grey
    : themeStyles.colors.background;
  const textColor = isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary;
  const secondaryTextColor = isDarkTheme
    ? themeStyles.colors.grey
    : themeStyles.colors.text.secondary;

  // Special colors (for onboarding final slides, etc.)
  const specialBackgroundColor = '#004d40'; // Green theme color
  const specialTextColor = '#FFFFFF';
  const specialSecondaryTextColor = 'rgba(255, 255, 255, 0.9)';

  // Helper functions that replace the duplicated logic
  const getBackgroundColor = (isSpecial = false) => {
    return isSpecial ? specialBackgroundColor : backgroundColor;
  };

  const getTextColor = (isSpecial = false) => {
    return isSpecial ? specialTextColor : textColor;
  };

  const getSecondaryTextColor = (isSpecial = false) => {
    return isSpecial ? specialSecondaryTextColor : secondaryTextColor;
  };

  return {
    // Direct colors
    backgroundColor,
    textColor,
    secondaryTextColor,
    specialBackgroundColor,
    specialTextColor,
    specialSecondaryTextColor,

    // Theme utilities
    isDarkTheme,
    themeStyles,

    // Helper functions
    getBackgroundColor,
    getTextColor,
    getSecondaryTextColor,
  };
};

// Convenience hook for basic theming (most common use case)
export const useAppTheme = () => {
  const { backgroundColor, textColor, secondaryTextColor, themeStyles, isDarkTheme } =
    useOnboardingTheme();

  return {
    backgroundColor,
    textColor,
    secondaryTextColor,
    themeStyles,
    isDarkTheme,
  };
};
