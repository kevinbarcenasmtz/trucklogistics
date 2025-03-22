// app/(app)/_layout.tsx
import { Tabs } from 'expo-router';
import { Image, View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, verticalScale, moderateScale } from '@/src/theme';
import TabBarIcon from '@/src/components/tabbaricon';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: themeStyles.colors.black_grey,
          height: verticalScale(90),
          paddingTop: themeStyles.spacing.xs,
          paddingBottom: verticalScale(22),
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 2,
          borderTopColor: themeStyles.colors.darkGrey,
          ...themeStyles.shadow.md
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon 
              focused={focused}
              name={t('home')}
              iconSource={require('../../assets/icons/home.png')}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon 
              focused={focused}
              name={t('reports')}
              iconSource={require('../../assets/icons/document-signed.png')}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="camera"
        options={{
          tabBarIcon: () => (
            <Image
              source={require('../../assets/icons/camera.png')}
              style={{
                width: moderateScale(32),
                height: moderateScale(32),
                tintColor: themeStyles.colors.text.primary
              }}
            />
          ),
          tabBarButton: (props) => (
            <Pressable
              style={({ pressed }) => [
                {
                  top: verticalScale(-30),
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: moderateScale(80),
                  width: moderateScale(80),
                },
                pressed && {
                  opacity: 0.9,
                  transform: [{ scale: 0.98 }],
                }
              ]}
              onPress={props.onPress}
            >
              <View style={{
                width: moderateScale(64),
                height: moderateScale(64),
                borderRadius: moderateScale(32),
                backgroundColor: themeStyles.colors.greenThemeColor,
                justifyContent: 'center',
                alignItems: 'center',
                ...themeStyles.shadow.md
              }}>
                {props.children}
              </View>
            </Pressable>
          ),
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon 
              focused={focused}
              name={t('stats')}
              iconSource={require('../../assets/icons/stats.png')}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon 
              focused={focused}
              name={t('settings')}
              iconSource={require('../../assets/icons/settings-sliders.png')}
            />
          ),
        }}
      />
    </Tabs>
  );
}