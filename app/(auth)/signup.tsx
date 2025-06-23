// app/(auth)/signup.tsx
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

  const { backgroundColor, textColor, secondaryTextColor, primaryColor, themeStyles } =
    useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: textColor }]}>
            {t('createAccount', 'Create Account')}
          </Text>
          <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
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
            backgroundColor={primaryColor}
            textColor={themeStyles.colors.white}
          />
        </View>

        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: secondaryTextColor }]}>
            {t('termsText', 'By signing up, you agree to our')}{' '}
            <Text style={[styles.termsLink, { color: primaryColor }]}>
              {t('termsService', 'Terms of Service')}
            </Text>{' '}
            {t('and', 'and')}{' '}
            <Text style={[styles.termsLink, { color: primaryColor }]}>
              {t('privacyPolicy', 'Privacy Policy')}
            </Text>
          </Text>
        </View>

        <SocialButton
          buttonTitle={t('signUpWithGoogle', 'Sign Up with Google')}
          btnType="google"
          color={themeStyles.colors.white}
          backgroundColor={primaryColor}
          onPress={handleGoogleSignup}
          disabled={isGoogleLoading}
        />

        {/* ✅ FIXED: Restructured to avoid Text nesting issue like in login */}
        <View style={styles.signInButton}>
          <View style={styles.signInTextContainer}>
            <Text style={[styles.signInText, { color: secondaryTextColor }]}>
              {t('haveAccount', 'Already have an account?')}{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.6}>
              <Text style={[styles.signInLink, { color: textColor }]}>
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
