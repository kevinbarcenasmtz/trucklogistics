// src/components/camera/workflow/steps/CaptureStep.tsx

import { useAppTheme } from '@/src/hooks/useAppTheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraFlow } from '../../../../hooks/useCameraFlow';
import { BaseCameraStepProps } from '../../../../types';
import StepTransition from '../StepTransition';

/**
 * CaptureStep Component - Uses store directly instead of props
 */
export const CaptureStep: React.FC<BaseCameraStepProps> = ({
  flowId,
  testID = 'capture-step',
  style,
}) => {
  const { startFlow, getCurrentImage, resetFlow, navigateNext, cancelFlow, currentFlow } =
    useCameraFlow();

  const {
    backgroundColor,
    surfaceColor,
    textColor,
    secondaryTextColor,
    primaryColor,
    borderColor,
  } = useAppTheme();

  const { t } = useTranslation();

  // Local UI state only
  const [cameraPermissionStatus, requestCameraPermission] = ImagePicker.useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);

  // Get current captured image for preview
  const selectedImage = getCurrentImage();
  const showPreview = !!selectedImage;

  /**
   * Handle taking photo with camera
   */
  const handleTakePhoto = async () => {
    if (isCapturing) return;

    try {
      setIsCapturing(true);

      // Check camera permissions
      if (!cameraPermissionStatus?.granted) {
        const permissionResult = await requestCameraPermission();
        if (!permissionResult.granted) {
          Alert.alert(
            t('camera.permissionTitle', 'Camera Permission Required'),
            t('camera.permissionMessage', 'Please allow camera access to capture receipts')
          );
          return;
        }
      }

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.9,
        base64: false,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageCaptured(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[CaptureStep] Camera launch failed:', error);
      Alert.alert(
        t('error.title', 'Error'),
        t('camera.launchFailed', 'Failed to open camera. Please try again.')
      );
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Handle image selection from gallery
   */
  const handleSelectFromGallery = async () => {
    if (isCapturing) return;

    try {
      setIsCapturing(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.9,
        base64: false,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageCaptured(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[CaptureStep] Gallery selection failed:', error);
      Alert.alert(
        t('error.title', 'Error'),
        t('camera.galleryFailed', 'Failed to access photo library. Please try again.')
      );
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Process captured/selected image
   */
  const handleImageCaptured = async (imageUri: string) => {
    try {
      console.log('[CaptureStep] Processing captured image:', !!imageUri);

      if (!imageUri) {
        throw new Error('No image URI provided');
      }

      // Start new flow with captured image
      const result = await startFlow(imageUri);

      if (result.success) {
        console.log('[CaptureStep] Flow started successfully, navigating to processing');
        navigateNext();
      } else {
        throw new Error(result.error || 'Failed to start flow');
      }
    } catch (error) {
      console.error('[CaptureStep] Image processing failed:', error);
      Alert.alert(
        t('error.title', 'Error'),
        t('camera.processingFailed', 'Failed to process image. Please try again.')
      );
    }
  };

  /**
   * Retake photo
   */
  const handleRetake = () => {
    resetFlow();
  };

  /**
   * Proceed with current image
   */
  const handleProceed = () => {
    if (selectedImage && currentFlow) {
      navigateNext();
    }
  };

  /**
   * Cancel workflow
   */
  const handleCancel = () => {
    Alert.alert(
      t('camera.cancelTitle', 'Cancel Process'),
      t('camera.cancelMessage', 'Are you sure you want to cancel?'),
      [
        { text: t('common.no', 'No'), style: 'cancel' },
        {
          text: t('common.yes', 'Yes'),
          style: 'destructive',
          onPress: () => cancelFlow('user_cancelled'),
        },
      ]
    );
  };

  return (
    <StepTransition entering={true}>
      <SafeAreaView style={[styles.container, { backgroundColor }, style]} testID={testID}>
        <View style={[styles.content, { backgroundColor: surfaceColor }]}>
          {!showPreview ? (
            // Capture interface
            <View style={styles.captureContainer}>
              <Text style={[styles.title, { color: textColor }]}>
                {t('camera.captureTitle', 'Capture Receipt')}
              </Text>
              <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
                {t('camera.captureSubtitle', 'Take a photo or select from gallery')}
              </Text>

              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: primaryColor }]}
                  onPress={handleTakePhoto}
                  disabled={isCapturing}
                  testID="take-photo-button"
                >
                  <MaterialIcons name="camera-alt" size={24} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    {isCapturing
                      ? t('camera.capturing', 'Capturing...')
                      : t('camera.takePhoto', 'Take Photo')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: primaryColor }]}
                  onPress={handleSelectFromGallery}
                  disabled={isCapturing}
                  testID="select-gallery-button"
                >
                  <MaterialIcons name="photo-library" size={24} color={primaryColor} />
                  <Text style={[styles.secondaryButtonText, { color: primaryColor }]}>
                    {t('camera.selectFromGallery', 'Select from Gallery')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Preview interface
            <View style={styles.previewContainer}>
              <Text style={[styles.title, { color: textColor }]}>
                {t('camera.previewTitle', 'Review Image')}
              </Text>

              <View style={[styles.imageContainer, { borderColor }]}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              </View>

              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: primaryColor }]}
                  onPress={handleRetake}
                  testID="retake-button"
                >
                  <MaterialIcons name="refresh" size={24} color={primaryColor} />
                  <Text style={[styles.secondaryButtonText, { color: primaryColor }]}>
                    {t('camera.retake', 'Retake')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: primaryColor }]}
                  onPress={handleProceed}
                  testID="proceed-button"
                >
                  <MaterialIcons name="check" size={24} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>{t('camera.proceed', 'Proceed')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            testID="cancel-button"
          >
            <Text style={[styles.cancelButtonText, { color: secondaryTextColor }]}>
              {t('common.cancel', 'Cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </StepTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  captureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  actionContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 32,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cancelButton: {
    alignSelf: 'center',
    padding: 12,
    marginTop: 20,
  },
  cancelButtonText: {
    fontSize: 16,
  },
});

export default CaptureStep;
