// app/(app)/settings/edit.tsx
import FormButton from '@/src/components/forms/FormButton';
import { useAuth } from '@/src/context/AuthContextMigration';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useEditProfileStateMachine } from '@/src/machines/editProfileStateMachine';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { Feather, FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
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

export default function EditScreen() {
  const router = useRouter();
  const { user, userData: initialUserData, updateUserData } = useAuth();
  const { t } = useTranslation();

  const {
    backgroundColor,
    surfaceColor,
    textColor,
    secondaryTextColor,
    primaryColor,
    themeStyles,
    isDarkTheme,
  } = useAppTheme();

  // Replace multiple useState with single state machine
  const { state, dispatch } = useEditProfileStateMachine({
    fname: '',
    lname: '',
    phone: '',
    email: '',
    country: '',
    city: '',
    state: '',
  });

  const isSaving = state.type === 'saving';

  // Initialize form data when user data loads
  useEffect(() => {
    if (initialUserData && user) {
      dispatch({
        type: 'UPDATE_ALL_FIELDS',
        data: {
          fname: initialUserData.fname || '',
          lname: initialUserData.lname || '',
          phone: initialUserData.phone || '',
          email: user.email || '',
          country: initialUserData.country || '',
          city: initialUserData.city || '',
          state: initialUserData.state || '',
        },
      });
    }
  }, [initialUserData, user, dispatch]);

  // Simplified field update handler
  const handleFieldChange = (field: keyof typeof state.data, value: string) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  // Simplified update handler
  const handleUpdate = async () => {
    if (!user) return;

    await Haptics.selectionAsync();
    dispatch({ type: 'START_SAVING' });

    try {
      await updateUserData({
        fname: state.data.fname,
        lname: state.data.lname,
        phone: state.data.phone,
        country: state.data.country,
        city: state.data.city,
        state: state.data.state,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dispatch({
        type: 'SAVE_SUCCESS',
        message: t('profileUpdated', 'Your profile has been updated successfully.'),
      });

      Alert.alert(
        t('success', 'Success'),
        t('profileUpdated', 'Your profile has been updated successfully.')
      );
      router.back();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const errorMessage =
        error.message || t('updateFailed', 'Failed to update profile. Please try again.');
      dispatch({ type: 'SAVE_ERROR', error: errorMessage });

      Alert.alert(t('error', 'Error'), errorMessage);
    }
  };

  // Keep your original input fields configuration
  const inputFields = [
    {
      key: 'fname',
      placeholder: t('firstName', 'First Name'),
      icon: 'user',
      iconComponent: Feather,
      autoCapitalize: 'words' as const,
      keyboardType: 'default' as const,
    },
    {
      key: 'lname',
      placeholder: t('lastName', 'Last Name'),
      icon: 'user',
      iconComponent: Feather,
      autoCapitalize: 'words' as const,
      keyboardType: 'default' as const,
    },
    {
      key: 'phone',
      placeholder: t('phoneNumber', 'Phone Number'),
      icon: 'phone',
      iconComponent: Feather,
      autoCapitalize: 'none' as const,
      keyboardType: 'phone-pad' as const,
    },
    {
      key: 'email',
      placeholder: t('email', 'Email'),
      icon: 'envelope',
      iconComponent: FontAwesome,
      autoCapitalize: 'none' as const,
      keyboardType: 'email-address' as const,
    },
    {
      key: 'country',
      placeholder: t('country', 'Country'),
      icon: 'globe',
      iconComponent: Feather,
      autoCapitalize: 'words' as const,
      keyboardType: 'default' as const,
    },
    {
      key: 'city',
      placeholder: t('city', 'City'),
      icon: 'map-pin',
      iconComponent: Feather,
      autoCapitalize: 'words' as const,
      keyboardType: 'default' as const,
    },
    {
      key: 'state',
      placeholder: t('state', 'State'),
      icon: 'map',
      iconComponent: Feather,
      autoCapitalize: 'words' as const,
      keyboardType: 'default' as const,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: surfaceColor }]}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>
            {t('editProfile', 'Edit Profile')}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.profileInfo}>
            <Text style={[styles.fullName, { color: textColor }]}>
              {state.data.fname && state.data.lname
                ? `${state.data.fname} ${state.data.lname}`
                : user?.email || ''}
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
                    backgroundColor: surfaceColor,
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
                <IconComponent name={field.icon as any} size={20} color={secondaryTextColor} />
                <TextInput
                  placeholder={field.placeholder}
                  placeholderTextColor={secondaryTextColor}
                  value={state.data[field.key as keyof typeof state.data]}
                  onChangeText={text =>
                    handleFieldChange(field.key as keyof typeof state.data, text)
                  }
                  style={[styles.textInput, { color: textColor }]}
                  autoCapitalize={field.autoCapitalize}
                  keyboardType={field.keyboardType}
                  editable={!isSaving && field.key !== 'email'}
                />
              </View>
            );
          })}

          <FormButton
            buttonTitle={isSaving ? t('saving', 'Saving...') : t('updateProfile', 'Update Profile')}
            onPress={handleUpdate}
            disabled={isSaving}
            backgroundColor={primaryColor}
            textColor={themeStyles.colors.white}
            style={[styles.updateButton, { opacity: isSaving ? 0.7 : 1 }]}
          />
          {isSaving && (
            <ActivityIndicator size="small" color={primaryColor} style={styles.loadingIndicator} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: horizontalScale(24),
    paddingVertical: verticalScale(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(16),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    flex: 1,
  },
  form: {
    flex: 1,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: verticalScale(32),
  },
  fullName: {
    fontSize: moderateScale(20),
    fontWeight: '600',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(16),
    marginLeft: horizontalScale(12),
  },
  updateButton: {
    marginTop: verticalScale(24),
  },
  loadingIndicator: {
    marginTop: verticalScale(16),
  },
});
