import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  View 
} from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';

interface GoogleSignInButtonProps {
  label?: string;
}

export default function GoogleSignInButton({ 
  label = 'Sign in with Google' 
}: GoogleSignInButtonProps): JSX.Element {
  const { googleLogin, loading: isSigningIn } = useAuth();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  const isDark = theme === 'dark';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isDark ? '#4285F4' : '#ffffff',
          borderColor: isDark ? '#4285F4' : '#DADCE0',
          ...themeStyles.shadow.sm
        }
      ]}
      onPress={googleLogin}
      disabled={isSigningIn}
      accessibilityLabel="Sign in with Google"
    >
      {isSigningIn ? (
        <ActivityIndicator 
          color={isDark ? '#ffffff' : '#4285F4'} 
          size="small" 
        />
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons 
            name="logo-google" 
            size={24} 
            color={isDark ? '#ffffff' : '#4285F4'} 
            style={styles.icon} 
          />
          <Text
            style={[
              styles.buttonText,
              { color: isDark ? '#ffffff' : '#4285F4' }
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    minWidth: 220,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});