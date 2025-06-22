// app/(auth)/login.tsx
import FormButton from '@/src/components/forms/FormButton';
import FormInput from '@/src/components/forms/FormInput';
import SocialButton from '@/src/components/forms/SocialButton';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, moderateScale, verticalScale } from '@/src/theme';
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
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Get background color based on theme
  const getBackgroundColor = () =>
    isDarkTheme ? themeStyles.colors.black_grey : themeStyles.colors.background;

  // Get text color based on theme
  const getTextColor = () =>
    isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary;

  // Get secondary text color based on theme
  const getSecondaryTextColor = () =>
    isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.secondary;

  // Get button background color based on theme
  const getButtonBgColor = () =>
    isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.primary;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await login(email, password);
      router.replace('/(app)/home');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsGoogleLoading(true);
      await googleLogin();
      router.replace('/(app)/home');
    } catch (error: any) {
      if (error.message) {
        Alert.alert('Google Sign-In Failed', error.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: getBackgroundColor() }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
                android: {
                  elevation: 5,
                },
              }),
            ]}
          />
          <Text style={[styles.title, { color: getTextColor() }]}>Trucking Logistics Pro</Text>
          <Text style={[styles.subtitle, { color: getTextColor() }]}>
            {t('welcomeBack', 'Welcome Back')}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <FormInput
            labelValue={email}
            onChangeText={setEmail}
            placeholderText={t('email', 'Email')}
            iconType="user"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <FormInput
            labelValue={password}
            onChangeText={setPassword}
            placeholderText={t('password', 'Password')}
            iconType="lock"
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => router.push('/(auth)/forgot-password')}
            activeOpacity={0.6}
          >
            <Text style={[styles.forgotButtonText, { color: getSecondaryTextColor() }]}>
              {t('forgotPassword', 'Forgot Password?')}
            </Text>
          </TouchableOpacity>

          <FormButton
            buttonTitle={t('signIn', 'Sign In')}
            onPress={handleLogin}
            disabled={loading}
            backgroundColor={getButtonBgColor()}
            textColor={themeStyles.colors.white}
          />
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.orText, { color: getSecondaryTextColor() }]}>
            - {t('or', 'Or')} -
          </Text>
          <SocialButton
            buttonTitle={t('signInWithGoogle', 'Sign In with Google')}
            btnType="google"
            color={themeStyles.colors.white}
            backgroundColor={themeStyles.colors.greenThemeColor}
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading}
          />
        </View>

        <TouchableOpacity
          style={styles.createAccountButton}
          onPress={() => router.push('/(auth)/signup')}
          activeOpacity={0.6}
        >
          <Text style={[styles.createAccountText, { color: getSecondaryTextColor() }]}>
            {t('noAccount', "Don't have an account?")}{' '}
            <Text style={[styles.signUpText, { color: getTextColor() }]}>
              {t('signUpLink', 'Sign Up')}
            </Text>
          </Text>
        </TouchableOpacity>
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
  logo: {
    height: moderateScale(120),
    width: moderateScale(120),
    resizeMode: 'cover',
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    lineHeight: moderateScale(34),
    marginTop: verticalScale(16),
  },
  subtitle: {
    fontSize: moderateScale(16),
    marginTop: verticalScale(8),
    marginHorizontal: horizontalScale(24),
    textAlign: 'center',
    opacity: 0.9,
    letterSpacing: 0.3,
  },
  formContainer: {
    width: '100%',
    marginBottom: verticalScale(4),
  },
  forgotButton: {
    marginVertical: verticalScale(8),
    paddingHorizontal: horizontalScale(4),
    opacity: 0.8,
  },
  forgotButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    textAlign: 'center',
  },
  orText: {
    paddingHorizontal: horizontalScale(8),
    fontSize: moderateScale(14),
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: verticalScale(8),
  },
  createAccountButton: {
    marginTop: verticalScale(24),
  },
  createAccountText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  signUpText: {
    fontWeight: 'bold',
  },
});
