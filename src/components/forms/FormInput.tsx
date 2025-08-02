// src/components/forms/FormInput.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

interface FormInputProps extends TextInputProps {
  labelValue?: string;
  placeholderText?: string;
  iconType: keyof typeof Feather.glyphMap;
  showPasswordToggle?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  labelValue,
  placeholderText,
  iconType,
  showPasswordToggle = false,
  secureTextEntry = false,
  ...rest
}) => {
  const { inputBackground, textPrimary, textSecondary, borderDefault, isDarkTheme } = useAppTheme();
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const shouldSecureText = showPasswordToggle ? !isPasswordVisible : secureTextEntry;
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View
      style={[
        styles.inputContainer,
        {
          marginVertical: moderateScale(8),
          height: verticalScale(50),
          borderRadius: moderateScale(8),
          backgroundColor: inputBackground,
        },
      ]}
    >
      {/* Left Icon */}
      <View
        style={[
          styles.iconStyle,
          {
            padding: moderateScale(8),
            borderRightColor: borderDefault,
            width: horizontalScale(50),
          },
        ]}
      >
        <Feather name={iconType} size={moderateScale(22)} color={textSecondary} />
      </View>
      
      {/* Text Input */}
      <TextInput
        value={labelValue}
        style={[
          styles.input,
          {
            paddingHorizontal: moderateScale(16),
            fontSize: moderateScale(16),
            color: textPrimary,
            paddingRight: showPasswordToggle ? moderateScale(50) : moderateScale(16),
          },
        ]}
        numberOfLines={1}
        placeholder={placeholderText}
        placeholderTextColor={isDarkTheme ? '#999' : '#666'}
        secureTextEntry={shouldSecureText}
        {...rest}
      />
      
      {/* Password Toggle Button */}
      {showPasswordToggle && (
        <TouchableOpacity
          style={[
            styles.passwordToggle,
            {
              width: horizontalScale(50),
              borderLeftColor: borderDefault,
            },
          ]}
          onPress={togglePasswordVisibility}
          activeOpacity={0.7}
        >
          <Feather
            name={isPasswordVisible ? 'eye-off' : 'eye'}
            size={moderateScale(20)}
            color={textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconStyle: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  input: {
    flex: 1,
  },
  passwordToggle: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
  },
});

export default FormInput;