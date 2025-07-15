// app/(app)/camera/index.tsx
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ActionButton } from '@/src/components/camera/CameraUIComponents';
import { CameraNavigationGuard } from '@/src/components/camera/workflow/CameraNavigationGuard';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { RouteTypeGuards } from '@/src/types/camera_navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOCR } from '../../../src/context/OCRContext';
import { useCameraFlow } from '../../../src/store/cameraFlowStore';

export default function CameraScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false); // Add this flag
  const dialogShownRef = useRef<string | null>(null); // Track which flow already showed
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();

  const { backgroundColor, textColor, primaryColor, surfaceColor, secondaryTextColor } =
    useAppTheme();

  const { activeFlow, startFlow, updateFlow, hasActiveFlow, cancelFlow, cleanupOldFlows } =
    useCameraFlow();

  // Add OCR context to reset state when needed
  const { dispatch: dispatchOCR } = useOCR();
  // Camera permissions
  const [cameraPermissionStatus, requestCameraPermission] = ImagePicker.useCameraPermissions();

  // Cleanup effect - runs once on mount
  useEffect(() => {
    cleanupOldFlows();
  }, []); // Empty dependency array

  // Reset processing flag when component unmounts
  useEffect(() => {
    return () => {
      setIsProcessingImage(false);
      dialogShownRef.current = null;
    };
  }, []);
  // Flow management effect - with debugging
  // Focus effect with debouncing and duplicate prevention
  useFocusEffect(
    useCallback(() => {
      // Add a small delay to let any ongoing navigation complete
      const timer = setTimeout(() => {
        console.log('🔍 CAMERA SCREEN: Screen focused (after delay)');
        console.log('📋 Params:', JSON.stringify(params, null, 2));
        console.log(
          '🏃 Active Flow:',
          activeFlow
            ? {
                id: activeFlow.id,
                currentStep: activeFlow.currentStep,
                imageUri: !!activeFlow.imageUri,
                stepHistory: activeFlow.stepHistory,
                timestamp: new Date(activeFlow.timestamp).toISOString(),
              }
            : null
        );
        console.log('🎯 Has Active Flow:', hasActiveFlow);
        console.log('🔄 Is Processing Image:', isProcessingImage);

        // Don't show dialog if we're processing an image
        if (isProcessingImage) {
          console.log('🚫 Skipping dialog - currently processing image');
          return;
        }

        // Check if resuming existing flow
        if (RouteTypeGuards.hasFlowId(params) && activeFlow?.id === params.flowId) {
          console.log('✅ RESUMING existing flow - matching flowId');
          if (activeFlow.imageUri) {
            setSelectedImage(activeFlow.imageUri);
          }
          return;
        }

        // Check for orphaned active flow with meaningful progress
        if (hasActiveFlow && activeFlow && !params.flowId) {
          // Prevent showing dialog for same flow twice
          if (dialogShownRef.current === activeFlow.id) {
            console.log('🚫 Dialog already shown for this flow');
            return;
          }

          console.log('⚠️  ORPHANED FLOW DETECTED');

          const hasProgress =
            activeFlow.imageUri ||
            activeFlow.ocrResult ||
            activeFlow.currentStep !== 'capture' ||
            activeFlow.stepHistory.length > 1;

          console.log('📊 Progress Check:', {
            hasImageUri: !!activeFlow.imageUri,
            hasOcrResult: !!activeFlow.ocrResult,
            currentStep: activeFlow.currentStep,
            stepHistoryLength: activeFlow.stepHistory.length,
            hasProgress,
            dialogShownFor: dialogShownRef.current,
          });

          if (hasProgress) {
            console.log('🚨 SHOWING continuation dialog - flow has progress');
            dialogShownRef.current = activeFlow.id; // Mark dialog as shown

            Alert.alert(
              t('camera.existingFlow', 'Continue Previous Session?'),
              t(
                'camera.existingFlowMessage',
                'You have an incomplete session. Continue or start fresh?'
              ),
              [
                {
                  text: t('common.startFresh', 'Start Fresh'),
                  style: 'destructive',
                  onPress: () => {
                    console.log('🔄 USER CHOSE: Start Fresh');
                    cancelFlow();
                    resetOCRState();
                    setSelectedImage(null);
                    dialogShownRef.current = null; // Reset dialog tracking
                  },
                },
                {
                  text: t('common.continue', 'Continue'),
                  onPress: () => {
                    console.log('🔄 USER CHOSE: Continue');
                    if (activeFlow.imageUri) {
                      setSelectedImage(activeFlow.imageUri);
                      const targetRoute = getRouteForStep(activeFlow.currentStep);
                      console.log('🧭 Navigating to:', targetRoute);
                      router.push({
                        pathname: targetRoute,
                        params: { flowId: activeFlow.id },
                      });
                    }
                  },
                },
              ]
            );
          } else {
            console.log('🧹 AUTO-CANCELLING flow without progress');
            cancelFlow();
            resetOCRState();
            dialogShownRef.current = null; // Reset dialog tracking
          }
        } else {
          console.log('✅ NORMAL LOAD - no active flow or valid params');
        }
      }, 100); // 100ms delay

      return () => clearTimeout(timer);
    }, [params.flowId, activeFlow?.id, hasActiveFlow, isProcessingImage])
  );

  // Helper function to reset OCR state
  const resetOCRState = () => {
    dispatchOCR({ type: 'RESET' });
  };

  // Helper function to get route for flow step
  const getRouteForStep = (step: string) => {
    switch (step) {
      case 'processing':
      case 'review':
        return '/camera/imagedetails';
      case 'verification':
        return '/camera/verification';
      case 'report':
        return '/camera/report';
      default:
        return '/camera';
    }
  };

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
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.9,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(t('error', 'Error'), t('camera.captureError', 'Failed to capture image'));
    }
  };

  const handleImageSelection = async () => {
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
      console.error('Gallery error:', error);
      Alert.alert(t('error', 'Error'), t('camera.selectionError', 'Failed to select image'));
    }
  };

  const processImage = async (uri: string) => {
    try {
      console.log('🚀 PROCESS IMAGE: Starting');
      setIsProcessingImage(true); // Set flag to prevent dialog

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedImage(uri);

      // Reset OCR state to ensure clean start
      resetOCRState();

      // Initialize OCR state machine for capturing
      dispatchOCR({
        type: 'START_CAPTURE',
        source: 'camera',
      });

      // Start or update flow
      if (!activeFlow) {
        const flow = await startFlow(uri);

        console.log('🚀 NAVIGATION: Creating flow and navigating to:', {
          flowId: flow.id,
          targetPath: '/camera/imagedetails',
        });

        // Dispatch image captured to OCR state machine
        dispatchOCR({
          type: 'IMAGE_CAPTURED',
          uri: uri,
        });

        // Mark that we've handled this flow to prevent dialog
        dialogShownRef.current = flow.id;

        // Use replace instead of push to avoid keeping camera screen in stack
        router.replace({
          pathname: '/camera/imagedetails',
          params: { flowId: flow.id },
        });
      } else {
        await updateFlow({
          imageUri: uri,
          currentStep: 'processing',
        });

        console.log('🚀 NAVIGATION: Updating existing flow and navigating:', {
          flowId: activeFlow.id,
          targetPath: '/camera/imagedetails',
        });

        // Dispatch image captured to OCR state machine
        dispatchOCR({
          type: 'IMAGE_CAPTURED',
          uri: uri,
        });

        // Mark that we've handled this flow to prevent dialog
        dialogShownRef.current = activeFlow.id;

        // Use replace instead of push
        router.replace({
          pathname: '/camera/imagedetails',
          params: { flowId: activeFlow.id },
        });
      }
    } catch (error) {
      console.error('Process image error:', error);
      setIsProcessingImage(false); // Reset flag on error
      Alert.alert(t('error', 'Error'), t('camera.processError', 'Failed to process image'));
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
    if (activeFlow) {
      updateFlow({
        imageUri: undefined,
        currentStep: 'capture',
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
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
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
      </SafeAreaView>
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
