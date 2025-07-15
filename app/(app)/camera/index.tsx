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
    surfaceColor,
    secondaryTextColor,
  } = useAppTheme();

  const { 
    activeFlow, 
    startFlow, 
    updateFlow, 
    hasActiveFlow,
    cancelFlow
  } = useCameraFlow();

  // Camera permissions
  const [cameraPermissionStatus, requestCameraPermission] = ImagePicker.useCameraPermissions();

  // Handle flow initialization
  useEffect(() => {
    // Check if resuming existing flow
    if (RouteTypeGuards.hasFlowId(params) && activeFlow?.id === params.flowId) {
      // Resuming existing flow
      if (activeFlow.imageUri) {
        setSelectedImage(activeFlow.imageUri);
      }
      return;
    }

    // Check for orphaned active flow
    if (hasActiveFlow && activeFlow && !params.flowId) {
      // Show continue/restart dialog
      Alert.alert(
        t('camera.existingFlow', 'Continue Previous Session?'),
        t('camera.existingFlowMessage', 'You have an incomplete session. Continue or start fresh?'),
        [
          {
            text: t('common.startFresh', 'Start Fresh'),
            style: 'destructive',
            onPress: () => {
              cancelFlow();
              setSelectedImage(null);
            }
          },
          {
            text: t('common.continue', 'Continue'),
            onPress: () => {
              if (activeFlow.imageUri) {
                setSelectedImage(activeFlow.imageUri);
              }
            }
          }
        ]
      );
    }
  }, [params, activeFlow, hasActiveFlow, cancelFlow, t]);

  const handleImageCapture = async () => {
    try {
      // Check permissions
      if (!cameraPermissionStatus?.granted) {
        const result = await requestCameraPermission();
        if (!result.granted) {
          Alert.alert(
            t('permissions.cameraTitle', 'Camera Permission'),
            t('permissions.cameraMessage', 'Camera access is required to take photos.')
          );
          return;
        }
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(
        t('error', 'Error'),
        t('camera.captureError', 'Failed to capture image')
      );
    }
  };

  const handleImageSelection = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert(
        t('error', 'Error'),
        t('camera.selectionError', 'Failed to select image')
      );
    }
  };

  const processImage = async (uri: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedImage(uri);

      // Start or update flow
      if (!activeFlow) {
        const flow = await startFlow(uri);
        router.push({
          pathname: '/camera/imagedetails',
          params: { flowId: flow.id }
        });
      } else {
        await updateFlow({ 
          imageUri: uri,
          currentStep: 'processing' 
        });
        router.push({
          pathname: '/camera/imagedetails',
          params: { flowId: activeFlow.id }
        });
      }
    } catch (error) {
      console.error('Process image error:', error);
      Alert.alert(
        t('error', 'Error'),
        t('camera.processError', 'Failed to process image')
      );
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
    if (activeFlow) {
      updateFlow({ 
        imageUri: undefined,
        currentStep: 'capture' 
      });
    }
  };

  const renderContent = () => {
    if (selectedImage) {
      return (
        <View style={styles.previewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          <View style={styles.previewActions}>
            <ActionButton
              title={t('camera.retake', 'Retake')}
              icon="camera"
              onPress={handleRetake}
              backgroundColor={surfaceColor}
              color={textColor}
              style={styles.actionButton}
            />
            <ActionButton
              title={t('camera.continue', 'Continue')}
              icon="arrow-forward"
              onPress={() => processImage(selectedImage)}
              style={styles.actionButton}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.captureContainer}>
        <View style={[styles.placeholder, { backgroundColor: surfaceColor }]}>
          <MaterialIcons name="receipt" size={64} color={secondaryTextColor} />
          <Text style={[styles.placeholderText, { color: secondaryTextColor }]}>
            {t('camera.placeholder', 'Capture or select a receipt')}
          </Text>
        </View>

        <View style={styles.actions}>
          <ActionButton
            title={t('camera.takePhoto', 'Take Photo')}
            icon="camera"
            onPress={handleImageCapture}
            style={styles.mainButton}
          />
          
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: surfaceColor }]}
            onPress={handleImageSelection}
          >
            <MaterialIcons name="photo-library" size={24} color={primaryColor} />
            <Text style={[styles.secondaryButtonText, { color: textColor }]}>
              {t('camera.selectFromGallery', 'Select from Gallery')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <CameraNavigationGuard targetStep="capture">
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>
            {t('camera.title', 'Scan Receipt')}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        {renderContent()}
      </View>
    </CameraNavigationGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(16),
    paddingTop: verticalScale(50),
    paddingBottom: verticalScale(24),
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '600',
  },
  captureContainer: {
    flex: 1,
    padding: horizontalScale(16),
  },
  placeholder: {
    flex: 1,
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  placeholderText: {
    fontSize: moderateScale(16),
    marginTop: verticalScale(16),
  },
  actions: {
    gap: verticalScale(12),
  },
  mainButton: {
    height: verticalScale(56),
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: verticalScale(56),
    borderRadius: moderateScale(12),
    gap: horizontalScale(8),
  },
  secondaryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    padding: horizontalScale(16),
  },
  previewImage: {
    flex: 1,
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(20),
  },
  previewActions: {
    flexDirection: 'row',
    gap: horizontalScale(12),
  },
  actionButton: {
    flex: 1,
    height: verticalScale(56),
  },
});