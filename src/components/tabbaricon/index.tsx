// src/components/tabbaricon.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Image, StyleSheet, Text, View } from 'react-native';

interface TabBarIconProps {
  focused: boolean;
  name: string;
  iconSource: any;
}

export default function TabBarIcon({ focused, name, iconSource }: TabBarIconProps) {
  const { primary, textSecondary } = useAppTheme();

  return (
    <View style={styles.container}>
      <Image
        source={iconSource}
        style={[
          styles.icon,
          {
            // Theme-reactive tint color
            tintColor: focused ? primary : textSecondary,
          },
        ]}
      />
      <Text
        style={[
          styles.label,
          {
            // Theme-reactive text color
            color: focused ? primary : textSecondary,
          },
        ]}
      >
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});
