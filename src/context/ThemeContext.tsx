import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme types
export type ThemeType = 'light' | 'dark';
export type ThemePreference = ThemeType | 'system';

// Theme context type
interface ThemeContextType {
  theme: ThemeType;
  themePreference: ThemePreference;
  isSystemTheme: boolean;
  isDarkTheme: boolean;
  setTheme: (theme: ThemePreference) => Promise<void>;
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

  // Get effective theme (actual theme to apply)
  const effectiveTheme: ThemeType = themePreference === THEME_SYSTEM 
    ? (colorScheme === 'dark' ? THEME_DARK : THEME_LIGHT)
    : themePreference;

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async (): Promise<void> => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === THEME_LIGHT || savedTheme === THEME_DARK || savedTheme === THEME_SYSTEM) {
          setThemePreference(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
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

  // Save theme preference when it changes
  // Inside ThemeContext.tsx - modify the setTheme function
  const setTheme = async (newTheme: ThemePreference): Promise<void> => {
    try {
      
      // Save to storage first
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      
      // Update state
      setThemePreference(newTheme);
      
      // Apply to native elements
      if (newTheme !== THEME_SYSTEM) {
        Appearance.setColorScheme(newTheme);
      } else {
        Appearance.setColorScheme(null); // Reset to system
      }
      
      // On iOS, the colorScheme doesn't update immediately
      // so we still need to rely on our own state
    } catch (error) {
    }
  };

  // Context value
  const value: ThemeContextType = {
    theme: effectiveTheme,
    themePreference,
    isSystemTheme: themePreference === THEME_SYSTEM,
    isDarkTheme: effectiveTheme === THEME_DARK,
    setTheme,
    themeConstants: {
      THEME_SYSTEM,
      THEME_LIGHT,
      THEME_DARK
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook for using theme
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}