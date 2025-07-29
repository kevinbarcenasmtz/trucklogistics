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

// SEMANTIC COLOR SYSTEM - Production Ready
const COLORS = {
  // Brand colors - Your truck logistics green theme
  brand: {
    primary: {
      light: '#317039', // Emerald green - primary brand color
      dark: '#34D399', // Lighter emerald for dark mode contrast
    },
    secondary: {
      light: '#059669', // Darker emerald for accents
      dark: '#317039', // Medium emerald for dark mode
    },
  },

  // Neutral colors - Gray scale system
  neutral: {
    light: {
      50: '#F9FAFB', // lightest background
      100: '#F3F4F6', // card backgrounds
      200: '#E5E7EB', // borders, dividers
      300: '#D1D5DB', // disabled states
      400: '#9CA3AF', // placeholder text
      500: '#6B7280', // secondary text
      600: '#4B5563', // primary text (light mode)
      700: '#374151', // headings (light mode)
      800: '#1F2937', // dark surfaces
      900: '#111827', // darkest text
    },
    dark: {
      50: '#18181B', // darkest background (dark mode)
      100: '#27272A', // card backgrounds (dark mode)
      200: '#3F3F46', // borders (dark mode)
      300: '#52525B', // disabled (dark mode)
      400: '#71717A', // placeholder (dark mode)
      500: '#A1A1AA', // secondary text (dark mode)
      600: '#D4D4D8', // primary text (dark mode)
      700: '#E4E4E7', // headings (dark mode)
      800: '#F4F4F5', // light surfaces in dark mode
      900: '#FAFAFA', // lightest text (dark mode)
    },
  },

  // Semantic status colors
  semantic: {
    success: '#10B981', // Green for success states
    warning: '#F59E0B', // Amber for warnings
    error: '#EF4444', // Red for errors
    info: '#3B82F6', // Blue for info
    // Truck-specific semantics
    fuel: '#F59E0B', // Amber for fuel-related
    maintenance: '#EF4444', // Red for maintenance alerts
    route: '#3B82F6', // Blue for route/navigation
    cargo: '#8B5CF6', // Purple for cargo/inventory
  },

  // Pure colors
  pure: {
    white: '#f8edd9',
    black: '#0b1215',
  },
};

// Typography system
const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: moderateScale(12), // captions, small labels
    sm: moderateScale(14), // body text small
    md: moderateScale(16), // body text default
    lg: moderateScale(18), // subheaders
    xl: moderateScale(20), // headers
    xxl: moderateScale(24), // large headers
    xxxl: moderateScale(32), // hero text
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Spacing system (8pt grid)
const SPACING = {
  xs: moderateScale(4), // 4pt
  sm: moderateScale(8), // 8pt
  md: moderateScale(16), // 16pt
  lg: moderateScale(24), // 24pt
  xl: moderateScale(32), // 32pt
  xxl: moderateScale(48), // 48pt
  xxxl: moderateScale(64), // 64pt
};

// Border radius system
const BORDER_RADIUS = {
  none: 0,
  xs: moderateScale(2),
  sm: moderateScale(4),
  md: moderateScale(8),
  lg: moderateScale(12),
  xl: moderateScale(16),
  xxl: moderateScale(24),
  round: 9999,
  circle: (size: number) => size / 2, // Function for perfect circles
};

// Elevation/Shadow system
const SHADOW_LIGHT: Record<string, ShadowProps> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: COLORS.pure.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: COLORS.pure.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: COLORS.pure.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  xl: {
    shadowColor: COLORS.pure.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
  },
};

const SHADOW_DARK: Record<string, ShadowProps> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: COLORS.pure.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: COLORS.pure.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: COLORS.pure.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 6,
  },
  xl: {
    shadowColor: COLORS.pure.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 12,
  },
};

// Clean theme interface
export interface ThemeStyles {
  colors: {
    // Brand colors
    primary: string;
    primaryVariant: string;

    // Backgrounds
    background: string;
    surface: string;
    surfaceVariant: string;

    // Text colors
    onBackground: string;
    onSurface: string;
    onSurfaceVariant: string;

    // Interactive elements
    border: string;
    borderVariant: string;

    // Semantic colors
    success: string;
    warning: string;
    error: string;
    info: string;

    // Truck-specific
    fuel: string;
    maintenance: string;
    route: string;
    cargo: string;

    // Pure colors
    white: string;
    black: string;
  };
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  borderRadius: typeof BORDER_RADIUS;
  shadow: Record<string, ShadowProps>;
}

// Theme generator - SEMANTIC MAPPING
export const getThemeStyles = (theme: ThemeType): ThemeStyles => {
  const isDark = theme === 'dark';

  return {
    colors: {
      // Brand colors
      primary: isDark ? COLORS.brand.primary.dark : COLORS.brand.primary.light,
      primaryVariant: isDark ? COLORS.brand.secondary.dark : COLORS.brand.secondary.light,

      // Backgrounds (semantic naming)
      background: isDark ? COLORS.neutral.dark[50] : COLORS.pure.white,
      surface: isDark ? COLORS.neutral.dark[100] : COLORS.neutral.light[50],
      surfaceVariant: isDark ? COLORS.neutral.dark[200] : COLORS.neutral.light[100],

      // Text colors (semantic naming)
      onBackground: isDark ? COLORS.neutral.dark[700] : COLORS.neutral.light[900],
      onSurface: isDark ? COLORS.neutral.dark[600] : COLORS.neutral.light[700],
      onSurfaceVariant: isDark ? COLORS.neutral.dark[500] : COLORS.neutral.light[500],

      // Interactive elements
      border: isDark ? COLORS.neutral.dark[200] : COLORS.neutral.light[200],
      borderVariant: isDark ? COLORS.neutral.dark[300] : COLORS.neutral.light[300],

      // Semantic status colors
      success: COLORS.semantic.success,
      warning: COLORS.semantic.warning,
      error: COLORS.semantic.error,
      info: COLORS.semantic.info,

      // Truck-specific semantic colors
      fuel: COLORS.semantic.fuel,
      maintenance: COLORS.semantic.maintenance,
      route: COLORS.semantic.route,
      cargo: COLORS.semantic.cargo,

      // Pure colors
      white: COLORS.pure.white,
      black: COLORS.pure.black,
    },
    typography: TYPOGRAPHY,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    shadow: isDark ? SHADOW_DARK : SHADOW_LIGHT,
  };
};

// Export utilities
export { horizontalScale, moderateScale, verticalScale, windowHeight, windowWidth };
