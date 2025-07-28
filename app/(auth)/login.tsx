// app/(auth)/login.tsx
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Image,
  Platform,
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
import { Feather } from '@expo/vector-icons';
import { safeArrayAccess } from '../../src/utils/safeAccess';

export default function LoginScreen() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();
  const { t } = useTranslation();
  const { backgroundColor, textColor, secondaryTextColor, primaryColor, themeStyles, isDarkTheme } =
    useAppTheme();

  // Single state machine replaces all individual useState calls
  const { state, dispatch } = useAuthFormMachine('login');

  // Pure calculations - no useState needed
  const isSubmitting = state.type === 'submitting';
  const hasError = state.type === 'error';
  const isGoogleLoading = state.type === 'submitting' && state.method === 'google';
  const isCredentialsLoading = state.type === 'submitting' && state.method === 'credentials';

  const handleFieldChange = (field: keyof typeof state.form, value: string) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  const handleLogin = async () => {
    dispatch({ type: 'SUBMIT_CREDENTIALS' });

    // Business logic separated from UI
    const validation = AuthService.validateLoginForm(state.form);

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
      const payload = AuthService.createLoginPayload(state.form);
      await login(payload.email, payload.password);

      dispatch({ type: 'SUBMIT_SUCCESS' });
      router.replace('/(app)/home');
    } catch (error: any) {
      dispatch({ type: 'SUBMIT_ERROR', error: error.message });
      console.error('Login failed:', error);
    }
  };

  const handleGoogleLogin = async () => {
    dispatch({ type: 'SUBMIT_GOOGLE' });

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }

    try {
      await googleLogin();

      dispatch({ type: 'SUBMIT_SUCCESS' });
      router.replace('/(app)/home');
    } catch (error: any) {
      dispatch({ type: 'SUBMIT_ERROR', error: error.message });
      console.error('Google login failed:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Image
            source={require('@/assets/icons/logo.jpg')}
            style={[
              styles.logo,
              {
                borderRadius: themeStyles.borderRadius.circle(120),
                backgroundColor: backgroundColor,
              },
              Platform.select({
                ios: {
                  shadowColor: themeStyles.colors.black,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isDarkTheme ? 0.3 : 0.1,
                  shadowRadius: 8,
                },
                android: {
                  elevation: 8,
                },
              }),
            ]}
          />
          <Text style={[styles.title, { color: textColor }]}>
            {t('welcomeBack', 'Welcome Back')}
          </Text>
          <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
            {t('signInToContinue', 'Sign in to continue')}
          </Text>
        </View>

        <View style={styles.formContainer}>
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

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password')}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Text style={[styles.forgotPasswordText, { color: primaryColor }]}>
              {t('forgotPassword', 'Forgot Password?')}
            </Text>
          </TouchableOpacity>

          <FormButton
            buttonTitle={
              isCredentialsLoading ? t('signingIn', 'Signing In...') : t('signIn', 'Sign In')
            }
            onPress={handleLogin}
            disabled={isSubmitting}
            backgroundColor={primaryColor}
            textColor={themeStyles.colors.white}
            style={styles.signInButton}
          />
        </View>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: secondaryTextColor }]} />
          <Text style={[styles.dividerText, { color: secondaryTextColor }]}>{t('or', 'OR')}</Text>
          <View style={[styles.divider, { backgroundColor: secondaryTextColor }]} />
        </View>

        <SocialButton
          buttonTitle={t('signInWithGoogle', 'Sign In with Google')}
          btnType="google"
          color={themeStyles.colors.white}
          backgroundColor={primaryColor}
          onPress={handleGoogleLogin}
          disabled={isGoogleLoading}
        />

        <View style={styles.footer}>
          <View style={styles.footerTextContainer}>
            <Text style={[styles.footerText, { color: secondaryTextColor }]}>
              {t('noAccount', "Don't have an account?")}{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/signup')}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <Text style={[styles.signUpLink, { color: primaryColor }]}>
                {t('signUp', 'Sign Up')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: horizontalScale(24),
    paddingTop: verticalScale(46),
    paddingBottom: verticalScale(56),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(32),
  },
  logo: {
    height: moderateScale(120),
    width: moderateScale(120),
    resizeMode: 'cover',
    marginBottom: verticalScale(24),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    lineHeight: moderateScale(34),
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(24),
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    gap: verticalScale(12),
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
  forgotPassword: {
    alignSelf: 'center',
    marginTop: verticalScale(-8),
  },
  forgotPasswordText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  signInButton: {
    marginTop: verticalScale(14),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(8),
  },
  divider: {
    flex: 1,
    height: 1,
    opacity: 1.0,
  },
  dividerText: {
    marginHorizontal: horizontalScale(8),
    fontSize: moderateScale(14),
  },
  footer: {
    alignItems: 'center',
    paddingTop: verticalScale(16),
  },
  footerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  signUpLink: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginLeft: horizontalScale(4),
  },
});
