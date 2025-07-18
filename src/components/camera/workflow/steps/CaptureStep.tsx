// src/components/camera/steps/CaptureStep.tsx

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
 * CaptureStep Component - Pure UI component for image capture
 * Migrated from OCR Context to useCameraFlow hook
 */
export const CaptureStep: React.FC<BaseCameraStepProps> = ({
  flowId,
  onNext,
  onCancel,
  onError,
  testID = 'capture-step',
}) => {
  const { startFlow, getCurrentImage } = useCameraFlow();

  const { backgroundColor, surfaceColor, textColor, secondaryTextColor, primaryColor } =
    useAppTheme();

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
          onError({
            step: 'capture',
            code: 'CAMERA_PERMISSION_DENIED',
            message: 'Camera permission is required to capture receipts',
            userMessage: 'Please allow camera access to capture receipts',
            timestamp: Date.now(),
            retryable: true,
          });
          return;
        }
      }

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      onError({
        step: 'capture',
        code: 'CAMERA_LAUNCH_FAILED',
        message: error instanceof Error ? error.message : 'Failed to open camera',
        userMessage: 'Failed to open camera. Please try again.',
        timestamp: Date.now(),
        retryable: true,
      });
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Handle selecting image from gallery
   */
  const handleSelectFromGallery = async () => {
    if (isCapturing) return;

    try {
      setIsCapturing(true);

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      onError({
        step: 'capture',
        code: 'GALLERY_SELECTION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to select image',
        userMessage: 'Failed to select image. Please try again.',
        timestamp: Date.now(),
        retryable: true,
      });
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Handle image captured - start new flow
   */
  const handleImageCaptured = async (imageUri: string) => {
    try {
      console.log('[CaptureStep] Image captured, starting flow:', imageUri);

      // Start new camera flow with captured image
      const result = await startFlow(imageUri);

      if (result.success) {
        console.log('[CaptureStep] Flow started successfully:', result.flowId);
        // Navigation will be handled by the coordinator based on flow state
        // No need to call onNext here
      } else {
        throw new Error(result.error || 'Failed to start flow');
      }
    } catch (error) {
      console.error('[CaptureStep] Failed to start flow:', error);
      onError({
        step: 'capture',
        code: 'FLOW_START_FAILED',
        message: error instanceof Error ? error.message : 'Failed to start processing flow',
        userMessage: 'Failed to start processing. Please try again.',
        timestamp: Date.now(),
        retryable: true,
      });
    }
  };

  /**
   * Handle proceeding with current image
   */
  const handleProceed = () => {
    if (selectedImage) {
      // Image already captured and flow started, coordinator will handle navigation
      console.log('[CaptureStep] Proceeding with captured image');
      onNext();
    }
  };

  /**
   * Handle retaking photo
   */
  const handleRetake = () => {
    Alert.alert(
      t('camera.retakeTitle', 'Retake Photo'),
      t('camera.retakeMessage', 'Are you sure you want to retake the photo?'),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('camera.retake', 'Retake'),
          style: 'destructive',
          onPress: handleTakePhoto,
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor,
    },
    content: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: textColor,
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: secondaryTextColor,
      textAlign: 'center',
      marginBottom: 40,
    },
    captureArea: {
      width: '100%',
      maxWidth: 300,
      aspectRatio: 0.7, // Receipt-like aspect ratio
      borderRadius: 12,
      borderWidth: 2,
      borderColor: primaryColor,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 30,
      backgroundColor: surfaceColor,
    },
    previewImage: {
      width: '100%',
      height: '100%',
      borderRadius: 10,
      resizeMode: 'cover',
    },
    captureIcon: {
      marginBottom: 15,
    },
    captureText: {
      fontSize: 16,
      color: secondaryTextColor,
      textAlign: 'center',
    },
    buttonContainer: {
      width: '100%',
      gap: 15,
    },
    primaryButton: {
      backgroundColor: primaryColor,
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: primaryColor,
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: primaryColor,
    },
    previewContainer: {
      width: '100%',
      gap: 15,
    },
    retakeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      <StepTransition entering={true}>
        <View style={styles.content}>
          {/* Title and subtitle */}
          <Text style={styles.title}>
            {showPreview
              ? t('camera.reviewCapture', 'Review Your Capture')
              : t('camera.captureReceipt', 'Capture Receipt')}
          </Text>
          <Text style={styles.subtitle}>
            {showPreview
              ? t('camera.reviewSubtitle', 'Make sure the receipt is clear and readable')
              : t('camera.captureSubtitle', 'Take a photo or select from gallery')}
          </Text>

          {/* Capture area or image preview */}
          <View style={styles.captureArea}>
            {showPreview ? (
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            ) : (
              <>
                <MaterialIcons
                  name="camera-alt"
                  size={60}
                  color={primaryColor}
                  style={styles.captureIcon}
                />
                <Text style={styles.captureText}>
                  {t('camera.tapToCapture', 'Tap to capture receipt')}
                </Text>
              </>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            {showPreview ? (
              // Preview mode buttons
              <View style={styles.previewContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleProceed}
                  disabled={isCapturing}
                  testID="proceed-button"
                >
                  <Text style={styles.primaryButtonText}>{t('camera.proceed', 'Proceed')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleRetake}
                  disabled={isCapturing}
                  testID="retake-button"
                >
                  <View style={styles.retakeButton}>
                    <MaterialIcons name="refresh" size={20} color={primaryColor} />
                    <Text style={styles.secondaryButtonText}>{t('camera.retake', 'Retake')}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              // Capture mode buttons
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleTakePhoto}
                  disabled={isCapturing}
                  testID="take-photo-button"
                >
                  <Text style={styles.primaryButtonText}>
                    {isCapturing
                      ? t('camera.opening', 'Opening Camera...')
                      : t('camera.takePhoto', 'Take Photo')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSelectFromGallery}
                  disabled={isCapturing}
                  testID="select-gallery-button"
                >
                  <Text style={styles.secondaryButtonText}>
                    {t('camera.selectFromGallery', 'Select from Gallery')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </StepTransition>
    </SafeAreaView>
  );
};

export default CaptureStep;
