// src/components/forms/FormButton.tsx
import React from 'react';
import { Text, TouchableOpacity, StyleSheet, TouchableOpacityProps } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, verticalScale, moderateScale } from '@/src/theme';

interface FormButtonProps extends TouchableOpacityProps {
  buttonTitle: string;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;
}

const FormButton: React.FC<FormButtonProps> = ({
  buttonTitle,
  backgroundColor,
  textColor = '#ffffff', // Default to white
  disabled = false,
  ...rest
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  return (
    <TouchableOpacity
      style={[
        styles.buttonContainer,
        {
          marginVertical: themeStyles.spacing.md,
          height: verticalScale(50),
          backgroundColor: backgroundColor || themeStyles.colors.primary,
          borderRadius: themeStyles.borderRadius.md,
          ...themeStyles.shadow.md
        }
      ]}
      {...rest}
    >
      <Text style={[
        styles.buttonText,
        {
          fontSize: themeStyles.typography.fontSize.md,
          color: textColor,
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