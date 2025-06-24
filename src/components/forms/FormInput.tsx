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
  const { 
    themeStyles, 
    surfaceColor, 
    textColor, 
    secondaryTextColor, 
    borderColor,
    isDarkTheme 
  } = useAppTheme();

  return (
    <View
      style={[
        styles.inputContainer,
        {
          marginVertical: themeStyles.spacing.sm,
          height: verticalScale(50),
          borderRadius: themeStyles.borderRadius.md,
          backgroundColor: surfaceColor,
          ...themeStyles.shadow.sm,
        },
      ]}
    >
      <View
        style={[
          styles.iconStyle,
          {
            padding: themeStyles.spacing.sm,
            borderRightColor: borderColor,
            width: horizontalScale(50),
          },
        ]}
      >
        <AntDesign
          name={iconType}
          size={moderateScale(25)}
          color={secondaryTextColor}
        />
      </View>
      <TextInput
        value={labelValue}
        style={[
          styles.input,
          {
            paddingHorizontal: themeStyles.spacing.md,
            fontSize: themeStyles.typography.fontSize.md,
            color: textColor,
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