// app/(auth)/forgot-password.tsx
import React, { useReducer } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';

import FormButton from '@/src/components/forms/FormButton';
import FormInput from '@/src/components/forms/FormInput';
import { useAuth } from '@/src/context/AuthContext';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { AuthService } from '@/src/services/AuthService';

// Simple state machine for forgot password
type ForgotPasswordState = 
  | { type: 'idle'; email: string }
  | { type: 'submitting'; email: string }
  | { type: 'success'; email: string }
  | { type: 'error'; email: string; error: string }

type ForgotPasswordEvent = 
  | { type: 'UPDATE_EMAIL'; email: string }
  | { type: 'SUBMIT' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'RESET' }

const forgotPasswordMachine = (
  state: ForgotPasswordState, 
  event: ForgotPasswordEvent
): ForgotPasswordState => {
  switch (state.type) {
    case 'idle':
      if (event.type === 'UPDATE_EMAIL') {
        return { ...state, email: event.email };
      }
      if (event.type === 'SUBMIT') {
        return { type: 'submitting', email: state.email };
      }
      return state;

    case 'submitting':
      if (event.type === 'SUBMIT_SUCCESS') {
        return { type: 'success', email: state.email };
      }
      if (event.type === 'SUBMIT_ERROR') {
        return { type: 'error', email: state.email, error: event.error };
      }
      return state;

    case 'error':
      if (event.type === 'UPDATE_EMAIL') {
        return { type: 'idle', email: event.email };
      }
      if (event.type === 'RESET') {
        return { type: 'idle', email: state.email };
      }
      return state;

    case 'success':
      if (event.type === 'RESET') {
        return { type: 'idle', email: '' };
      }
      return state;

    default:
      return state;
  }
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const { backgroundColor, textColor, secondaryTextColor, primaryColor, themeStyles } =
    useAppTheme();

  // ✅ Single state machine replaces useState
  const [state, dispatch] = useReducer(forgotPasswordMachine, {
    type: 'idle',
    email: ''
  });

  // Pure calculations - no useState needed
  const isSubmitting = state.type === 'submitting';
  const hasError = state.type === 'error';

  const handleEmailChange = (email: string) => {
    dispatch({ type: 'UPDATE_EMAIL', email });
  };

const handleReset = async () => {
  dispatch({ type: 'SUBMIT' });

  // Simple, safe validation
  if (!state.email.trim()) {
    dispatch({ type: 'SUBMIT_ERROR', error: t('pleaseEnterEmail', 'Please enter your email') });
    Alert.alert('Error', t('pleaseEnterEmail', 'Please enter your email'));
    return;
  }

  // Use AuthService for email format validation
  const validation = AuthService.validateLoginForm({ email: state.email, password: 'temp' });
  if (!validation.isValid) {
    // Find the email-specific error safely
    const emailError = validation.errors.find(error => 
      error && typeof error === 'string' && error.toLowerCase().includes('email')
    );
    
    if (emailError) {
      dispatch({ type: 'SUBMIT_ERROR', error: emailError });
      Alert.alert('Error', emailError);
      return;
    }
  }

  try {
    const sanitizedEmail = AuthService.sanitizeFormData({ email: state.email, password: '' }).email;
    await resetPassword(sanitizedEmail);
    
    dispatch({ type: 'SUBMIT_SUCCESS' });
    
    Alert.alert(
      t('resetEmailSent', 'Reset Email Sent'),
      t('checkEmailForInstructions', 'Please check your email for password reset instructions'),
      [{ text: t('ok', 'OK'), onPress: () => router.back() }]
    );
  } catch (error: any) {
    dispatch({ type: 'SUBMIT_ERROR', error: error.message });
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

          <View style={styles.inputContainer}>
            <FormInput
              labelValue={state.email}
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
  inputContainer: {
    width: '100%',
    marginBottom: verticalScale(20),
  },
});