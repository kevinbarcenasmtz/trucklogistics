import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { useRouter } from "expo-router";
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from "@/src/theme";
import FormButton from '@/src/components/forms/FormButton';
import FormInput from '@/src/components/forms/FormInput';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/src/context/AuthContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const { resetPassword, loading } = useAuth();

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Error", t('pleaseEnterEmail', 'Please enter your email'));
      return;
    }
  
    try {
      await resetPassword(email);
      Alert.alert(
        t('resetEmailSent', 'Reset Email Sent'),
        t('checkEmailForInstructions', 'Please check your email for password reset instructions'),
        [
          { text: t('ok', 'OK'), onPress: () => router.back() }
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView style={[
      styles.safeArea,
      { backgroundColor: themeStyles.colors.background }
    ]}>
      <View style={styles.container}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Text style={[
            styles.backText,
            { color: themeStyles.colors.text.primary }
          ]}>{t('back', 'Back')}</Text>
        </TouchableOpacity>
        
        <View style={styles.contentContainer}>
          <Text style={[
            styles.title,
            { color: themeStyles.colors.text.primary }
          ]}>{t('forgotPasswordTitle', 'Forgot Password')}</Text>
          
          <Text style={[
            styles.subtitle,
            { color: themeStyles.colors.text.secondary }
          ]}>
            {t('forgotPasswordSubtitle', 'Enter your email address and we will send you instructions to reset your password.')}
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
            buttonTitle={loading ? t('sending', 'Sending...') : t('resetPassword', 'Reset Password')}
            onPress={handleReset}
            disabled={loading}
            backgroundColor={themeStyles.colors.greenThemeColor}
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
    padding: 16,
  },
  backButton: {
    marginTop: 16,
  },
  backText: {
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  }
});