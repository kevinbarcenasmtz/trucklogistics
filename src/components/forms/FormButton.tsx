// src/components/forms/FormButton.tsx (Updated)
import React from 'react';
import { Text, TouchableOpacity, StyleSheet, TouchableOpacityProps } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, verticalScale } from '@/src/theme';

interface FormButtonProps extends TouchableOpacityProps {
  buttonTitle: string;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;
}

const FormButton: React.FC<FormButtonProps> = ({
  buttonTitle,
  backgroundColor = '#004d40', // Default to your app's green
  textColor = '#FFFFFF', // Default to white
  disabled = false,
  style,
  ...rest
}) => {
  const themeStyles = getThemeStyles(useTheme().theme);
  
  return (
    <TouchableOpacity
      style={[
        styles.buttonContainer,
        {
          height: verticalScale(50),
          backgroundColor,
          borderRadius: themeStyles.borderRadius.md,
          marginVertical: themeStyles.spacing.md,
        },
        style // Apply custom styles last
      ]}
      disabled={disabled}
      activeOpacity={0.7}
      {...rest}
    >
      <Text style={[
        styles.buttonText,
        {
          fontSize: themeStyles.typography.fontSize.md,
          color: textColor, // Always use the provided textColor
        }
      ]}>
        {buttonTitle}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default FormButton;