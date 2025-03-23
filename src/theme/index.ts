import { Dimensions } from 'react-native';
import { ThemeType } from '../context/ThemeContext';

// Window dimensions (from Dimensions.ts)
const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

// Responsive scaling utilities (from Metrics.ts)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const horizontalScale = (size: number): number => 
  (windowWidth / guidelineBaseWidth) * size;

const verticalScale = (size: number): number => 
  (windowHeight / guidelineBaseHeight) * size;

const moderateScale = (size: number, factor = 0.5): number =>
  size + (horizontalScale(size) - size) * factor;

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

// Theme constants - integrated with Colors.ts values
const COLORS = {
  // Basic colors
  white: '#FFFFFF',
  black: '#000000',
  offWhite: '#f3f3ec', // From Colors.ts
  
  // Brand colors
  primary: {
    light: '#2563EB', // Blue 600
    dark: '#3B82F6',  // Blue 500
    main: '#004d40',  // From Colors.ts greenThemeColor
    light2: '#00796b', // From Colors.ts thirdOnboardingColor
  },
  
  // Background colors
  background: {
    light: '#FFFFFF',
    dark: '#121212',
    main: '#1c1c1e',     // From Colors.ts black_grey
    card: '#29292b',     // From Colors.ts darkGrey
    elevated: '#38393d', // From Colors.ts
  },
  
  // Surface colors
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
    // From Colors.ts
    primary: '#FFFFFF',
    secondary: '#b0b0b0',
  },
  
  // Border colors
  border: {
    light: '#E5E7EB',
    dark: '#374151',
  },
  
  // Status colors - integrated with Colors.ts values
  status: {
    success: '#4CAF50', // From Colors.ts
    warning: '#FFC107', // From Colors.ts
    error: '#FF3B30',   // From Colors.ts
    info: '#2196F3',    // From Colors.ts
  },
  
  // Grayscale (from Colors.ts)
  gray: {
    light: '#b0b0b0',
    medium: '#6c6c6e',
    dark: '#29292b',
    darker: '#1c1c1e',
    transparent: '#b6b9bf',
  },
  
  // Legacy colors for backward compatibility
  grey: '#b0b0b0',
  darkGrey: '#29292b',
  black_grey: '#1c1c1e',
  transParent: '#b6b9bf',
  greenThemeColor: '#004d40',
  thirdOnboardingColor: '#00796b',
};

// Typography - using moderateScale for responsive sizing
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
  // Additional styles from old project
  header: {
    large: {
      fontSize: moderateScale(28),
      fontWeight: '700' as const,
      lineHeight: moderateScale(34),
    },
    medium: {
      fontSize: moderateScale(22),
      fontWeight: '600' as const,
      lineHeight: moderateScale(28),
    },
    small: {
      fontSize: moderateScale(18),
      fontWeight: '600' as const,
      lineHeight: moderateScale(24),
    },
  },
  body: {
    large: {
      fontSize: moderateScale(16),
      lineHeight: moderateScale(24),
    },
    medium: {
      fontSize: moderateScale(14),
      lineHeight: moderateScale(20),
    },
    small: {
      fontSize: moderateScale(12),
      lineHeight: moderateScale(18),
    },
  },
  button: {
    fontSize: moderateScale(16),
    fontWeight: '600' as const,
  },
};

// Spacing with moderateScale for consistency
const SPACING = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48),
};

// Border radius with moderateScale
const BORDER_RADIUS = {
  sm: moderateScale(4),
  md: moderateScale(8),
  lg: moderateScale(12),
  xl: moderateScale(16),
  round: 9999,
  circle: (size: number) => size / 2,
};

// Shadow presets for light theme
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

// Shadow presets for dark theme (more subtle)
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

// Application base styles (from ApplicationStyles)
const APPLICATION_STYLES = {
  screen: {
    flex: 1,
  },
  // Add more application level styles here
};

// Theme styles interface
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
    // Adding gray scale for backward compatibility
    gray: typeof COLORS.gray;
    // Adding legacy colors
    greenThemeColor: string;
    thirdOnboardingColor: string;
    grey: string;
    darkGrey: string;
    black_grey: string;
    transParent: string;
    offWhite: string;
    white: string;
    black: string;
  };
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  borderRadius: typeof BORDER_RADIUS;
  shadow: Record<string, ShadowProps>;
  applicationStyles: typeof APPLICATION_STYLES;
}

// Generate theme styles based on theme type
export const getThemeStyles = (theme: ThemeType): ThemeStyles => {
  const isDark = theme === 'dark';
  
  // Define light theme variants of legacy colors
  const lightModeLegacyColors = {
    grey: '#757575',            // Medium gray for light theme
    darkGrey: '#f0f0f0',        // Light gray for light theme (card backgrounds)
    black_grey: '#f8f8f8',      // Off-white for light theme (backgrounds)
    greenThemeColor: COLORS.greenThemeColor,  // Keep brand color consistent
    thirdOnboardingColor: COLORS.thirdOnboardingColor, // Keep brand color consistent
    transParent: '#d0d0d0',     // Lighter transparent for light theme
  };
  
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
      status: COLORS.status, // Same for both themes
      gray: COLORS.gray, // Same for both themes
      
      // Legacy colors - modify based on theme
      greenThemeColor: COLORS.greenThemeColor, // Keep brand color consistent
      thirdOnboardingColor: COLORS.thirdOnboardingColor, // Keep brand color consistent
      grey: isDark ? COLORS.grey : lightModeLegacyColors.grey,
      darkGrey: isDark ? COLORS.darkGrey : lightModeLegacyColors.darkGrey,
      black_grey: isDark ? COLORS.black_grey : lightModeLegacyColors.black_grey,
      transParent: isDark ? COLORS.transParent : lightModeLegacyColors.transParent,
      offWhite: COLORS.offWhite, // Keep this consistent
      white: COLORS.white, // Keep this consistent
      black: COLORS.black, // Keep this consistent
    },
    typography: TYPOGRAPHY,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    shadow: isDark ? SHADOW_DARK : SHADOW_LIGHT,
    applicationStyles: APPLICATION_STYLES,
  };
};

// Type for style functions
export type StyleFunction<T> = (themeStyles: ThemeStyles) => T;

// Hook to get themed styles (same as your original implementation)
export function useThemedStyles<T>(styleFn: StyleFunction<T>): (theme: ThemeType) => T {
  return (theme: ThemeType) => {
    const themeStyles = getThemeStyles(theme);
    return styleFn(themeStyles);
  };
}

// Export constants for direct use
export {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOW_LIGHT,
  SHADOW_DARK,
  APPLICATION_STYLES,
  horizontalScale,
  verticalScale,
  moderateScale,
  windowWidth,
  windowHeight,
};

// Default export of all theme elements
const Theme = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadow: {
    light: SHADOW_LIGHT,
    dark: SHADOW_DARK,
  },
  applicationStyles: APPLICATION_STYLES,
  scale: {
    horizontalScale,
    verticalScale,
    moderateScale,
  },
  dimensions: {
    windowWidth,
    windowHeight,
  },
};

export default Theme;