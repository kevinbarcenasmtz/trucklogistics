// src/onboarding/components/OnboardingLayout.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

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
  const { backgroundColor, primaryColor, borderColor } = useAppTheme();

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
                backgroundColor: index <= stepIndex ? primaryColor : borderColor,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {renderProgressDots()}
      <View style={styles.content}>{children}</View>
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
