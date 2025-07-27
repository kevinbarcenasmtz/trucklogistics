// src/components/TabBarIcon.tsx
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

interface TabBarIconProps {
  focused: boolean;
  name: string;
  iconSource: any;
  size?: number;
}

export const TabBarIcon = ({
  focused,
  name,
  iconSource,
  size = moderateScale(26),
}: TabBarIconProps) => {
  const { themeStyles } = useAppTheme();

  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
      <Image
        source={iconSource}
        style={[
          styles.tabIcon,
          {
            width: size,
            height: size,
            tintColor: focused ? themeStyles.colors.primary : themeStyles.colors.gray.medium,
            opacity: focused ? 1 : 0.8,
          },
        ]}
      />
      <Text
        style={[
          styles.tabLabel,
          {
            color: focused ? themeStyles.colors.primary : themeStyles.colors.gray.light,
          },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
        maxFontSizeMultiplier={1}
      >
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: verticalScale(12),
    gap: verticalScale(6),
    width: horizontalScale(50),
    height: verticalScale(45),
  },
  tabIconContainerActive: {
    transform: [{ scale: 1.1 }],
  },
  tabIcon: {
    // Base styling - color and opacity now applied inline
  },
  tabLabel: {
    fontSize: moderateScale(9),
    marginTop: verticalScale(2),
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: moderateScale(11),
    maxWidth: '100%',
    // Color applied inline
  },
});

export default TabBarIcon;
