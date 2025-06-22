// src/state/appStateMachine.ts (Updated)
import { useReducer, useEffect } from 'react';
import { Platform } from 'react-native';
import { OnboardingContext, OnboardingProgress } from '../onboarding/types';
import { getAvailableSteps, isOnboardingComplete } from '../onboarding/stepRegistry';
import { 
  saveOnboardingProgress, 
  getOnboardingProgress, 
  getLanguagePreference,
  isAuthenticatedFromStorage,
  markOnboardingComplete 
} from '../onboarding/utils/storage';

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
  | { type: 'ONBOARDING_COMPLETE' }
  | { type: 'AUTH_SUCCESS'; user: any }
  | { type: 'ERROR'; error: string };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'INITIALIZE_COMPLETE':
      return action.payload;
      
    case 'ONBOARDING_STEP_COMPLETE': {
      if (state.type !== 'onboarding') return state;
      
      const updatedProgress: OnboardingProgress = {
        ...state.progress,
        completedSteps: [...state.progress.completedSteps, action.stepId],
        currentStepIndex: state.progress.currentStepIndex + 1,
        lastActiveAt: new Date().toISOString(),
        data: { ...state.progress.data, ...action.data }
      };
      
      // Update context with new data
      const updatedContext: OnboardingContext = {
        ...state.context,
        ...(action.data?.language && { selectedLanguage: action.data.language }),
        ...(action.data?.deviceInfo && { 
          deviceInfo: { ...state.context.deviceInfo, ...action.data.deviceInfo }
        })
      };
      
      // Save progress to storage
      saveOnboardingProgress(updatedProgress);
      
      return {
        type: 'onboarding',
        context: updatedContext,
        progress: updatedProgress
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
        lastActiveAt: new Date().toISOString()
      };
      
      saveOnboardingProgress(updatedProgress);
      
      return {
        ...state,
        progress: updatedProgress
      };
    }
    
    case 'ONBOARDING_COMPLETE':
      markOnboardingComplete();
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
      // In real app, fetch user data here
      return { type: 'authenticated', user: {} };
    }

    // Get stored data
    const [storedProgress, selectedLanguage] = await Promise.all([
      getOnboardingProgress(),
      getLanguagePreference()
    ]);

    // Build onboarding context (no permissions for now)
    const context: OnboardingContext = {
      userType: storedProgress ? 'returning' : 'new',
      selectedLanguage,
      deviceInfo: {
        platform: Platform.OS as 'ios' | 'android',
        hasNotificationPermission: false,
        hasLocationPermission: false
      }
    };

    // Create or use existing progress
    const progress: OnboardingProgress = storedProgress || {
      completedSteps: [],
      currentStepIndex: 0,
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      data: {}
    };

    // Check if onboarding is complete
    if (isOnboardingComplete(context, progress.completedSteps)) {
      return { type: 'unauthenticated' };
    }

    return {
      type: 'onboarding',
      context,
      progress
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

  const completeOnboarding = () => {
    dispatch({ type: 'ONBOARDING_COMPLETE' });
  };

  const authenticateUser = (user: any) => {
    dispatch({ type: 'AUTH_SUCCESS', user });
  };

  return {
    state,
    completeOnboardingStep,
    goBackToStep,
    completeOnboarding,
    authenticateUser
  };
};