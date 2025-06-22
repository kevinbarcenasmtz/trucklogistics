// app/(auth)/signup.tsx
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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignupScreen() {
  const router = useRouter();
  const { register, loading, googleLogin } = useAuth();
  const { t } = useTranslation();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !fname || !lname) {
      Alert.alert('Error', t('fillAllFields', 'Please fill in all fields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', t('passwordsDoNotMatch', 'Passwords do not match'));
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', t('passwordTooShort', 'Password should be at least 6 characters'));
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await register(email, password, fname, lname);
      router.replace('/(app)/home');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  const handleGoogleSignup = async () => {
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
          <Text style={[styles.title, { color: getTextColor() }]}>
            {t('createAccount', 'Create Account')}
          </Text>
          <Text style={[styles.subtitle, { color: getSecondaryTextColor() }]}>
            {t('joinTruckingPro', 'Join Trucking Logistics Pro')}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <FormInput
            labelValue={fname}
            onChangeText={setFname}
            placeholderText={t('firstName', 'First Name')}
            iconType="user"
            autoCorrect={false}
          />
          <FormInput
            labelValue={lname}
            onChangeText={setLname}
            placeholderText={t('lastName', 'Last Name')}
            iconType="user"
            autoCorrect={false}
          />
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
          <FormInput
            labelValue={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholderText={t('confirmPassword', 'Confirm Password')}
            iconType="lock"
            secureTextEntry
          />

          <FormButton
            buttonTitle={loading ? t('signingUp', 'Signing Up...') : t('signUp', 'Sign Up')}
            onPress={handleSignup}
            disabled={loading}
            backgroundColor={getButtonBgColor()}
            textColor={themeStyles.colors.white}
          />
        </View>

        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: getSecondaryTextColor() }]}>
            {t('termsText', 'By signing up, you agree to our')}{' '}
            <Text style={[styles.termsLink, { color: themeStyles.colors.greenThemeColor }]}>
              {t('termsService', 'Terms of Service')}
            </Text>{' '}
            {t('and', 'and')}{' '}
            <Text style={[styles.termsLink, { color: themeStyles.colors.greenThemeColor }]}>
              {t('privacyPolicy', 'Privacy Policy')}
            </Text>
          </Text>
        </View>

        <SocialButton
          buttonTitle={t('signUpWithGoogle', 'Sign Up with Google')}
          btnType="google"
          color={themeStyles.colors.white}
          backgroundColor={themeStyles.colors.greenThemeColor}
          onPress={handleGoogleSignup}
          disabled={isGoogleLoading}
        />

        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.6}
        >
          <Text style={[styles.signInText, { color: getSecondaryTextColor() }]}>
            {t('haveAccount', 'Already have an account?')}{' '}
            <Text style={[styles.signInLink, { color: getTextColor() }]}>
              {t('signInLink', 'Sign In')}
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
    marginBottom: verticalScale(24),
  },
  termsContainer: {
    marginVertical: verticalScale(4),
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
  },
  signInText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  signInLink: {
    fontWeight: 'bold',
  },
});
