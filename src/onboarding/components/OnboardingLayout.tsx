// src/onboarding/components/OnboardingLayout.tsx - CLEANED UP VERSION
import { useTheme } from '@/src/context/ThemeContext';
import { useAppTheme } from '@/src/hooks/useOnboardingTheme'; // ✅ NEW IMPORT
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

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
  showProgress = true,
}) => {
  const { isDarkTheme } = useTheme();
  const { backgroundColor, themeStyles } = useAppTheme(); // ✅ REPLACES 6 LINES

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
                backgroundColor:
                  index <= stepIndex
                    ? themeStyles.colors.greenThemeColor
                    : isDarkTheme
                      ? themeStyles.colors.grey
                      : '#E0E0E0',
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {renderProgressDots()}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
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
