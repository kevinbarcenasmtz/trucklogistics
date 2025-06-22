import { useReducer, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import * as Haptics from 'expo-haptics';

type OnboardingStep = 'language' | 'intro' | 'features' | 'permissions' | 'complete';
type Language = 'en' | 'es';

interface OnboardingState {
    step: OnboardingStep,
    selectedLanguage: Language | null;
    isLoading: boolean;
    error: string | null;
}
type OnboardingAction = 
  | { type: 'SELECT_LANGUAGE'; language: Language }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'COMPLETE_ONBOARDING' };

  const STEP_ORDER: OnboardingStep[] = ['language', 'intro', 'features', 'permissions'];

  const onboardingReducer = (state: OnboardingState, action: OnboardingAction): OnboardingState => {
    switch(action.type){
        case 'SELECT_LANGUAGE':
            return { ...state, selectedLanguage: action.language, error: null };
          
          case 'NEXT_STEP': {
            const currentIndex = STEP_ORDER.indexOf(state.step);
            const nextStep = currentIndex < STEP_ORDER.length - 1 
              ? STEP_ORDER[currentIndex + 1] 
              : 'complete';
            return { ...state, step: nextStep, error: null };
          }
          
          case 'PREVIOUS_STEP': {
            const currentIndex = STEP_ORDER.indexOf(state.step);
            const prevStep = currentIndex > 0 
              ? STEP_ORDER[currentIndex - 1] 
              : state.step;
            return { ...state, step: prevStep, error: null };
          }
          
          case 'SET_LOADING':
            return { ...state, isLoading: action.loading };
          
          case 'SET_ERROR':
            return { ...state, error: action.error, isLoading: false };
          
          case 'COMPLETE_ONBOARDING':
            return { ...state, step: 'complete', isLoading: false, error: null };
          
          default:
            return state;
    }
  };

  export const useOnboardingStateMachine = () => {
    const { i18n } = useTranslation();
    
    const [state, dispatch] = useReducer(onboardingReducer, {
      step: 'language',
      selectedLanguage: null,
      isLoading: false,
      error: null,
    });
  
    const selectLanguage = useCallback(async (language: Language) => {
        try {
          dispatch({ type: 'SET_LOADING', loading: true });
          
          // Haptic feedback
          await Haptics.selectionAsync().catch(() => {});
          
          // Save language preference
          await AsyncStorage.setItem('userLanguage', language);
          await AsyncStorage.setItem('languageSelected', 'true');
          
          // Change app language
          await i18n.changeLanguage(language);
          
          dispatch({ type: 'SELECT_LANGUAGE', language });
          
          // Auto-proceed to next step after a brief delay
          setTimeout(() => {
            dispatch({ type: 'NEXT_STEP' });
            dispatch({ type: 'SET_LOADING', loading: false });
          }, 800); // Small delay to show the selection state
          
        } catch {
          dispatch({ type: 'SET_ERROR', error: 'Failed to set language' });
        }
    }, [i18n]);
  
    const nextStep = useCallback(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        dispatch({ type: 'NEXT_STEP' });
    }, []);
      
    const previousStep = useCallback(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        dispatch({ type: 'PREVIOUS_STEP' });
    }, []);
  
    const completeOnboarding = useCallback(async () => {
      try {
        dispatch({ type: 'SET_LOADING', loading: true });
        
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        
        dispatch({ type: 'COMPLETE_ONBOARDING' });
      } catch {
        dispatch({ type: 'SET_ERROR', error: 'Failed to complete onboarding' });
      }
    }, []);
  
    const canProceed = state.step === 'language' ? state.selectedLanguage !== null : true;
    const isFirstStep = state.step === 'language';
    const isLastStep = STEP_ORDER.indexOf(state.step) === STEP_ORDER.length - 1;
  
    return {
      state,
      actions: {
        selectLanguage,
        nextStep,
        previousStep,
        completeOnboarding,
      },
      computed: {
        canProceed,
        isFirstStep,
        isLastStep,
        stepIndex: STEP_ORDER.indexOf(state.step),
        totalSteps: STEP_ORDER.length,
      }
    };
  };