import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Alert
} from 'react-native';
import { useRouter } from "expo-router";
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from "@/src/theme";
import FormButton from '@/src/components/forms/FormButton';
import FormInput from '@/src/components/forms/FormInput';
import SocialButton from '@/src/components/forms/SocialButton';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/src/context/AuthContext';

export default function SignupScreen() {
  const router = useRouter();
  const { register, loading, googleLogin } = useAuth();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !fname || !lname) {
      Alert.alert("Error", t('fillAllFields', "Please fill in all fields"));
      return;
    }
  
    if (password !== confirmPassword) {
      Alert.alert("Error", t('passwordsDoNotMatch', "Passwords do not match"));
      return;
    }
  
    if (password.length < 6) {
      Alert.alert("Error", t('passwordTooShort', "Password should be at least 6 characters"));
      return;
    }
  
    try {
      await register(email, password, fname, lname);
      // router.replace("/(app)/home");
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true);
      await googleLogin();
      // router.replace("/(app)/home");
    } catch (error: any) {
      if (error.message) {
        Alert.alert("Google Sign-In Failed", error.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={[
      styles.safeArea,
      { backgroundColor: themeStyles.colors.background }
    ]}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={[
            styles.title,
            { color: themeStyles.colors.text.primary }
          ]}>{t('createAccount', 'Create Account')}</Text>
          <Text style={[
            styles.subtitle,
            { color: themeStyles.colors.text.secondary }
          ]}>{t('joinTruckingPro', 'Join Trucking Logistics Pro')}</Text>
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
            backgroundColor={themeStyles.colors.darkGrey}
          />
        </View>

        <View style={styles.termsContainer}>
          <Text style={[
            styles.termsText,
            { color: themeStyles.colors.text.secondary }
          ]}>
            {t('termsText', 'By signing up, you agree to our')}{' '}
            <Text style={[
              styles.termsLink,
              { color: themeStyles.colors.greenThemeColor }
            ]}>{t('termsService', 'Terms of Service')}</Text>
            {' '}{t('and', 'and')}{' '}
            <Text style={[
              styles.termsLink,
              { color: themeStyles.colors.greenThemeColor }
            ]}>{t('privacyPolicy', 'Privacy Policy')}</Text>
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
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={[
            styles.signInText,
            { color: themeStyles.colors.text.secondary }
          ]}>
            {t('haveAccount', 'Already have an account?')}{' '}
            <Text style={[
              styles.signInLink,
              { color: themeStyles.colors.text.primary }
            ]}>{t('signInLink', 'Sign In')}</Text>
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
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  termsContainer: {
    marginVertical: 4,
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  termsText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '500',
  },
  signInButton: {
    marginTop: 24,
  },
  signInText: {
    fontSize: 14,
    textAlign: 'center',
  },
  signInLink: {
    fontWeight: 'bold',
  },
});