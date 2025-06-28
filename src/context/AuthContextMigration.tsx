// src/context/AuthContextMigration.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { ErrorSanitizer, SecurityError } from '../security/ErrorSanitizer';
import { RateLimiter } from '../security/RateLimiter';
import { SecureStorage } from '../security/SecureStorage';

// Firebase modular imports - import directly from packages
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';
import { doc, getDoc, setDoc, Timestamp, updateDoc } from '@react-native-firebase/firestore';

// Import the Firebase instances from config
import { auth, firestore } from '../config/firebaseMigration';

// Initialize Google Sign-In
import '../config/googleSignIn';

// User type definitions
type User = {
  uid: string;
  email: string;
  fname: string;
  lname: string;
  createdAt: any; // Firebase Timestamp
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
  updateUserData: (data: UserData) => Promise<void>;
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Listen to auth state changes - MODULAR API
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (isLoggingOut) return;
      if (firebaseUser) {
        try {
          // Get user document - MODULAR API
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userDocData = userDocSnap.data();

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

              await SecureStorage.storeAuthToken('authenticated');
            }
          } else {
            setUser(null);
            setUserData(null);
            await SecureStorage.removeAuthToken();
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
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
  }, [isLoggingOut]);

  // Helper functions for validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }
  };

  // Login with email and password - MODULAR API
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      await RateLimiter.checkRateLimit(email.toLowerCase());
      validateEmail(email);

      // Use modular API
      await signInWithEmailAndPassword(auth, email, password);

      await RateLimiter.clearRateLimit(email.toLowerCase());
      await SecureStorage.storeAuthToken('authenticated');
    } catch (error: any) {
      if (error instanceof SecurityError) {
        Alert.alert('Security Notice', error.userMessage);
        throw error;
      }

      await RateLimiter.recordFailedAttempt(email.toLowerCase());
      handleAuthError(error, 'login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register new user - MODULAR API
  const register = async (email: string, password: string, fname: string, lname: string) => {
    try {
      setLoading(true);

      await RateLimiter.checkRateLimit(email.toLowerCase());
      validateEmail(email);

      // Create user with modular API
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user document - MODULAR API
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        email,
        fname,
        lname,
        createdAt: Timestamp.now(),
      });

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

  // Reset password - MODULAR API
  const resetPassword = async (email: string) => {
    try {
      validateEmail(email);
      // Use modular API
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Password reset email sent!');
    } catch (error: any) {
      handleAuthError(error, 'reset_password');
      throw error;
    }
  };

  // Logout - MODULAR API
  const logout = async () => {
    try {
      setIsLoggingOut(true); // Add this line
      setLoading(true);

      await signOut(auth);

      await SecureStorage.removeAuthToken();
      setUser(null);
      setUserData(null);

      router.replace('/(auth)/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      handleAuthError(error, 'logout');
      throw error;
    } finally {
      setLoading(false);
      setIsLoggingOut(false); // Add this line
    }
  };

  // Google login - MODULAR API
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

        // Create Firebase credential - MODULAR API
        const googleCredential = GoogleAuthProvider.credential(idToken);

        // Sign in to Firebase - MODULAR API
        const userCredential = await signInWithCredential(auth, googleCredential);

        // Check/create Firestore user document - MODULAR API
        if (userCredential.user) {
          const userDocRef = doc(firestore, 'users', userCredential.user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            const newUser = {
              uid: userCredential.user.uid,
              fname: user.givenName || '',
              lname: user.familyName || '',
              email: user.email || '',
              createdAt: Timestamp.now(), // MODULAR API
            };

            await setDoc(userDocRef, newUser); // MODULAR API
          }

          await SecureStorage.storeAuthToken('authenticated');
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
            handleAuthError(error, 'google_login');
        }
      } else {
        handleAuthError(error, 'google_login');
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.multiSet([
        ['onboardingCompleted', 'true'],
        ['onboarding_progress', JSON.stringify({ completed: true })],
      ]);

      setIsOnboardingCompleted(true);

      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 100);
    } catch (error) {
      console.error('Error setting onboarding status:', error);
      Alert.alert('Error', 'Could not complete onboarding');
    }
  };

  // Update user data - MODULAR API
  const updateUserData = async (data: UserData) => {
    try {
      setLoading(true);

      if (!user) {
        throw new Error('No user is currently logged in');
      }

      // Create document reference
      const userDocRef = doc(firestore, 'users', user.uid);

      // Filter out undefined/empty values
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      // Prepare update data with timestamp
      const updateData = {
        ...cleanData,
        updatedAt: Timestamp.now(),
      };

      console.log('Updating document:', userDocRef.path, 'with data:', updateData);

      // Perform the update
      await updateDoc(userDocRef, updateData);

      // Fetch the updated document to ensure consistency
      const updatedDocSnap = await getDoc(userDocRef);

      if (updatedDocSnap.exists()) {
        const updatedData = updatedDocSnap.data();

        // Type guard to ensure updatedData is defined
        if (updatedData) {
          console.log('Document successfully updated:', updatedData);

          // Update local state with data from Firestore
          setUserData({
            email: updatedData.email || userData?.email || '',
            fname: updatedData.fname || '',
            lname: updatedData.lname || '',
            phone: updatedData.phone || '',
            country: updatedData.country || '',
            city: updatedData.city || '',
            state: updatedData.state || '',
          });

          // Update user state if names changed
          if (updatedData.fname !== user.fname || updatedData.lname !== user.lname) {
            setUser({
              ...user,
              fname: updatedData.fname || user.fname,
              lname: updatedData.lname || user.lname,
            });
          }
        }
      } else {
        throw new Error('Document not found after update');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);

      // Provide user-friendly error messages
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to update this profile');
      } else if (error.code === 'not-found') {
        throw new Error('User profile not found');
      } else {
        throw error;
      }
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
    updateUserData,
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
