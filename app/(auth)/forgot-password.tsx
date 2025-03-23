// app/(auth)/forgot-password.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { useRouter } from "expo-router";
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from "@/src/theme";
import FormButton from '@/src/components/forms/FormButton';
import FormInput from '@/src/components/forms/FormInput';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/src/context/AuthContext';
import { Feather } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const { resetPassword, loading } = useAuth();

  // Get text color based on theme
  const getTextColor = () => isDarkTheme 
    ? themeStyles.colors.white 
    : themeStyles.colors.text.primary;

  // Get secondary text color based on theme
  const getSecondaryTextColor = () => isDarkTheme 
    ? themeStyles.colors.grey 
    : themeStyles.colors.text.secondary;

  // Get background color based on theme
  const getBackgroundColor = () => isDarkTheme 
    ? themeStyles.colors.black_grey 
    : themeStyles.colors.background;

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
      { backgroundColor: getBackgroundColor() }
    ]}>
      <View style={styles.container}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Feather 
            name="arrow-left" 
            size={24} 
            color={getTextColor()} 
          />
        </TouchableOpacity>
        
        <View style={styles.contentContainer}>
          <Text style={[
            styles.title,
            { color: getTextColor() }
          ]}>{t('forgotPasswordTitle', 'Forgot Password')}</Text>
          
          <Text style={[
            styles.subtitle,
            { color: getSecondaryTextColor() }
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
  }
});