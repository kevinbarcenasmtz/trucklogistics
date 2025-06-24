import { useAppTheme } from '@/src/hooks/useAppTheme';
import { moderateScale, windowHeight } from '@/src/theme';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

interface SocialButtonProps extends TouchableOpacityProps {
  buttonTitle: string;
  btnType: 'google' | keyof typeof FontAwesome.glyphMap;
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
  const { themeStyles } = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.buttonContainer,
        {
          backgroundColor,
          marginTop: themeStyles.spacing.sm,
          height: windowHeight / 15,
          padding: themeStyles.spacing.md,
          borderRadius: themeStyles.borderRadius.md,
        },
      ]}
      {...rest}
    >
      {/* Icon on the left */}
      <View style={styles.iconWrapper}>
        {btnType === 'google' ? (
          <Text style={[styles.googleIcon, { color }]}>G</Text>
        ) : (
          <FontAwesome name={btnType} size={20} color={color} />
        )}
      </View>

      {/* Text in the center */}
      <View style={styles.textWrapper}>
        <Text
          style={[
            styles.buttonText,
            {
              color,
              fontSize: themeStyles.typography.fontSize.md,
            },
          ]}
        >
          {buttonTitle}
        </Text>
      </View>

      {/* Empty spacer on the right for balance */}
      <View style={styles.spacer} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(-40),
  },
  spacer: {
    width: moderateScale(40),
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SocialButton;
