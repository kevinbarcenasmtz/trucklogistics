import { useOCR } from '@/src/context/OCRContext';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraFlow } from '../../../../store/cameraFlowStore';
import { ActionButton } from '../../CameraUIComponents';
import StepTransition from '../StepTransition';
import { StepProps } from '../types';

export const CaptureStep: React.FC<StepProps> = ({ flowId, onNext, onCancel, onError }) => {
  const { activeFlow, startFlow, updateFlow } = useCameraFlow();
  const { dispatch: dispatchOCR } = useOCR();
  const { backgroundColor, surfaceColor, textColor, secondaryTextColor, primaryColor } =
    useAppTheme();
  const { t } = useTranslation();

  // UI-only state
  const [cameraPermissionStatus, requestCameraPermission] = ImagePicker.useCameraPermissions();
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Derive UI state from flow store
  const selectedImage = activeFlow?.imageUri;
  const showPreview = !!selectedImage;

  useEffect(() => {
    // Reset OCR state when entering capture step
    dispatchOCR({ type: 'RESET' });
  }, [dispatchOCR]);

  const handleTakePhoto = async () => {
    try {
      // Check camera permissions
      if (!cameraPermissionStatus?.granted) {
        const permissionResult = await requestCameraPermission();
        if (!permissionResult.granted) {
          onError({
            code: 'CAMERA_PERMISSION_DENIED',
            message: 'Camera permission is required to capture receipts',
            step: 'capture',
            retry: true,
          });
          return;
        }
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.9,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      onError({
        code: 'CAMERA_LAUNCH_FAILED',
        message: 'Failed to open camera. Please try again.',
        step: 'capture',
        retry: true,
      });
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.9,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      onError({
        code: 'GALLERY_SELECTION_FAILED',
        message: 'Failed to select image. Please try again.',
        step: 'capture',
        retry: true,
      });
    }
  };

  const processImage = async (uri: string) => {
    try {
      setIsProcessingImage(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Reset OCR state for clean start
      dispatchOCR({ type: 'RESET' });
      dispatchOCR({ type: 'START_CAPTURE', source: 'camera' });

      // Update flow with captured image
      if (!activeFlow) {
        // Start new flow
        await startFlow(uri);
      } else {
        // Update existing flow
        updateFlow({ imageUri: uri });
      }

      // Advance to processing step
      onNext();
    } catch (error) {
      onError({
        code: 'IMAGE_PROCESSING_FAILED',
        message: 'Failed to process image. Please try again.',
        step: 'capture',
        retry: true,
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRetake = () => {
    updateFlow({
      imageUri: undefined,
      ocrResult: undefined,
      currentStep: 'capture',
    });
    dispatchOCR({ type: 'RESET' });
  };

  const handleContinue = () => {
    if (selectedImage) {
      updateFlow({ currentStep: 'processing' });
      onNext();
    }
  };

  const handleCancelFlow = () => {
    Alert.alert(
      t('camera.cancelTitle', 'Cancel Scanning'),
      t('camera.cancelMessage', 'Are you sure you want to cancel? Any progress will be lost.'),
      [
        { text: t('camera.continueScan', 'Continue Scanning'), style: 'cancel' },
        { text: t('common.cancel', 'Cancel'), style: 'destructive', onPress: onCancel },
      ]
    );
  };

  return (
    <StepTransition entering={true}>
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        {/* Image Preview Section */}
        {showPreview && (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Camera Controls Section */}
        <View style={[styles.controlsContainer, { backgroundColor: surfaceColor }]}>
          {!showPreview ? (
            <>
              <View style={[styles.placeholder, { backgroundColor: surfaceColor }]}>
                <MaterialIcons name="receipt" size={64} color={secondaryTextColor} />
                <Text style={[styles.instructionText, { color: textColor }]}>
                  {t('camera.instruction', 'Take a photo of your receipt or select from gallery')}
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <ActionButton
                  title={t('camera.takePhoto', 'Take Photo')}
                  icon="camera"
                  onPress={handleTakePhoto}
                  disabled={isProcessingImage}
                  style={styles.primaryButton}
                />

                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: surfaceColor }]}
                  onPress={handleSelectFromGallery}
                  disabled={isProcessingImage}
                >
                  <MaterialIcons name="photo-library" size={24} color={primaryColor} />
                  <Text style={[styles.secondaryButtonText, { color: textColor }]}>
                    {t('camera.selectFromGallery', 'Select from Gallery')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.buttonContainer}>
              <ActionButton
                title={t('camera.retake', 'Retake')}
                onPress={handleRetake}
                backgroundColor={surfaceColor}
                color={textColor}
                style={styles.secondaryButton}
              />

              <ActionButton
                title={t('common.continue', 'Continue')}
                onPress={handleContinue}
                style={styles.primaryButton}
              />
            </View>
          )}

          <ActionButton
            title={t('common.cancel', 'Cancel')}
            onPress={handleCancelFlow}
            backgroundColor={surfaceColor}
            color={textColor}
            style={styles.cancelButton}
          />
        </View>
      </SafeAreaView>
    </StepTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  controlsContainer: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 200,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderRadius: 12,
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    marginBottom: 8,
  },
  secondaryButton: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    marginTop: 8,
  },
});

export default CaptureStep;
