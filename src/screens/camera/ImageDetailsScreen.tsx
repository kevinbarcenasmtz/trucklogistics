// src/screens/camera/ImageDetailsScreen.tsx
import React, { useCallback, useMemo, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { ActionButton, ScreenHeader } from '../../components/camera/CameraUIComponents';
import {
  ClassificationDisplay,
  ImagePreview,
  RecognizedTextDisplay,
} from '../../components/camera/ImageDetailComponents';
import { ErrorDisplay } from '../../components/ocr/ErrorDisplay';
import { OCRProgress } from '../../components/ocr/OCRProgress';
import { CameraNavigationGuard } from '../../components/camera/workflow/CameraNavigationGuard';
import { useOCR } from '../../context/OCRContext';
import { useCameraFlow } from '../../store/cameraFlowStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { OCRSelectors, OCRStateGuards } from '../../state/ocr/types';
import { horizontalScale, moderateScale, verticalScale } from '../../theme';
import { RouteTypeGuards } from '../../types/camera_navigation';
import type { Receipt } from '../../types/ReceiptInterfaces';

export default function ImageDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { backgroundColor } = useAppTheme();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Get flow data
  const { activeFlow, updateFlow } = useCameraFlow();
  const { state: ocrState, dispatch } = useOCR();

  // Determine image URI and flow validation
  const { imageUri, flowId, isValidNavigation } = useMemo(() => {
    // Check if we have a flow ID (new navigation)
    if (RouteTypeGuards.hasFlowId(params) && activeFlow?.id === params.flowId) {
      return {
        imageUri: activeFlow.imageUri,
        flowId: activeFlow.id,
        isValidNavigation: true,
      };
    }

    // Check for legacy URI parameter
    if (RouteTypeGuards.hasImageUri(params)) {
      return {
        imageUri: params.uri,
        flowId: null,
        isValidNavigation: true,
      };
    }

    // Check if we have an active flow without params (direct navigation)
    if (activeFlow?.imageUri) {
      return {
        imageUri: activeFlow.imageUri,
        flowId: activeFlow.id,
        isValidNavigation: true,
      };
    }

    return {
      imageUri: null,
      flowId: null,
      isValidNavigation: false,
    };
  }, [params, activeFlow]);

  // OCR state selectors
  const currentState = ocrState.state;
  const isProcessing = OCRStateGuards.isProcessing(currentState);
  const isError = OCRStateGuards.isError(currentState);
  const isReviewing = currentState.status === 'reviewing';
  const canRetry = isError && currentState.canRetry;
  const needsImageCapture = currentState.status === 'idle' && imageUri;

  // Helper functions
  const formatCurrency = useCallback((amount?: string) => {
    if (!amount) return '$0.00';
    const cleanAmount = amount.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleanAmount);
    return isNaN(num) ? amount : `$${num.toFixed(2)}`;
  }, []);

  const getConfidenceColor = useCallback((confidence?: number) => {
    if (!confidence) return '#999999';
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FF9800';
    return '#F44336';
  }, []);

  const safeGetProperty = useCallback((obj: any, property: string, defaultValue: any = 'N/A') => {
    return obj && obj[property] ? obj[property] : defaultValue;
  }, []);

  // Start animations when entering review state
  const startAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Handle initial image capture
  const handleImageCapture = useCallback(() => {
    if (imageUri && currentState.status === 'idle') {
      dispatch({ type: 'START_CAPTURE', source: 'gallery' });
      dispatch({ type: 'IMAGE_CAPTURED', uri: imageUri });
      
      // Update flow step
      if (activeFlow) {
        updateFlow({ currentStep: 'processing' });
      }
    }
  }, [imageUri, currentState.status, dispatch, activeFlow, updateFlow]);

  // Action handlers
  const handleContinue = useCallback(() => {
    if (currentState.status !== 'reviewing' || !currentState.data) {
      return;
    }

    const receiptData: Partial<Receipt> = {
      id: Date.now().toString(),
      date: currentState.data.classification.date || new Date().toISOString().split('T')[0],
      type: currentState.data.classification.type || 'Other',
      amount: currentState.data.classification.amount || '$0.00',
      vehicle: currentState.data.classification.vehicle || 'Unknown Vehicle',
      vendorName: currentState.data.classification.vendorName || 'Unknown Vendor',
      location: currentState.data.classification.location || '',
      status: 'Pending',
      extractedText: currentState.data.extractedText,
      imageUri: currentState.data.imageUri,
      timestamp: new Date().toISOString(),
    };

    // Update flow with OCR result and receipt draft
    if (activeFlow) {
      updateFlow({ 
        currentStep: 'verification',
        ocrResult: currentState.data,
        receiptDraft: receiptData,
      });
      
      router.push({
        pathname: '/camera/verification',
        params: { flowId: activeFlow.id },
      });
    } else {
      // Fallback to legacy navigation
      router.push({
        pathname: '/camera/verification',
        params: {
          receipt: JSON.stringify(receiptData),
          uri: currentState.data.imageUri,
        },
      });
    }
  }, [currentState, activeFlow, updateFlow, router]);

  const handleRetry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, [dispatch]);

  const handleCancel = useCallback(() => {
    dispatch({ type: 'CANCEL' });
    router.back();
  }, [dispatch, router]);

  const handleRetake = useCallback(() => {
    dispatch({ type: 'RESET' });
    
    // Reset flow to capture step
    if (activeFlow) {
      updateFlow({ currentStep: 'capture' });
    }
    
    router.back();
  }, [dispatch, activeFlow, updateFlow, router]);

  // Trigger animations when entering review state
  React.useEffect(() => {
    if (isReviewing) {
      startAnimations();
    }
  }, [isReviewing, startAnimations]);

  // Component rendering logic
  const renderContent = () => {
    // Invalid navigation or no image - redirect to capture
    if (!isValidNavigation || !imageUri) {
      router.replace('/camera');
      return null;
    }

    // If we have an image but no flow, create one
    if (imageUri && !activeFlow) {  
      console.log('Creating new flow for image:', imageUri);
      // This should not happen with proper flow management
      router.replace('/camera');
      return null;
    }
    // Handle initial capture
    if (needsImageCapture) {
      return (
        <View style={styles.centerContainer}>
          <ImagePreview uri={imageUri} onScanPress={handleImageCapture} />
        </View>
      );
    }

    // Error state
    if (isError) {
      return (
        <ErrorDisplay
          error={currentState.error}
          onRetry={canRetry ? handleRetry : undefined}
          onDismiss={handleCancel}
        />
      );
    }

    // Processing state
    if (isProcessing) {
      const progress = OCRSelectors.getProgress(ocrState);
      return (
      <OCRProgress
        state={ocrState}
        onCancel={handleCancel}
      />      
      );
    }

    // Review state
    if (isReviewing && currentState.data) {
      return (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            <RecognizedTextDisplay
              text={currentState.data.extractedText}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
            />

            <ClassificationDisplay
              classification={currentState.data.classification}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
              formatCurrency={formatCurrency}
              getConfidenceColor={getConfidenceColor}
            />

            <View style={styles.actionContainer}>
              <ActionButton
                title={t('retakePhoto', 'Retake Photo')}
                icon="camera-alt"
                onPress={handleRetake}
                backgroundColor="transparent"
                color="#666666"
                style={styles.secondaryButton}
              />

              <ActionButton
                title={t('continueToVerification', 'Continue to Verification')}
                icon="arrow-forward"
                onPress={handleContinue}
                style={styles.primaryButton}
              />
            </View>
          </View>
        </ScrollView>
      );
    }

    // Default loading state
    return (
      <View style={styles.centerContainer}>
        <OCRProgress
          state={ocrState}
          onCancel={handleCancel}
        />
      </View>
    );
  };

  // Determine the current step for navigation guard
  const currentStep = needsImageCapture || isProcessing ? 'processing' : 'review';

  return (
    <CameraNavigationGuard targetStep={currentStep}>
      <View style={[styles.container, { backgroundColor }]}>
        <ScreenHeader
          title={isProcessing ? t('processingImage', 'Processing Image') : t('reviewResults', 'Review Results')}
          onBack={() => router.back()}
        />
        {renderContent()}
      </View>
    </CameraNavigationGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(20),
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: horizontalScale(16),
    paddingBottom: verticalScale(100),
    gap: verticalScale(20),
  },
  actionContainer: {
    flexDirection: 'row',
    gap: horizontalScale(12),
    marginTop: verticalScale(20),
  },
  primaryButton: {
    flex: 2,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#666666',
  },
});