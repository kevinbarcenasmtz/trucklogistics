// src/components/forms/SocialButton.tsx
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, moderateScale, windowHeight } from '@/src/theme';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

interface SocialButtonProps extends TouchableOpacityProps {
  buttonTitle: string;
  btnType: keyof typeof FontAwesome.glyphMap; // Ensures only valid FontAwesome icons
  color: string;
  backgroundColor: string;
}

const SocialButton: React.FC<SocialButtonProps> = ({
  buttonTitle,
  btnType,
  color,
  backgroundColor,
  ...rest
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  return (
    <TouchableOpacity
      style={[
        styles.buttonContainer,
        {
          backgroundColor,
          marginTop: themeStyles.spacing.sm,
          height: windowHeight / 15,
          padding: themeStyles.spacing.sm,
          borderRadius: themeStyles.borderRadius.sm,
        },
      ]}
      {...rest}
    >
      <View style={[styles.iconWrapper, { width: moderateScale(30) }]}>
        <FontAwesome name={btnType} style={styles.icon} size={22} color={color} />
      </View>
      <View style={styles.btnTxtWrapper}>
        <Text
          style={[
            styles.buttonText,
            {
              color,
              fontSize: themeStyles.typography.fontSize.md, // Fixed: use correct typography path
            },
          ]}
        >
          {buttonTitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontWeight: 'bold',
  },
  btnTxtWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
  },
});

export default SocialButton;
