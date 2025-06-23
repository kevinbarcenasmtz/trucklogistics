// app/(auth)/login.tsx
import FormButton from '@/src/components/forms/FormButton';
import FormInput from '@/src/components/forms/FormInput';
import SocialButton from '@/src/components/forms/SocialButton';
import { useAuth } from '@/src/context/AuthContext';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, googleLogin } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { t } = useTranslation();
  const {
    backgroundColor,
    surfaceColor,
    textColor,
    secondaryTextColor,
    primaryColor,
    buttonPrimaryBg,
    themeStyles,
    isDarkTheme,
  } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('error', 'Error'), t('fillAllFields', 'Please fill in all fields'));
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }

    try {
      await login(email, password);
      router.replace('/(app)/home');
    } catch (error) {
      // Error handling is done in the AuthContext
      console.error('Login failed:', error);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }

    try {
      await googleLogin();
      router.replace('/(app)/home');
    } catch (error) {
      console.error('Google login failed:', error);
    } finally {
      setIsGoogleLoading(false);
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
              { borderRadius: themeStyles.borderRadius.circle(120) },
              Platform.select({
                ios: {
                  shadowColor: themeStyles.colors.black,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isDarkTheme ? 0.4 : 0.2,
                  shadowRadius: 5,
                },
                android: { elevation: 5 },
              }),
            ]}
          />
          <Text style={[styles.title, { color: textColor }]}>
            {t('welcomeBack', 'Welcome Back')}
          </Text>
          <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
            {t('signInContinue', 'Sign in to continue to your account')}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <FormInput
            labelValue={email}
            onChangeText={setEmail}
            placeholderText={t('enterEmail', 'Enter your email')}
            iconType="user"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <FormInput
            labelValue={password}
            onChangeText={setPassword}
            placeholderText={t('enterPassword', 'Enter your password')}
            iconType="lock"
            secureTextEntry
            autoComplete="password"
          />
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={[styles.forgotPasswordText, { color: primaryColor }]}>
              {t('forgotPassword', 'Forgot Password?')}
            </Text>
          </TouchableOpacity>
          <FormButton
            buttonTitle={t('signIn', 'Sign In')}
            onPress={handleLogin}
            disabled={loading}
            backgroundColor={buttonPrimaryBg}
            textColor="#FFFFFF"
            style={styles.signInButton}
          />
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: secondaryTextColor }]} />
            <Text style={[styles.dividerText, { color: secondaryTextColor }]}>
              {t('orContinueWith', 'Or continue with')}
            </Text>
            <View style={[styles.divider, { backgroundColor: secondaryTextColor }]} />
          </View>
          <SocialButton
            buttonTitle={t('continueWithGoogle', 'Continue with Google')}
            btnType="google-plus"
            color={textColor}
            backgroundColor={buttonPrimaryBg}
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading}
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.footerTextContainer}>
            <Text style={[styles.footerText, { color: secondaryTextColor }]}>
              {t('dontHaveAccount', "Don't have an account? ")}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} activeOpacity={0.7}>
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
    paddingTop: verticalScale(32),
    paddingBottom: verticalScale(24),
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
    gap: verticalScale(16),
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
    marginTop: verticalScale(8),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(8),
  },
  divider: {
    flex: 1,
    height: 1,
    opacity: 0.8,
  },
  dividerText: {
    marginHorizontal: horizontalScale(8),
    fontSize: moderateScale(14),
  },
  googleButton: {
    marginBottom: verticalScale(6),
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
