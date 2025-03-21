// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  statusCodes,
  SignInSuccessResponse
} from '@react-native-google-signin/google-signin';

// React Native Firebase imports
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Initialize Google Sign-In (now imported from separate file)
import '../config/googleSignIn';

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
};

// Error handling helper
const handleAuthError = (error: any) => {
  console.log('Auth error:', {
    code: error.code,
    message: error.message,
    fullError: JSON.stringify(error, null, 2)
  });

  let errorMessage = 'An error occurred during sign in';

  switch (error.code) {
    case 'auth/user-not-found':
      errorMessage = 'No user found with this email';
      break;
    case 'auth/wrong-password':
      errorMessage = 'Incorrect password';
      break;
    case 'auth/invalid-email':
      errorMessage = 'Invalid email format';
      break;
    case 'auth/email-already-in-use':
      errorMessage = 'Email already in use';
      break;
    case 'auth/weak-password':
      errorMessage = 'Password is too weak';
      break;
    case 'auth/user-disabled':
      errorMessage = 'This account has been disabled';
      break;
    case 'auth/too-many-requests':
      errorMessage = 'Too many failed login attempts. Please try again later';
      break;
    // Google Sign-In specific errors
    case 'auth/operation-not-allowed':
      errorMessage = 'Operation not allowed';
      break;
    // Google Sign-In native errors
    case 'SIGN_IN_CANCELLED':
      errorMessage = 'Sign in was cancelled';
      break;
    case 'IN_PROGRESS':
      errorMessage = 'Sign in is already in progress';
      break;
    case 'PLAY_SERVICES_NOT_AVAILABLE':
      errorMessage = 'Google Play Services is not available';
      break;
    default:
      errorMessage = error.message;
  }

  Alert.alert('Error', errorMessage);
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
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem("onboardingCompleted");
        setIsOnboardingCompleted(value === "true");
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setIsOnboardingCompleted(false);
      }
    };
    
    checkOnboardingStatus();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
          const userDocData = userDoc.data();
          
          if (userDocData) {
            setUser({
              uid: firebaseUser.uid,
              email: userDocData.email || '',
              fname: userDocData.fname || '',
              lname: userDocData.lname || '',
              createdAt: userDocData.createdAt
            });
    
            setUserData({
              email: userDocData.email,
              fname: userDocData.fname,
              lname: userDocData.lname,
              phone: userDocData.phone,
              country: userDocData.country,
              city: userDocData.city,
              state: userDocData.state
            });
          } else {
            setUser(null);
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
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
      validateEmail(email);
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (email: string, password: string, fname: string, lname: string) => {
    try {
      setLoading(true);
      validateEmail(email);
      validatePassword(password);
      
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const newUser = {
        uid: userCredential.user.uid,
        email,
        fname,
        lname,
        createdAt: firestore.Timestamp.now(),
      };
      
      await firestore().collection('users').doc(userCredential.user.uid).set(newUser);
    } catch (error: any) {
      handleAuthError(error);
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
      setUser(null);
      setUserData(null);
      router.replace("/(auth)/login");
    } catch (error: any) {
      handleAuthError(error);
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
        showPlayServicesUpdateDialog: true 
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
          const userDoc = await firestore()
            .collection('users')
            .doc(userCredential.user.uid)
            .get();
  
          if (!userDoc.exists) {
            const newUser = {
              uid: userCredential.user.uid,
              fname: user.givenName || '',
              lname: user.familyName || '',
              email: user.email || '',
              createdAt: firestore.Timestamp.now(),
            };
  
            await firestore()
              .collection('users')
              .doc(userCredential.user.uid)
              .set(newUser);
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
      validateEmail(email);
      await auth().sendPasswordResetEmail(email);
      Alert.alert('Success', 'Password reset email has been sent');
    } catch (error: any) {
      handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem("onboardingCompleted", "true");
      setIsOnboardingCompleted(true);
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error setting onboarding status:", error);
      Alert.alert('Error', 'Could not complete onboarding');
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};