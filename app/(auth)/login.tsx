import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
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

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, googleLogin } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await login(email, password);
      // router.replace("/(app)/home");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    }
  };

  const handleGoogleLogin = async () => {
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
          <Image 
            source={require('@/assets/icons/logo.jpg')} 
            style={[
              styles.logo,
              { borderRadius: themeStyles.borderRadius.circle(120) }
            ]} 
          />
          <Text style={[
            styles.title,
            { color: themeStyles.colors.text.primary }
          ]}>Trucking Logistics Pro</Text>
          <Text style={[
            styles.subtitle,
            { color: themeStyles.colors.text.primary }
          ]}>{t('welcomeBack', 'Welcome Back')}</Text>
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
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text style={[
              styles.forgotButtonText,
              { color: themeStyles.colors.text.secondary }
            ]}>{t('forgotPassword', 'Forgot Password?')}</Text>
          </TouchableOpacity>

          <FormButton 
            buttonTitle={t('signIn', 'Sign In')}
            onPress={handleLogin}
            disabled={loading}
            backgroundColor={themeStyles.colors.darkGrey}
            
          />
        </View>

        <View style={styles.formContainer}>
          <Text style={[
            styles.orText,
            { color: themeStyles.colors.text.secondary }
          ]}>- {t('or', 'Or')} -</Text>
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
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text style={[
            styles.createAccountText,
            { color: themeStyles.colors.text.secondary }
          ]}>
            {t('noAccount', "Don't have an account?")} {' '}
            <Text style={[
              styles.signUpText,
              { color: themeStyles.colors.text.primary }
            ]}>{t('signUpLink', 'Sign Up')}</Text>
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
    marginBottom: 32,
  },
  logo: {
    height: 120,
    width: 120,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    marginHorizontal: 24,
    textAlign: 'center',
    opacity: 0.9,
    letterSpacing: 0.3,
  },
  formContainer: {
    width: '100%',
    marginBottom: 4,
  },
  forgotButton: {
    marginVertical: 8,
    paddingHorizontal: 4,
    opacity: 0.8,
  },
  forgotButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  orText: {
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 8,
  },
  createAccountButton: {
    marginTop: 24,
  },
  createAccountText: {
    fontSize: 14,
    textAlign: 'center',
  },
  signUpText: {
    fontWeight: 'bold',
  },
});