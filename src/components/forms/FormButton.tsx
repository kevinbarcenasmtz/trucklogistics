// src/components/forms/FormButton.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { moderateScale, verticalScale } from '@/src/theme';
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
  const { primary, white, textSecondary } = useAppTheme();

  // Calculate disabled styles
  const buttonBackgroundColor = backgroundColor || primary;
  const buttonTextColor = textColor || white;

  return (
    <TouchableOpacity
      style={[
        styles.buttonContainer,
        {
          height: verticalScale(50),
          backgroundColor: disabled ? buttonBackgroundColor + '40' : buttonBackgroundColor,
          borderRadius: moderateScale(8),
          marginVertical: moderateScale(16),
          opacity: disabled ? 0.6 : 1.0,
        },
        style,
      ]}
      disabled={disabled}
      activeOpacity={disabled ? 1.0 : 0.7}
      {...rest}
    >
      <Text
        style={[
          styles.buttonText,
          {
            fontSize: moderateScale(16),
            color: disabled ? textSecondary : buttonTextColor,
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
