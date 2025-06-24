// src/components/forms/FormButton.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { verticalScale } from '@/src/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface FormButtonProps extends TouchableOpacityProps {
  buttonTitle: string;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;
}

const FormButton: React.FC<FormButtonProps> = ({
  buttonTitle,
  backgroundColor,
  textColor,
  disabled = false,
  style,
  ...rest
}) => {
  const { themeStyles, buttonPrimaryBg } = useAppTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.buttonContainer,
        {
          height: verticalScale(50),
          backgroundColor: backgroundColor || buttonPrimaryBg,
          borderRadius: themeStyles.borderRadius.md,
          marginVertical: themeStyles.spacing.md,
        },
        style,
      ]}
      disabled={disabled}
      activeOpacity={0.7}
      {...rest}
    >
      <Text
        style={[
          styles.buttonText,
          {
            fontSize: themeStyles.typography.fontSize.md,
            color: textColor || '#FFFFFF',
          },
        ]}
      >
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