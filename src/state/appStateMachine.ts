// src/state/appStateMachine.ts (Updated)
import { useEffect, useReducer } from 'react';
import { Platform } from 'react-native';
import { getAvailableSteps, isOnboardingComplete } from '../onboarding/stepRegistry';
import { OnboardingContext, OnboardingProgress } from '../onboarding/types';
import {
  getLanguagePreference,
  getOnboardingProgress,
  isAuthenticatedFromStorage,
  markOnboardingComplete,
  saveOnboardingProgress,
} from '../onboarding/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AppState =
  | { type: 'initializing' }
  | { type: 'onboarding'; context: OnboardingContext; progress: OnboardingProgress }
  | { type: 'authenticated'; user: any }
  | { type: 'unauthenticated' }
  | { type: 'error'; error: string };

type AppAction =
  | { type: 'INITIALIZE_COMPLETE'; payload: AppState }
  | { type: 'ONBOARDING_STEP_COMPLETE'; stepId: string; data?: any }
  | { type: 'ONBOARDING_GO_BACK'; toStepId: string }
  | { type: 'ONBOARDING_COMPLETE'; callback?: () => void }
  | { type: 'AUTH_SUCCESS'; user: any }
  | { type: 'ERROR'; error: string };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'INITIALIZE_COMPLETE':
      return action.payload;

    case 'ONBOARDING_STEP_COMPLETE': {
      if (state.type !== 'onboarding') return state;

      // ✅ SAFETY CHECK: Ensure stepId is valid before adding
      if (!action.stepId || typeof action.stepId !== 'string') {
        console.warn('Invalid stepId provided to ONBOARDING_STEP_COMPLETE:', action.stepId);
        return state;
      }
    
      const updatedProgress: OnboardingProgress = {
        ...state.progress,
        completedSteps: [...state.progress.completedSteps, action.stepId],
        currentStepIndex: state.progress.currentStepIndex + 1,
        lastActiveAt: new Date().toISOString(),
        data: { ...state.progress.data, ...action.data },
      };
    
      // Update context with new data
      const updatedContext: OnboardingContext = {
        ...state.context,
        ...(action.data?.language && { selectedLanguage: action.data.language }),
        ...(action.data?.deviceInfo && {
          deviceInfo: { ...state.context.deviceInfo, ...action.data.deviceInfo },
        }),
      };
    
      // Save progress to storage
      saveOnboardingProgress(updatedProgress);
    
      return {
        type: 'onboarding',
        context: updatedContext,
        progress: updatedProgress,
      };
    }

    case 'ONBOARDING_GO_BACK': {
      if (state.type !== 'onboarding') return state;

      const availableSteps = getAvailableSteps(state.context);
      const targetStepIndex = availableSteps.findIndex(step => step.id === action.toStepId);

      if (targetStepIndex === -1) return state;

      const updatedProgress: OnboardingProgress = {
        ...state.progress,
        completedSteps: state.progress.completedSteps.slice(0, targetStepIndex),
        currentStepIndex: targetStepIndex,
        lastActiveAt: new Date().toISOString(),
      };

      saveOnboardingProgress(updatedProgress);

      return {
        ...state,
        progress: updatedProgress,
      };
    }

    case 'ONBOARDING_COMPLETE':
      markOnboardingComplete();
      // Trigger a callback to notify AuthContext
      if (action.callback) {
        action.callback();
      }

      return { type: 'unauthenticated' };

    case 'AUTH_SUCCESS':
      return { type: 'authenticated', user: action.user };

    case 'ERROR':
      return { type: 'error', error: action.error };

    default:
      return state;
  }
};

const initializeApp = async (): Promise<AppState> => {
  try {
    // Check if user is authenticated
    const isAuthenticated = await isAuthenticatedFromStorage();
    if (isAuthenticated) {
      return { type: 'authenticated', user: {} };
    }

    // CHECK: Is onboarding already marked complete?
    const isOnboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
    if (isOnboardingCompleted === 'true') {
      return { type: 'unauthenticated' };
    }

    // Get stored data for onboarding flow
    const [storedProgress, selectedLanguage] = await Promise.all([
      getOnboardingProgress(),
      getLanguagePreference(),
    ]);

    // Build onboarding context
    const context: OnboardingContext = {
      userType: storedProgress ? 'returning' : 'new',
      selectedLanguage,
      deviceInfo: {
        platform: Platform.OS as 'ios' | 'android',
        hasNotificationPermission: false,
        hasLocationPermission: false,
      },
    };

    // Create or use existing progress
    const progress: OnboardingProgress = storedProgress || {
      completedSteps: [],
      currentStepIndex: 0,
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      data: {},
    };

    // SAFETY CHECK: Filter out any undefined values from completedSteps
    progress.completedSteps = progress.completedSteps.filter(step => 
      step !== undefined && step !== null && typeof step === 'string'
    );

    // Check if onboarding is complete (backup check)
    if (isOnboardingComplete(context, progress.completedSteps)) {
      // Mark it as complete in storage for consistency
      await markOnboardingComplete();
      return { type: 'unauthenticated' };
    }

    return {
      type: 'onboarding',
      context,
      progress,
    };
  } catch (error) {
    console.error('App initialization error:', error);
    return { type: 'error', error: 'Failed to initialize app' };
  }
};

export const useAppStateMachine = () => {
  const [state, dispatch] = useReducer(appReducer, { type: 'initializing' });

  useEffect(() => {
    initializeApp().then(initialState => {
      dispatch({ type: 'INITIALIZE_COMPLETE', payload: initialState });
    });
  }, []);

  const completeOnboardingStep = (stepId: string, data?: any) => {
    dispatch({ type: 'ONBOARDING_STEP_COMPLETE', stepId, data });
  };

  const goBackToStep = (stepId: string) => {
    dispatch({ type: 'ONBOARDING_GO_BACK', toStepId: stepId });
  };

  const completeOnboarding = (callback?: () => void) => {
    dispatch({ type: 'ONBOARDING_COMPLETE', callback });
  };

  const authenticateUser = (user: any) => {
    dispatch({ type: 'AUTH_SUCCESS', user });
  };

  return {
    state,
    completeOnboardingStep,
    goBackToStep,
    completeOnboarding,
    authenticateUser,
  };
};
