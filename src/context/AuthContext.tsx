// src/context/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { ErrorSanitizer, SecurityError } from '../security/ErrorSanitizer';
import { RateLimiter } from '../security/RateLimiter';
import { SecureStorage } from '../security/SecureStorage';

// React Native Firebase imports
import auth from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Initialize Google Sign-In (now imported from separate file)
import '../config/googleSignIn';
const AUTH_STATE_KEY = 'auth_state';

// User type definitions
type User = {
  uid: string;
  email: string;
  fname: string;
  lname: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
};

type UserData = {
  email?: string;
  fname?: string;
  lname?: string;
  phone?: string;
  country?: string;
  city?: string;
  state?: string;
};

type AuthContextType = {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fname: string, lname: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  isOnboardingCompleted: boolean | null;
  completeOnboarding: () => Promise<void>;
  updateUserData: (data: UserData) => Promise<void>; // Add this function
};

// Error handling helper
const handleAuthError = (error: any, context: string = 'auth') => {
  ErrorSanitizer.logSecurityEvent(`${context}_error`, {
    errorCode: error.code,
    timestamp: Date.now(),
  });

  const userMessage = ErrorSanitizer.sanitizeAuthError(error);
  Alert.alert('Authentication Error', userMessage);
};

// Create auth context
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check onboarding status
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        try {
          const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
          const userDocData = userDoc.data();

          if (userDocData) {
            const userData = {
              uid: firebaseUser.uid,
              email: userDocData.email || '',
              fname: userDocData.fname || '',
              lname: userDocData.lname || '',
              createdAt: userDocData.createdAt,
            };

            setUser(userData);
            setUserData({
              email: userDocData.email,
              fname: userDocData.fname,
              lname: userDocData.lname,
              phone: userDocData.phone,
              country: userDocData.country,
              city: userDocData.city,
              state: userDocData.state,
            });

            // Save auth state to AsyncStorage
            await AsyncStorage.setItem(AUTH_STATE_KEY, 'true');
          } else {
            setUser(null);
            setUserData(null);
            await AsyncStorage.removeItem(AUTH_STATE_KEY);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
          setUserData(null);
          await AsyncStorage.removeItem(AUTH_STATE_KEY);
        }
      } else {
        setUser(null);
        setUserData(null);
        await AsyncStorage.removeItem(AUTH_STATE_KEY);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        try {
          const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
          const userDocData = userDoc.data();

          if (userDocData) {
            const userData = {
              uid: firebaseUser.uid,
              email: userDocData.email || '',
              fname: userDocData.fname || '',
              lname: userDocData.lname || '',
              createdAt: userDocData.createdAt,
            };

            setUser(userData);
            setUserData({
              email: userDocData.email,
              fname: userDocData.fname,
              lname: userDocData.lname,
              phone: userDocData.phone,
              country: userDocData.country,
              city: userDocData.city,
              state: userDocData.state,
            });

            await SecureStorage.storeAuthToken('authenticated'); // Replace AsyncStorage
          } else {
            setUser(null);
            setUserData(null);
            await SecureStorage.removeAuthToken();
          }
        } catch (error) {
          ErrorSanitizer.logSecurityEvent('auth_state_error');
          setUser(null);
          setUserData(null);
          await SecureStorage.removeAuthToken();
        }
      } else {
        setUser(null);
        setUserData(null);
        await SecureStorage.removeAuthToken();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Helper functions for validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
  };

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Check rate limit before attempting login
      await RateLimiter.checkRateLimit(email.toLowerCase());

      validateEmail(email);
      await auth().signInWithEmailAndPassword(email, password);

      // Clear rate limit on successful login
      await RateLimiter.clearRateLimit(email.toLowerCase());

      // Store auth token securely
      await SecureStorage.storeAuthToken('authenticated');
    } catch (error: any) {
      if (error instanceof SecurityError) {
        Alert.alert('Security Notice', error.userMessage);
        throw error;
      }

      // Record failed attempt for rate limiting
      await RateLimiter.recordFailedAttempt(email.toLowerCase());

      handleAuthError(error, 'login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (email: string, password: string, fname: string, lname: string) => {
    try {
      setLoading(true);

      await RateLimiter.checkRateLimit(email.toLowerCase());

      validateEmail(email);

      // No need to call validatePassword here since AuthService.validateSignupForm handles it
      // The validation in the UI components will catch password issues before reaching here

      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const newUser = {
        uid: userCredential.user.uid,
        email,
        fname,
        lname,
        createdAt: firestore.Timestamp.now(),
      };

      await firestore().collection('users').doc(userCredential.user.uid).set(newUser);
      await RateLimiter.clearRateLimit(email.toLowerCase());
      await SecureStorage.storeAuthToken('authenticated');
    } catch (error: any) {
      if (error instanceof SecurityError) {
        Alert.alert('Security Notice', error.userMessage);
        throw error;
      }

      await RateLimiter.recordFailedAttempt(email.toLowerCase());
      handleAuthError(error, 'register');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      await auth().signOut();
      await SecureStorage.removeAuthToken(); // Replace AsyncStorage
      setUser(null);
      setUserData(null);
      router.replace('/(auth)/login');
    } catch (error: any) {
      handleAuthError(error, 'logout');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In

  const googleLogin = async () => {
    try {
      setLoading(true);

      // Ensure Google Play Services are available (on Android)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Sign out from any existing Google session
      await GoogleSignin.signOut();

      // Perform Google Sign-In
      const signInResponse = await GoogleSignin.signIn();

      // Type guard to ensure successful response
      if (signInResponse.type === 'success') {
        const { idToken, user } = signInResponse.data;

        if (!idToken) {
          throw new Error('Failed to get ID token from Google Sign In');
        }

        // Create Firebase credential
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);

        // Sign in to Firebase
        const userCredential = await auth().signInWithCredential(googleCredential);

        // Check/create Firestore user document
        if (userCredential.user) {
          const userDoc = await firestore().collection('users').doc(userCredential.user.uid).get();

          if (!userDoc.exists) {
            const newUser = {
              uid: userCredential.user.uid,
              fname: user.givenName || '',
              lname: user.familyName || '',
              email: user.email || '',
              createdAt: firestore.Timestamp.now(),
            };

            await firestore().collection('users').doc(userCredential.user.uid).set(newUser);
          }
        }
      } else {
        throw new Error('Google Sign-In failed');
      }
    } catch (error: any) {
      // Comprehensive error handling
      if (error.code) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log('User cancelled Google Sign-In');
            break;
          case statusCodes.IN_PROGRESS:
            console.log('Sign-in is already in progress');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.log('Google Play Services not available');
            break;
          default:
            handleAuthError(error);
        }
      } else {
        // Handle other types of errors
        handleAuthError(error);
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);

      // Apply rate limiting to password reset too
      await RateLimiter.checkRateLimit(email.toLowerCase());

      validateEmail(email);
      await auth().sendPasswordResetEmail(email);

      // Clear rate limit on success
      await RateLimiter.clearRateLimit(email.toLowerCase());
    } catch (error: any) {
      if (error instanceof SecurityError) {
        Alert.alert('Security Notice', error.userMessage);
        throw error;
      }

      await RateLimiter.recordFailedAttempt(email.toLowerCase());
      handleAuthError(error, 'reset_password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      // Set both storage keys for consistency
      await AsyncStorage.multiSet([
        ['onboardingCompleted', 'true'],
        ['onboarding_progress', JSON.stringify({ completed: true })],
      ]);

      setIsOnboardingCompleted(true);

      // Navigate after state update
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 100);
    } catch (error) {
      console.error('Error setting onboarding status:', error);
      Alert.alert('Error', 'Could not complete onboarding');
    }
  };

  const updateUserData = async (data: UserData) => {
    try {
      setLoading(true);

      if (!user) {
        throw new Error('No user is currently logged in');
      }

      // Update the user data in Firestore
      await firestore()
        .collection('users')
        .doc(user.uid)
        .update({
          ...data,
          updatedAt: firestore.Timestamp.now(),
        });

      // Update local state
      setUserData(data);

      // Update user state with name changes if applicable
      if (data.fname !== user.fname || data.lname !== user.lname) {
        setUser({
          ...user,
          fname: data.fname || user.fname,
          lname: data.lname || user.lname,
        });
      }
    } catch (error: any) {
      console.error('Error updating user data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create context value
  const value: AuthContextType = {
    user,
    userData,
    loading,
    login,
    register,
    logout,
    resetPassword,
    googleLogin,
    isOnboardingCompleted,
    completeOnboarding,
    updateUserData, // Add this line
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook for using auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
