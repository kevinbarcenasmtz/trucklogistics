// app/(auth)/signup.tsx
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FormButton from '@/src/components/forms/FormButton';
import FormInput from '@/src/components/forms/FormInput';
import SocialButton from '@/src/components/forms/SocialButton';
import { useAuth } from '@/src/context/AuthContextMigration';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAuthFormMachine } from '@/src/machines/authFormMachine';
import { AuthService } from '@/src/services/AuthService';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { safeArrayAccess } from '../../src/utils/safeAccess';

export default function SignupScreen() {
  const router = useRouter();
  const { register, googleLogin } = useAuth();
  const { t } = useTranslation();
  const {
    screenBackground, // instead of backgroundColor
    textPrimary, // instead of textColor
    textSecondary, // instead of secondaryTextColor
    primary, // instead of primaryColor
    error, // semantic error color
    white, // semantic white color
  } = useAppTheme();

  const { state, dispatch } = useAuthFormMachine('signup');

  // Pure calculations - no useState needed
  const isSubmitting = state.type === 'submitting';
  const hasError = state.type === 'error';
  const isGoogleLoading = state.type === 'submitting' && state.method === 'google';
  const isSignupLoading = state.type === 'submitting' && state.method === 'credentials';

  const handleFieldChange = (field: keyof typeof state.form, value: string) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  const handleSignup = async () => {
    dispatch({ type: 'SUBMIT_CREDENTIALS' });

    // Business logic separated from UI
    const validation = AuthService.validateSignupForm(state.form);

    if (!validation.isValid) {
      dispatch({
        type: 'VALIDATE_ERROR',
        error: safeArrayAccess(validation.errors, 0, 'Validation failed'),
      });
      Alert.alert(t('error', 'Error'), validation.errors[0]);
      return;
    }

    dispatch({ type: 'VALIDATE_SUCCESS' });

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }

    try {
      const payload = AuthService.createSignupPayload(state.form);
      await register(payload.email, payload.password, payload.fname, payload.lname);

      dispatch({ type: 'SUBMIT_SUCCESS' });
      router.replace('/(app)/home');
    } catch (error: any) {
      dispatch({ type: 'SUBMIT_ERROR', error: error.message });
      Alert.alert('Registration Failed', error.message);
    }
  };

  const handleGoogleSignup = async () => {
    dispatch({ type: 'SUBMIT_GOOGLE' });

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }

    try {
      await googleLogin();

      dispatch({ type: 'SUBMIT_SUCCESS' });
      router.replace('/(app)/home');
    } catch (error: any) {
      dispatch({ type: 'SUBMIT_ERROR', error: error.message });
      if (error.message) {
        Alert.alert('Google Sign-In Failed', error.message);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: screenBackground }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: textPrimary }]}>
            {t('createAccount', 'Create Account')}
          </Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            {t('joinTruckingPro', 'Join Trucking Logistics Pro')}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {hasError && (
            <View style={[styles.errorContainer, { backgroundColor: error + '10' }]}>
              <Feather name="alert-circle" size={16} color={error} />
              <Text style={[styles.errorText, { color: error }]}>{state.error}</Text>
            </View>
          )}

          <FormInput
            labelValue={state.form.fname || ''}
            onChangeText={value => handleFieldChange('fname', value)}
            placeholderText={t('firstName', 'First Name')}
            iconType="user"
            autoCorrect={false}
            editable={!isSubmitting}
          />

          <FormInput
            labelValue={state.form.lname || ''}
            onChangeText={value => handleFieldChange('lname', value)}
            placeholderText={t('lastName', 'Last Name')}
            iconType="user"
            autoCorrect={false}
            editable={!isSubmitting}
          />

          <FormInput
            labelValue={state.form.email}
            onChangeText={value => handleFieldChange('email', value)}
            placeholderText={t('email', 'Email')}
            iconType="user"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
          />

          <FormInput
            labelValue={state.form.password}
            onChangeText={value => handleFieldChange('password', value)}
            placeholderText={t('password', 'Password')}
            iconType="lock"
            secureTextEntry
            editable={!isSubmitting}
          />

          <FormInput
            labelValue={state.form.confirmPassword || ''}
            onChangeText={value => handleFieldChange('confirmPassword', value)}
            placeholderText={t('confirmPassword', 'Confirm Password')}
            iconType="lock"
            secureTextEntry
            editable={!isSubmitting}
          />

          <FormButton
            buttonTitle={isSignupLoading ? t('signingUp', 'Signing Up...') : t('signUp', 'Sign Up')}
            onPress={handleSignup}
            disabled={isSubmitting}
            backgroundColor={primary}
            textColor={white}
          />
        </View>

        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: textSecondary }]}>
            {t('termsText', 'By signing up, you agree to our')}{' '}
            <Text style={[styles.termsLink, { color: primary }]}>
              {t('termsService', 'Terms of Service')}
            </Text>{' '}
            {t('and', 'and')}{' '}
            <Text style={[styles.termsLink, { color: primary }]}>
              {t('privacyPolicy', 'Privacy Policy')}
            </Text>
          </Text>
        </View>

        <SocialButton
          buttonTitle={t('signUpWithGoogle', 'Sign Up with Google')}
          btnType="google"
          color={white}
          backgroundColor={primary}
          onPress={handleGoogleSignup}
          disabled={isGoogleLoading}
        />

        <View style={styles.signInButton}>
          <View style={styles.signInTextContainer}>
            <Text style={[styles.signInText, { color: textSecondary }]}>
              {t('haveAccount', 'Already have an account?')}{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.6}
              disabled={isSubmitting}
            >
              <Text style={[styles.signInLink, { color: textPrimary }]}>
                {t('signInLink', 'Sign In')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: horizontalScale(24),
    paddingTop: verticalScale(48),
    paddingBottom: verticalScale(24),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(32),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    lineHeight: moderateScale(34),
    marginBottom: verticalScale(4),
  },
  subtitle: {
    fontSize: moderateScale(16),
  },
  formContainer: {
    width: '100%',
    marginBottom: verticalScale(12),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    gap: horizontalScale(8),
  },
  errorText: {
    fontSize: moderateScale(14),
    flex: 1,
  },
  termsContainer: {
    marginVertical: verticalScale(2),
    paddingHorizontal: horizontalScale(8),
    paddingBottom: verticalScale(4),
  },
  termsText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  termsLink: {
    fontWeight: '500',
  },
  signInButton: {
    marginTop: verticalScale(24),
    alignItems: 'center',
  },
  signInTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  signInText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  signInLink: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
});
