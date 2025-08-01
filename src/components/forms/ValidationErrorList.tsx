// src/components/forms/ValidationErrorList.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ValidationErrorListProps {
  errors: string[];
  hasPasswordErrors?: boolean;
  style?: any;
}

export const ValidationErrorList: React.FC<ValidationErrorListProps> = ({
  errors,
  hasPasswordErrors = false,
  style,
}) => {
  const { error, warning } = useAppTheme();

  if (errors.length === 0) return null;

  // Use warning color for password requirements, error for other issues
  const iconColor = hasPasswordErrors && errors.length === 1 ? warning : error;
  const backgroundColor = hasPasswordErrors && errors.length === 1 ? warning + '10' : error + '10';

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <View style={styles.iconContainer}>
        <Feather
          name={hasPasswordErrors && errors.length === 1 ? 'info' : 'alert-circle'}
          size={16}
          color={iconColor}
        />
      </View>
      <View style={styles.errorContent}>
        {errors.map((errorText, index) => (
          <Text key={index} style={[styles.errorText, { color: iconColor }]}>
            {errors.length === 1 ? errorText : `• ${errorText}`}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    minHeight: moderateScale(40),
  },
  iconContainer: {
    marginRight: horizontalScale(8),
    paddingTop: moderateScale(2),
  },
  errorContent: {
    flex: 1,
    gap: verticalScale(2),
  },
  errorText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
});

export default ValidationErrorList;
