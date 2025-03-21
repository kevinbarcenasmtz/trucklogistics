// src/components/forms/FormInput.tsx
import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from '@/src/theme';
import { AntDesign } from '@expo/vector-icons';

interface FormInputProps extends TextInputProps {
  labelValue?: string;
  placeholderText?: string;
  iconType: keyof typeof AntDesign.glyphMap; // Ensures only valid AntDesign icon names are used
}

const FormInput: React.FC<FormInputProps> = ({
  labelValue,
  placeholderText,
  iconType,
  ...rest
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';
  
  return (
    <View style={[
      styles.inputContainer,
      {
        marginVertical: themeStyles.spacing.sm,
        height: verticalScale(50),
        borderRadius: themeStyles.borderRadius.md,
        // Use theme-aware background color instead of hardcoded white
        backgroundColor: isDarkTheme ? themeStyles.colors.surface : '#FFFFFF',
        ...themeStyles.shadow.sm
      }
    ]}>
      <View style={[
        styles.iconStyle,
        {
          padding: themeStyles.spacing.sm,
          // Use theme-aware border color
          borderRightColor: isDarkTheme ? themeStyles.colors.border : '#f3f3ec',
          width: horizontalScale(50),
        }
      ]}>
        <AntDesign 
          name={iconType} 
          size={moderateScale(25)} 
          color={themeStyles.colors.text.secondary} 
        />
      </View>
      <TextInput
        value={labelValue}
        style={[
          styles.input,
          {
            paddingHorizontal: themeStyles.spacing.md,
            fontSize: themeStyles.typography.fontSize.md,
            // Use theme-aware text color
            color: themeStyles.colors.text.primary,
          }
        ]}
        numberOfLines={1}
        placeholder={placeholderText}
        // Use theme-aware placeholder color
        placeholderTextColor={isDarkTheme ? "#999" : "#666"}
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