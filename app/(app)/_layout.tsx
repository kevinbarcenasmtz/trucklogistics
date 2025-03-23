// app/(app)/_layout.tsx
import { Tabs } from 'expo-router';
import { Image, View, Pressable, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, verticalScale, moderateScale, horizontalScale } from '@/src/theme';
import TabBarIcon from '@/src/components/tabbaricon';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  // Define the tab bar background color based on theme
  const tabBarBackgroundColor = isDarkTheme 
    ? themeStyles.colors.black_grey 
    : themeStyles.colors.white;
  
  // Define the tab bar border color based on theme
  const tabBarBorderColor = isDarkTheme
    ? themeStyles.colors.darkGrey
    : themeStyles.colors.border;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBarBackgroundColor,
          height: verticalScale(90),
          paddingTop: themeStyles.spacing.xs,
          paddingBottom: verticalScale(22),
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 1,
          borderTopColor: tabBarBorderColor,
          ...Platform.select({
            ios: {
              shadowColor: themeStyles.colors.black,
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: isDarkTheme ? 0.3 : 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: themeStyles.colors.greenThemeColor,
        tabBarInactiveTintColor: isDarkTheme 
          ? themeStyles.colors.grey 
          : themeStyles.colors.text.secondary,
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
                tintColor: isDarkTheme 
                  ? themeStyles.colors.white 
                  : themeStyles.colors.text.primary
              }}
            />
          ),
          tabBarButton: (props) => (
            <Pressable
              style={({ pressed }) => [
                styles.cameraButton,
                {
                  top: verticalScale(-30),
                },
                pressed && styles.cameraButtonPressed
              ]}
              onPress={props.onPress}
              accessibilityLabel={t('camera')}
            >
              <View style={[
                styles.cameraButtonInner,
                {
                  backgroundColor: themeStyles.colors.greenThemeColor,
                  ...Platform.select({
                    ios: {
                      shadowColor: themeStyles.colors.black,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 5,
                    },
                    android: {
                      elevation: 8,
                    },
                  })
                }
              ]}>
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

const styles = StyleSheet.create({
  cameraButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: moderateScale(80),
    width: moderateScale(80),
  },
  cameraButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cameraButtonInner: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(32),
    justifyContent: 'center',
    alignItems: 'center',
  }
});