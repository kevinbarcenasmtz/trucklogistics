// src/theme/index.ts
import { Dimensions } from 'react-native';
import { ThemeType } from '../hooks/useAppTheme';

// Window dimensions
const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

// Responsive scaling utilities
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const horizontalScale = (size: number): number => (windowWidth / guidelineBaseWidth) * size;
const verticalScale = (size: number): number => (windowHeight / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5): number =>
  size + (horizontalScale(size) - size) * factor;

// Shadow type
interface ShadowProps {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

// Colors - SIMPLIFIED
const COLORS = {
  // Primary colors
  primary: {
    light: '#004d40', // Your green brand color
    dark: '#00796b',  // Slightly lighter green for dark mode
  },
  
  // Background colors
  background: {
    light: '#FFFFFF',
    dark: '#121212',
  },
  
  // Surface colors (cards, elevated elements)
  surface: {
    light: '#F8F9FA',
    dark: '#1E1E1E',
  },
  
  // Text colors
  text: {
    light: {
      primary: '#111827',
      secondary: '#6B7280',
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
  
  // Status colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // Basic colors
  white: '#FFFFFF',
  black: '#000000',
};

// Typography
const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: moderateScale(12),
    sm: moderateScale(14),
    md: moderateScale(16),
    lg: moderateScale(18),
    xl: moderateScale(20),
    xxl: moderateScale(24),
  },
};

// Spacing
const SPACING = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48),
};

// Border radius
const BORDER_RADIUS = {
  sm: moderateScale(4),
  md: moderateScale(8),
  lg: moderateScale(12),
  xl: moderateScale(16),
  round: 9999,
};

// Shadows
const SHADOW_LIGHT: Record<string, ShadowProps> = {
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

const SHADOW_DARK: Record<string, ShadowProps> = {
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

// Theme styles interface - SIMPLIFIED
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
    white: string;
    black: string;
  };
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  borderRadius: typeof BORDER_RADIUS;
  shadow: Record<string, ShadowProps>;
}

// Create themed styles - CLEAN VERSION
export const getThemeStyles = (theme: ThemeType): ThemeStyles => {
  const isDark = theme === 'dark';

  return {
    colors: {
      primary: isDark ? COLORS.primary.dark : COLORS.primary.light,
      background: isDark ? COLORS.background.dark : COLORS.background.light,
      surface: isDark ? COLORS.surface.dark : COLORS.surface.light,
      text: {
        primary: isDark ? COLORS.text.dark.primary : COLORS.text.light.primary,
        secondary: isDark ? COLORS.text.dark.secondary : COLORS.text.light.secondary,
        disabled: isDark ? COLORS.text.dark.disabled : COLORS.text.light.disabled,
      },
      border: isDark ? COLORS.border.dark : COLORS.border.light,
      status: COLORS.status,
      white: COLORS.white,
      black: COLORS.black,
    },
    typography: TYPOGRAPHY,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    shadow: isDark ? SHADOW_DARK : SHADOW_LIGHT,
  };
};

// Export utilities
export { horizontalScale, moderateScale, verticalScale, windowHeight, windowWidth };