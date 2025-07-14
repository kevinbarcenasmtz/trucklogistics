// app/(app)/camera/index.tsx
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { ActionButton } from '@/src/components/camera/CameraUIComponents';
import { CameraNavigationGuard } from '@/src/components/camera/workflow/CameraNavigationGuard';
import { useCameraFlow } from '../../../src/store/cameraFlowStore';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { RouteTypeGuards } from '@/src/types/camera_navigation';

export default function CameraScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  
  const { 
    backgroundColor, 
    textColor, 
    primaryColor,
  } = useAppTheme();

  const { 
    activeFlow, 
    startFlow, 
    updateFlow, 
    hasActiveFlow 
  } = useCameraFlow();

  // Use useCameraPermissions hook for camera permissions
  const [cameraPermissionStatus, requestCameraPermission] = ImagePicker.useCameraPermissions();

  // Handle flow initialization on mount
  useEffect(() => {
    // Check if we have a flowId in params (resuming existing flow)
    if (RouteTypeGuards.hasFlowId(params)) {
      const existingFlow = activeFlow?.id === params.flowId ? activeFlow : null;
      
      if (!existingFlow) {
        console.warn('Flow ID provided but no matching active flow found');
        // Could redirect to error or start new flow
      }
      return;
    }

    // If we have an active flow but no flowId in params, we might be starting fresh
    // This handles the case where user navigates directly to /camera
    if (activeFlow && hasActiveFlow && activeFlow?.currentStep !== 'capture') {
      // Ask user if they want to continue existing flow or start new
      Alert.alert(
        t('camera.existingFlow', 'Continue Previous Session?'),
        t('camera.existingFlowMessage', 'You have an incomplete camera session. Would you like to continue or start fresh?'),
        [
          {
            text: t('common.startFresh', 'Start Fresh'),
            style: 'destructive',
            onPress: () => {
              // Will start new flow when image is selected
            },
          },
          {
            text: t('common.continue', 'Continue'),
            onPress: () => {
              // Navigate to current step of existing flow
              const currentStep = activeFlow.currentStep;
              switch (currentStep) {
                case 'processing':
                case 'review':
                  router.replace('/camera/imagedetails');
                  break;
                case 'verification':
                  router.replace('/camera/verification');
                  break;
                case 'report':
                  router.replace('/camera/report');
                  break;
              }
            },
          },
        ]
      );
    }
  }, [params, activeFlow, hasActiveFlow]);

  // Handle selecting image from library
  const handleSelectImage = async () => {
    try {
      // Provide haptic feedback
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (err) {
        console.warn('Haptic feedback not supported:', err);
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 5],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        // Start new flow with selected image
        startFlow(imageUri);
      }
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert(
        t('error', 'Error'),
        t('imageSelectionError', 'Failed to select image. Please try again.')
      );
    }
  };

  // Handle taking a photo with the camera
  const handleOpenCamera = async () => {
    try {
      // Provide haptic feedback
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (err) {
        console.warn('Haptic feedback not supported:', err);
      }

      // Check camera permissions
      if (!cameraPermissionStatus?.granted) {
        const permissionResult = await requestCameraPermission();
        if (!permissionResult.granted) {
          Alert.alert(
            t('permissionRequired', 'Permission Required'),
            t('cameraPermissionMessage', 'This app needs camera access to scan receipts and documents')
          );
          return;
        }
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 5],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        // Start new flow with captured image
        startFlow(imageUri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(
        t('error', 'Error'),
        t('cameraError', 'Failed to open camera. Please try again.')
      );
    }
  };

  // Handle processing the selected image
  const handleProcess = () => {
    if (!selectedImage || !activeFlow) {
      console.warn('Cannot process: missing image or flow');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.warn('Haptic feedback not supported:', err);
    }

    // Update flow step and navigate
    updateFlow({ currentStep: 'processing' });
    
    // Navigate with flow ID instead of URI
    router.push({
      pathname: '/camera/imagedetails',
      params: { flowId: activeFlow.id },
    });
  };

  // Handle retaking/reselecting an image
  const handleRetake = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.warn('Haptic feedback not supported:', err);
    }

    setSelectedImage(null);
    
    // Reset flow if we had one
    if (activeFlow) {
      updateFlow({ currentStep: 'capture' });
    }
  };

  // Show image from active flow if available
  const displayImage = selectedImage || (activeFlow?.imageUri && activeFlow.currentStep === 'capture' ? activeFlow.imageUri : null);

  return (
    <CameraNavigationGuard targetStep="capture">
      <View style={[styles.container, { backgroundColor }]}>
        {displayImage ? (
          // Show selected image and process button
          <>
            <Image source={{ uri: displayImage }} style={styles.imagePreview} resizeMode="contain" />
            <TouchableOpacity
              onPress={handleRetake}
              style={[styles.retakeButton, { backgroundColor: primaryColor }]}
            >
              <MaterialIcons name="refresh" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.buttonContainer}>
              <ActionButton
                title={t('processImage', 'Process Image')}
                icon="arrow-forward"
                onPress={handleProcess}
                backgroundColor={primaryColor}
                style={styles.processImage}
                disabled={!activeFlow} // Only enable if we have an active flow
              />
            </View>
          </>
        ) : (
          // Show camera and gallery options
          <View style={styles.bottomButtonsContainer}>
            <View style={styles.instructionContainer}>
              <MaterialIcons name="receipt" size={40} color={primaryColor} />
              <Text style={[styles.instructionText, { color: textColor }]}>
                {t(
                  'selectOrTakePhoto',
                  'Take a photo of your receipt or select from your photo library'
                )}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <ActionButton
                title={t('openCamera', 'Open Camera')}
                icon="camera-alt"
                onPress={handleOpenCamera}
                backgroundColor={primaryColor}
                style={styles.actionButton}
              />

              <ActionButton
                title={t('gallery', 'Gallery')}
                icon="photo-library"
                onPress={handleSelectImage}
                backgroundColor={primaryColor}
                style={styles.actionButton}
              />
            </View>
          </View>
        )}
      </View>
    </CameraNavigationGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(30),
    paddingHorizontal: horizontalScale(20),
  },
  instructionText: {
    marginTop: verticalScale(16),
    fontSize: moderateScale(16),
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: horizontalScale(10),
    justifyContent: 'space-between',
    gap: horizontalScale(16),
  },
  actionButton: {
    flex: 1,
    marginHorizontal: horizontalScale(10),
  },
  imagePreview: {
    width: '100%',
    height: '50%',
    marginTop: verticalScale(50),
  },
  buttonContainer: {
    position: 'absolute',
    bottom: verticalScale(120),
    width: '80%',
    alignItems: 'center',
  },
  processImage: {
    width: '100%',
  },
  retakeButton: {
    position: 'absolute',
    top: verticalScale(60),
    right: horizontalScale(20),
    padding: moderateScale(10),
    borderRadius: moderateScale(20),
    zIndex: 999,
  },
  bottomButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(10),
    paddingBottom: verticalScale(100),
  },
});