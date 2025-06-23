// app/(auth)/forgot-password.tsx
import FormButton from '@/src/components/forms/FormButton';
import FormInput from '@/src/components/forms/FormInput';
import { useAuth } from '@/src/context/AuthContext';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const { resetPassword, loading } = useAuth();

  const { backgroundColor, textColor, secondaryTextColor, primaryColor, themeStyles } =
    useAppTheme();

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', t('pleaseEnterEmail', 'Please enter your email'));
      return;
    }

    try {
      await resetPassword(email);
      Alert.alert(
        t('resetEmailSent', 'Reset Email Sent'),
        t('checkEmailForInstructions', 'Please check your email for password reset instructions'),
        [{ text: t('ok', 'OK'), onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
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

          <View style={styles.inputContainer}>
            <FormInput
              labelValue={email}
              onChangeText={setEmail}
              placeholderText={t('enterEmail', 'Enter Your Email')}
              iconType="mail"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <FormButton
            buttonTitle={
              loading ? t('sending', 'Sending...') : t('resetPassword', 'Reset Password')
            }
            onPress={handleReset}
            disabled={loading}
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
  backText: {
    fontSize: moderateScale(16),
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
  inputContainer: {
    width: '100%',
    marginBottom: verticalScale(20),
  },
});
