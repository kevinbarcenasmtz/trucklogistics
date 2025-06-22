// src/onboarding/components/OnboardingLayout.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native'; // Remove SafeAreaView import
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, verticalScale, horizontalScale, moderateScale } from '@/src/theme';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  stepIndex: number;
  totalSteps: number;
  showProgress?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  stepIndex,
  totalSteps,
  showProgress = true
}) => {
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  const getBackgroundColor = () => isDarkTheme 
    ? themeStyles.colors.black_grey 
    : themeStyles.colors.background;

  const getTextColor = () => isDarkTheme 
    ? themeStyles.colors.white 
    : themeStyles.colors.text.primary;

  const renderProgressDots = () => {
    if (!showProgress) return null;

    return (
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor: index <= stepIndex 
                  ? themeStyles.colors.greenThemeColor 
                  : isDarkTheme ? themeStyles.colors.grey : '#E0E0E0'
              }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[  // Changed from SafeAreaView to View
      styles.container,
      { backgroundColor: getBackgroundColor() }
    ]}>
      {renderProgressDots()}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(20),
    gap: horizontalScale(8),
  },
  progressDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  content: {
    flex: 1,
  },
});