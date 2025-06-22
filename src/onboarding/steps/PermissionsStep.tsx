// src/onboarding/steps/PermissionsStep.tsx (Updated)
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from '@/src/theme';
import { OnboardingStepProps } from '../types';
import FormButton from '@/src/components/forms/FormButton';

export const PermissionsStep: React.FC<OnboardingStepProps> = ({
  context,
  onComplete,
  onSkip,
  canSkip
}) => {
  const { t } = useTranslation();
  const { theme, isDarkTheme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const [isLoading, setIsLoading] = useState(false);

  const getTextColor = () => isDarkTheme 
    ? themeStyles.colors.white 
    : themeStyles.colors.text.primary;

  const getSecondaryTextColor = () => isDarkTheme 
    ? themeStyles.colors.grey 
    : themeStyles.colors.text.secondary;

  const requestPermissions = async () => {
    setIsLoading(true);
    
    try {
      // Simulate permission request for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock granted permissions
      const permissionsGranted = {
        hasNotificationPermission: true,
        hasLocationPermission: true
      };

      completeStep(permissionsGranted);
    } catch (error) {
      console.error('Error requesting permissions:', error);
      completeStep({});
    } finally {
      setIsLoading(false);
    }
  };

  const completeStep = (permissionData: any) => {
    onComplete({
      deviceInfo: {
        ...context.deviceInfo,
        ...permissionData
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.icon, { color: getTextColor() }]}>
          🔔
        </Text>
        
        <Text style={[styles.title, { color: getTextColor() }]}>
          {t('permissions.title', 'Enable Notifications & Location')}
        </Text>
        
        <Text style={[styles.subtitle, { color: getSecondaryTextColor() }]}>
          {t('permissions.subtitle', 'Get delivery updates and optimize your routes')}
        </Text>
        
        <View style={styles.permissions}>
          <View style={styles.permissionItem}>
            <Text style={[styles.permissionIcon, { color: getTextColor() }]}>📱</Text>
            <View style={styles.permissionText}>
              <Text style={[styles.permissionTitle, { color: getTextColor() }]}>
                {t('permissions.notifications', 'Notifications')}
              </Text>
              <Text style={[styles.permissionDescription, { color: getSecondaryTextColor() }]}>
                {t('permissions.notificationsDesc', 'Stay updated on delivery status')}
              </Text>
            </View>
          </View>
          
          <View style={styles.permissionItem}>
            <Text style={[styles.permissionIcon, { color: getTextColor() }]}>📍</Text>
            <View style={styles.permissionText}>
              <Text style={[styles.permissionTitle, { color: getTextColor() }]}>
                {t('permissions.location', 'Location')}
              </Text>
              <Text style={[styles.permissionDescription, { color: getSecondaryTextColor() }]}>
                {t('permissions.locationDesc', 'Optimize routes and track deliveries')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <FormButton
          buttonTitle={
            isLoading 
              ? t('permissions.enabling', 'Enabling...')
              : t('permissions.enable', 'Enable Permissions')
          }
          onPress={requestPermissions}
          disabled={isLoading}
          backgroundColor={themeStyles.colors.greenThemeColor}
          textColor="#FFFFFF"
        />
        
        {canSkip && onSkip && (
          <FormButton
            buttonTitle={t('permissions.skipForNow', 'Skip for Now')}
            onPress={onSkip}
            backgroundColor="transparent"
            textColor={getTextColor()}
            style={styles.skipButton}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: horizontalScale(24),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: moderateScale(64),
    marginBottom: verticalScale(24),
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(16),
    lineHeight: moderateScale(36),
  },
  subtitle: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginBottom: verticalScale(40),
    paddingHorizontal: horizontalScale(16),
    lineHeight: moderateScale(24),
  },
  permissions: {
    alignSelf: 'stretch',
    paddingHorizontal: horizontalScale(16),
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(24),
    paddingVertical: verticalScale(12),
  },
  permissionIcon: {
    fontSize: moderateScale(24),
    marginRight: horizontalScale(16),
    width: horizontalScale(40),
    textAlign: 'center',
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginBottom: verticalScale(4),
  },
  permissionDescription: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  buttonContainer: {
    paddingBottom: verticalScale(48),
  },
  skipButton: {
    marginTop: verticalScale(16),
  },
});