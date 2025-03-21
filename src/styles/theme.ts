import { ThemeType } from '../context/ThemeContext';
import { ViewStyle } from 'react-native';

// Shadow type
interface ShadowProps {
  shadowColor: string;
  shadowOffset: {
    width: number;
    height: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

// Colors type
interface ThemeColors {
  primary: {
    light: string;
    dark: string;
  };
  background: {
    light: string;
    dark: string;
  };
  surface: {
    light: string;
    dark: string;
  };
  text: {
    light: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    dark: {
      primary: string;
      secondary: string;
      disabled: string;
    };
  };
  border: {
    light: string;
    dark: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

// Typography type
interface Typography {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
}

// Spacing type
interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

// BorderRadius type
interface BorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  round: number;
}

// Shadow type
interface Shadow {
  sm: ShadowProps;
  md: ShadowProps;
  lg: ShadowProps;
}

// Theme styles type
export interface ThemeStyles {
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    border: string;
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadow: Shadow;
}

// Color palette
const colors: ThemeColors = {
  // Primary brand colors
  primary: {
    light: '#2563EB', // Blue 600
    dark: '#3B82F6',  // Blue 500
  },
  // Background colors
  background: {
    light: '#FFFFFF',
    dark: '#121212',
  },
  // Card/surface colors
  surface: {
    light: '#F3F4F6',
    dark: '#1E1E1E',
  },
  // Text colors
  text: {
    light: {
      primary: '#111827',
      secondary: '#4B5563',
      disabled: '#9CA3AF',
    },
    dark: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      disabled: '#6B7280',
    },
  },
  // Border colors
  border: {
    light: '#E5E7EB',
    dark: '#374151',
  },
  // Status colors (consistent across themes)
  status: {
    success: '#10B981', // Emerald 500
    warning: '#F59E0B', // Amber 500
    error: '#EF4444',   // Red 500
    info: '#3B82F6',    // Blue 500
  },
};

// Typography
const typography: Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
};

// Spacing
const spacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
const borderRadius: BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

// Shadow (for light theme)
const shadowLight: Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Shadow (for dark theme - more subtle)
const shadowDark: Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3.0,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5.0,
    elevation: 8,
  },
};

// Create themed style objects
export const getThemeStyles = (theme: ThemeType): ThemeStyles => {
  const isDark = theme === 'dark';
  
  return {
    colors: {
      primary: isDark ? colors.primary.dark : colors.primary.light,
      background: isDark ? colors.background.dark : colors.background.light,
      surface: isDark ? colors.surface.dark : colors.surface.light,
      text: {
        primary: isDark ? colors.text.dark.primary : colors.text.light.primary,
        secondary: isDark ? colors.text.dark.secondary : colors.text.light.secondary,
        disabled: isDark ? colors.text.dark.disabled : colors.text.light.disabled,
      },
      border: isDark ? colors.border.dark : colors.border.light,
      status: colors.status, // Same for both themes
    },
    typography,
    spacing,
    borderRadius,
    shadow: isDark ? shadowDark : shadowLight,
  };
};

// Type for style functions
export type StyleFunction<T> = (themeStyles: ThemeStyles) => T;

// Hook to get themed styles
export function useThemedStyles<T>(styleFn: StyleFunction<T>): (theme: ThemeType) => T {
  return (theme: ThemeType) => {
    const themeStyles = getThemeStyles(theme);
    return styleFn(themeStyles);
  };
}