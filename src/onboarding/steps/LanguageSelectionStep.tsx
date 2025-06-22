// src/onboarding/steps/LanguageSelectionStep.tsx
import { LanguageSelection } from '@/src/components/onboarding/LanguageSelection';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Language, OnboardingStepProps } from '../types';
import { saveLanguagePreference } from '../utils/storage';

export const LanguageSelectionStep: React.FC<OnboardingStepProps> = ({ context, onComplete }) => {
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
