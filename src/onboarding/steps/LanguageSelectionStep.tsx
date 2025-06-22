// src/onboarding/steps/LanguageSelectionStep.tsx
import React from 'react';
import { OnboardingStepProps, Language } from '../types';
import { LanguageSelection } from '@/src/components/onboarding/LanguageSelection';
import { saveLanguagePreference } from '../utils/storage';
import { useTranslation } from 'react-i18next';

export const LanguageSelectionStep: React.FC<OnboardingStepProps> = ({
  context,
  onComplete
}) => {
  const { i18n } = useTranslation();

  const handleLanguageSelect = async (language: Language) => {
    try {
      // Save to storage
      await saveLanguagePreference(language);
      
      // Update i18n
      await i18n.changeLanguage(language);
      
      // Complete step
      onComplete({ language });
    } catch (error) {
      console.error('Failed to set language:', error);
      // Still complete the step to not block user
      onComplete({ language });
    }
  };

  return (
    <LanguageSelection
      selectedLanguage={context.selectedLanguage}
      onSelectLanguage={handleLanguageSelect}
      isLoading={false}
      error={null}
    />
  );
};