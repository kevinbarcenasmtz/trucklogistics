// src/components/forms/FormInput.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { AntDesign } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

interface FormInputProps extends TextInputProps {
  labelValue?: string;
  placeholderText?: string;
  iconType: keyof typeof AntDesign.glyphMap;
}

const FormInput: React.FC<FormInputProps> = ({
  labelValue,
  placeholderText,
  iconType,
  ...rest
}) => {
  const { inputBackground, textPrimary, textSecondary, borderDefault, isDarkTheme } = useAppTheme();

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
        <AntDesign name={iconType} size={moderateScale(25)} color={textSecondary} />
      </View>
      <TextInput
        value={labelValue}
        style={[
          styles.input,
          {
            paddingHorizontal: moderateScale(16),
            fontSize: moderateScale(16),
            color: textPrimary,
          },
        ]}
        numberOfLines={1}
        placeholder={placeholderText}
        placeholderTextColor={isDarkTheme ? '#999' : '#666'}
        {...rest}
      />
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
});

export default FormInput;
