// app/(auth)/forgot-password.tsx
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import FormButton from '@/src/components/forms/FormButton';
import FormInput from '@/src/components/forms/FormInput';
import { useAuth } from '@/src/context/AuthContextMigration';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuthFormMachine } from '@/src/machines/authFormMachine';
import { AuthService } from '@/src/services/AuthService';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const { backgroundColor, textColor, secondaryTextColor, primaryColor, themeStyles } =
    useAppTheme();

  const { state, dispatch } = useAuthFormMachine('forgot-password');

  // Pure calculations - no useState needed
  const isSubmitting = state.type === 'submitting';
  const hasError = state.type === 'error';

  const handleEmailChange = (email: string) => {
    dispatch({ type: 'UPDATE_FIELD', field: 'email', value: email });
  };

  const handleReset = async () => {
    dispatch({ type: 'SUBMIT_CREDENTIALS' });

    // Use dedicated validation
    const validation = AuthService.validateForgotPasswordForm({
      email: state.form.email,
    });

    if (!validation.isValid) {
      dispatch({ type: 'VALIDATE_ERROR', error: validation.errors[0] });
      Alert.alert(t('error', 'Error'), validation.errors[0]);
      return;
    }

    dispatch({ type: 'VALIDATE_SUCCESS' });

    // Add haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }

    try {
      const sanitizedEmail = AuthService.sanitizeFormData({
        email: state.form.email,
        password: '',
      }).email;

      await resetPassword(sanitizedEmail);
      dispatch({ type: 'SUBMIT_SUCCESS' });

      Alert.alert(
        t('resetEmailSent', 'Reset Email Sent'),
        t('checkEmailForInstructions', 'Please check your email for password reset instructions'),
        [{ text: t('ok', 'OK'), onPress: () => router.back() }]
      );
    } catch (error: any) {
      dispatch({ type: 'SUBMIT_ERROR', error: error.message });
      Alert.alert(t('error', 'Error'), error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          disabled={isSubmitting}
        >
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: textColor }]}>
            {t('forgotPasswordTitle', 'Forgot Password')}
          </Text>

          <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
            {t(
              'forgotPasswordSubtitle',
              'Enter your email address and we will send you instructions to reset your password.'
            )}
          </Text>

          {hasError && (
            <View
              style={[styles.errorContainer, { backgroundColor: themeStyles.colors.error + '10' }]}
            >
              <Feather name="alert-circle" size={16} color={themeStyles.colors.error} />
              <Text style={[styles.errorText, { color: themeStyles.colors.error }]}>
                {state.error}
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <FormInput
              labelValue={state.form.email}
              onChangeText={handleEmailChange}
              placeholderText={t('enterEmail', 'Enter Your Email')}
              iconType="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>

          <FormButton
            buttonTitle={
              isSubmitting ? t('sending', 'Sending...') : t('resetPassword', 'Reset Password')
            }
            onPress={handleReset}
            disabled={isSubmitting}
            backgroundColor={primaryColor}
            textColor={themeStyles.colors.white}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: horizontalScale(16),
  },
  backButton: {
    marginTop: verticalScale(16),
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: horizontalScale(16),
  },
  title: {
    fontSize: moderateScale(26),
    fontWeight: 'bold',
    marginBottom: verticalScale(10),
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: verticalScale(30),
    paddingHorizontal: horizontalScale(20),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    gap: horizontalScale(8),
    width: '100%',
  },
  errorText: {
    fontSize: moderateScale(14),
    flex: 1,
  },
  inputContainer: {
    width: '100%',
    marginBottom: verticalScale(20),
  },
});
