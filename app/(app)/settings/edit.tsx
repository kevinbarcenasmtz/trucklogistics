// app/(app)/settings/edit.tsx
import FormButton from '@/src/components/forms/FormButton';
import { useAuth } from '@/src/context/AuthContextMigration';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { Feather, FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface UserData {
  fname: string;
  lname: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  state: string;
}

export default function EditScreen() {
  const router = useRouter();
  const { user, userData: initialUserData, updateUserData } = useAuth(); // Add updateUserData
  const { t } = useTranslation();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  const [userData, setUserData] = useState<UserData>({
    fname: '',
    lname: '',
    phone: '',
    email: '',
    country: '',
    city: '',
    state: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialUserData && user) {
      setUserData({
        fname: initialUserData.fname || '',
        lname: initialUserData.lname || '',
        phone: initialUserData.phone || '',
        email: user.email || '',
        country: initialUserData.country || '',
        city: initialUserData.city || '',
        state: initialUserData.state || '',
      });
    }
  }, [initialUserData, user]);

  const handleUpdate = async () => {
    if (!user || !userData) return;

    await Haptics.selectionAsync();
    setIsSaving(true);

    try {
      // Actually call the updateUserData function
      await updateUserData({
        fname: userData.fname,
        lname: userData.lname,
        phone: userData.phone,
        country: userData.country,
        city: userData.city,
        state: userData.state,
        // Don't update email in profile updates
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        t('success', 'Success'),
        t('profileUpdated', 'Your profile has been updated successfully.')
      );
      router.back();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t('error', 'Error'),
        error.message || t('updateFailed', 'Failed to update profile. Please try again.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderAvatar = () => {
    if (userData?.fname && userData?.lname) {
      const initials = `${userData.fname[0]}${userData.lname[0]}`.toUpperCase();
      return (
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: themeStyles.colors.greenThemeColor,
              ...Platform.select({
                ios: {
                  shadowColor: themeStyles.colors.black,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                },
                android: {
                  elevation: 5,
                },
              }),
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: themeStyles.colors.white }]}>{initials}</Text>
        </View>
      );
    }
    return (
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: themeStyles.colors.greenThemeColor,
            ...Platform.select({
              ios: {
                shadowColor: themeStyles.colors.black,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              },
              android: {
                elevation: 5,
              },
            }),
          },
        ]}
      >
        <Text style={[styles.avatarText, { color: themeStyles.colors.white }]}>JD</Text>
      </View>
    );
  };

  // Get background color based on theme
  const getBackgroundColor = () =>
    isDarkTheme ? themeStyles.colors.black_grey : themeStyles.colors.background;

  // Get input background color based on theme
  const getInputBackgroundColor = () =>
    isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.surface;

  // Get text color based on theme
  const getTextColor = () =>
    isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary;

  // Get secondary text color based on theme
  const getSecondaryTextColor = () =>
    isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.secondary;

  // Get icon color based on theme
  const getIconColor = () => (isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.primary);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeStyles.colors.greenThemeColor} />
        </View>
      </SafeAreaView>
    );
  }

  // Define input field configurations
  const inputFields = [
    {
      key: 'fname',
      icon: 'user-o' as const,
      iconComponent: FontAwesome,
      placeholder: t('firstName'),
      autoCapitalize: 'words' as const,
    },
    {
      key: 'lname',
      icon: 'user-o' as const,
      iconComponent: FontAwesome,
      placeholder: t('lastName'),
      autoCapitalize: 'words' as const,
    },
    {
      key: 'phone',
      icon: 'phone' as const,
      iconComponent: FontAwesome,
      placeholder: t('phone'),
      keyboardType: 'phone-pad' as const,
    },
    {
      key: 'email',
      icon: 'envelope-o' as const,
      iconComponent: FontAwesome,
      placeholder: t('email'),
      keyboardType: 'email-address' as const,
      autoCapitalize: 'none' as const,
    },
    {
      key: 'country',
      icon: 'globe' as const,
      iconComponent: FontAwesome,
      placeholder: t('country'),
      autoCapitalize: 'words' as const,
    },
    {
      key: 'city',
      icon: 'map-pin' as const,
      iconComponent: Feather,
      placeholder: t('city'),
      autoCapitalize: 'words' as const,
    },
    {
      key: 'state',
      icon: 'map' as const,
      iconComponent: Feather,
      placeholder: t('state'),
      autoCapitalize: 'words' as const,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
        <Feather name="arrow-left" size={25} color={getTextColor()} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          <View style={styles.profileSection}>
            <View style={styles.imageContainer}>{renderAvatar()}</View>
            <Text style={[styles.userName, { color: getTextColor() }]}>
              {userData ? `${userData.fname || ''} ${userData.lname || ''}` : ''}
            </Text>
          </View>

          {inputFields.map((field, index) => {
            const IconComponent = field.iconComponent;
            return (
              <View
                key={field.key}
                style={[
                  styles.action,
                  {
                    backgroundColor: getInputBackgroundColor(),
                    ...Platform.select({
                      ios: {
                        shadowColor: themeStyles.colors.black,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isDarkTheme ? 0.3 : 0.1,
                        shadowRadius: 2,
                      },
                      android: {
                        elevation: 2,
                      },
                    }),
                  },
                ]}
              >
                <IconComponent name={field.icon} size={20} color={getIconColor()} />
                <TextInput
                  placeholder={field.placeholder}
                  placeholderTextColor={getSecondaryTextColor()}
                  value={userData[field.key as keyof UserData]} // Dynamic value
                  onChangeText={text => setUserData(prev => ({ ...prev, [field.key]: text }))} // Dynamic key
                  style={[styles.textInput, { color: getTextColor() }]}
                  autoCapitalize={field.autoCapitalize}
                  keyboardType={field.keyboardType}
                  editable={!isSaving && field.key !== 'email'} // Disable email editing
                />
              </View>
            );
          })}

          <FormButton
            buttonTitle={isSaving ? t('updating', 'Updating...') : t('update')}
            onPress={handleUpdate}
            disabled={isSaving}
            backgroundColor={themeStyles.colors.greenThemeColor}
            textColor={themeStyles.colors.white}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    padding: horizontalScale(24),
    paddingBottom: verticalScale(48),
  },
  backButton: {
    padding: verticalScale(16),
    marginLeft: horizontalScale(8),
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    height: moderateScale(120),
    width: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: moderateScale(28),
    fontWeight: '700',
  },
  userName: {
    marginTop: verticalScale(16),
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: verticalScale(24),
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(8),
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
  },
  textInput: {
    flex: 1,
    paddingLeft: horizontalScale(16),
    fontSize: moderateScale(16),
  },
});
