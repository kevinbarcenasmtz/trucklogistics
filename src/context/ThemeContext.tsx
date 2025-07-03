// src/context/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

// Theme types
export type ThemeType = 'light' | 'dark';
export type ThemePreference = ThemeType | 'system';

// Enhanced theme context type with error handling
interface ThemeContextType {
  theme: ThemeType;
  themePreference: ThemePreference;
  isSystemTheme: boolean;
  isDarkTheme: boolean;
  setTheme: (theme: ThemePreference) => Promise<boolean>;
  isChangingTheme: boolean;
  themeConstants: {
    THEME_SYSTEM: 'system';
    THEME_LIGHT: 'light';
    THEME_DARK: 'dark';
  };
}

// Theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme constants
const THEME_STORAGE_KEY = 'trucklogistics_theme';
const THEME_SYSTEM: 'system' = 'system';
const THEME_LIGHT: 'light' = 'light';
const THEME_DARK: 'dark' = 'dark';

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component
export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  // Initialize state
  const [themePreference, setThemePreference] = useState<ThemePreference>(THEME_SYSTEM);
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
  const [isChangingTheme, setIsChangingTheme] = useState(false); //   Loading state

  // Get effective theme (actual theme to apply)
  const effectiveTheme: ThemeType =
    themePreference === THEME_SYSTEM
      ? colorScheme === 'dark'
        ? THEME_DARK
        : THEME_LIGHT
      : themePreference;

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async (): Promise<void> => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (
          savedTheme === THEME_LIGHT ||
          savedTheme === THEME_DARK ||
          savedTheme === THEME_SYSTEM
        ) {
          setThemePreference(savedTheme);
        } else {
          console.log('No valid saved theme, keeping system');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        setThemePreference(THEME_SYSTEM);
      }
    };

    loadThemePreference();
  }, []);

  // Set up appearance change listener
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      setColorScheme(newColorScheme);
    });

    return () => subscription.remove();
  }, []);

  //   FIXED: Proper error handling and return success status
  const setTheme = async (newTheme: ThemePreference): Promise<boolean> => {
    setIsChangingTheme(true);

    try {
      // Save to storage first
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);

      // Update state only after successful storage
      setThemePreference(newTheme);

      console.log(`Theme changed to: ${newTheme}`);
      return true; // Success
    } catch (error) {
      // PROPER ERROR HANDLING: Log error and provide user feedback
      console.error('Failed to save theme preference:', error);

      //   You could add user-facing error handling here:
      // Alert.alert('Theme Error', 'Failed to save theme preference. Please try again.');

      return false; //   Failure
    } finally {
      setIsChangingTheme(false);
    }
  };

  // Context value
  const value: ThemeContextType = {
    theme: effectiveTheme,
    themePreference,
    isSystemTheme: themePreference === THEME_SYSTEM,
    isDarkTheme: effectiveTheme === THEME_DARK,
    setTheme,
    isChangingTheme, //   Expose loading state
    themeConstants: {
      THEME_SYSTEM,
      THEME_LIGHT,
      THEME_DARK,
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Hook for using theme
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
