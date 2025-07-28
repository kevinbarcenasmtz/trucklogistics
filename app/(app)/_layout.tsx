// app/(app)/_layout.tsx
import TabBarIcon from '@/src/components/tabbaricon';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { moderateScale, verticalScale } from '@/src/theme';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const { t } = useTranslation();
  const {
    surfaceColor,
    secondaryTextColor,
    primaryColor,
    borderColor,
    themeStyles,
    isDarkTheme,
    backgroundColor,
  } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: surfaceColor,
          height: verticalScale(90),
          paddingTop: themeStyles.spacing.xs,
          paddingBottom: verticalScale(22),
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 1,
          borderTopColor: borderColor,
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
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: secondaryTextColor,
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
                tintColor: backgroundColor,
              }}
            />
          ),
          tabBarButton: props => (
            <Pressable
              style={({ pressed }) => [
                styles.cameraButton,
                {
                  top: verticalScale(-30),
                },
                pressed && styles.cameraButtonPressed,
              ]}
              onPress={props.onPress}
              accessibilityLabel={t('camera')}
            >
              <View
                style={[
                  styles.cameraButtonInner,
                  {
                    backgroundColor: primaryColor,
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
                    }),
                  },
                ]}
              >
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
  },
});
