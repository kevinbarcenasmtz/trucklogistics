// src/screens/camera/ImageDetailsScreen.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { ActionButton, ScreenHeader } from '../../components/camera/CameraUIComponents';
import {
  ClassificationDisplay,
  ImagePreview,
  RecognizedTextDisplay,
} from '../../components/camera/ImageDetailComponents';
import { CameraNavigationGuard } from '../../components/camera/workflow/CameraNavigationGuard';
import { ErrorDisplay } from '../../components/ocr/ErrorDisplay';
import { OCRProgress } from '../../components/ocr/OCRProgress';
import { useOCR } from '../../context/OCRContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { OCRSelectors, OCRStateGuards } from '../../state/ocr/types';
import { useCameraFlow } from '../../store/cameraFlowStore';
import { horizontalScale, verticalScale } from '../../theme';
import { RouteTypeGuards } from '../../types/camera_navigation';
import type { Receipt } from '../../types/ReceiptInterfaces';

export default function ImageDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { backgroundColor, primaryColor, errorColor } = useAppTheme();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Get flow data
  const { activeFlow, updateFlow } = useCameraFlow();
  const { state: ocrContextState, dispatch } = useOCR();

  // Extract the actual OCR state from the context wrapper
  const ocrState = ocrContextState.state;

  // Validate navigation and get flow data
  const { flowId, imageUri, currentStep } = useMemo(() => {
    if (!RouteTypeGuards.hasFlowId(params) || !activeFlow || activeFlow.id !== params.flowId) {
      return { flowId: null, imageUri: null, currentStep: null };
    }

    return {
      flowId: activeFlow.id,
      imageUri: activeFlow.imageUri,
      currentStep: activeFlow.currentStep,
    };
  }, [params, activeFlow]);

  // Determine which step we're on (processing or review)
  const isProcessingStep = currentStep === 'processing' || !activeFlow?.ocrResult;
  const isReviewStep = currentStep === 'review' && activeFlow?.ocrResult;

  // Get OCR state flags
  const isProcessing = OCRStateGuards.isProcessing(ocrState);
  const isReviewing = ocrState.status === 'reviewing';
  const isError = OCRStateGuards.isError(ocrState);
  const canRetry = OCRSelectors.canRetry(ocrContextState);

  // Auto-trigger OCR when entering processing step
  useEffect(() => {
    if (isProcessingStep && imageUri && ocrState.status === 'idle') {
      dispatch({
        type: 'IMAGE_CAPTURED',
        uri: imageUri,
      });
    }
  }, [isProcessingStep, imageUri, ocrState.status, dispatch]);

  // Update flow when OCR completes
  useEffect(() => {
    if (isReviewing && 'data' in ocrState && ocrState.data) {
      updateFlow({
        currentStep: 'review',
        ocrResult: ocrState.data,
      });
    }
  }, [isReviewing, ocrState, updateFlow]);

  // Animation trigger
  const startAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Navigation handlers
  const handleProceedToVerification = useCallback(() => {
    if (!activeFlow || !isReviewing || !('data' in ocrState) || !ocrState.data) return;

    const receiptData: Receipt = {
      id: `receipt_${Date.now()}`,
      type: ocrState.data.classification.type || 'Other',
      amount: ocrState.data.classification.amount || '$0.00',
      vehicle: ocrState.data.classification.vehicle || 'Unknown Vehicle',
      vendorName: ocrState.data.classification.vendorName || 'Unknown Vendor',
      location: ocrState.data.classification.location || '',
      status: 'Pending',
      extractedText: ocrState.data.extractedText,
      imageUri: ocrState.data.imageUri,
      timestamp: new Date().toISOString(),
      date: ocrState.data.classification.date || new Date().toISOString(),
    };

    // Update flow with receipt draft
    updateFlow({
      currentStep: 'verification',
      receiptDraft: receiptData,
    });

    router.push({
      pathname: '/camera/verification',
      params: { flowId: activeFlow.id },
    });
  }, [activeFlow, isReviewing, ocrState, updateFlow, router]);

  const handleRetry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, [dispatch]);

  const handleCancel = useCallback(() => {
    dispatch({ type: 'CANCEL' });
    router.back();
  }, [dispatch, router]);

  const handleRetake = useCallback(() => {
    if (!activeFlow) return;

    dispatch({ type: 'RESET' });
    updateFlow({
      currentStep: 'capture',
      ocrResult: undefined,
      receiptDraft: undefined,
    });

    router.replace('/camera');
  }, [dispatch, activeFlow, updateFlow, router]);

  // Trigger animations when ready
  useEffect(() => {
    if (isReviewing) {
      startAnimations();
    }
  }, [isReviewing, isReviewStep, ocrState.status, startAnimations]);

  // Render content based on state
  const renderContent = () => {
    if (!imageUri) return null;

    // Error state
    if (isError && 'error' in ocrState) {
      return (
        <ErrorDisplay
          error={ocrState.error}
          onRetry={canRetry ? handleRetry : undefined}
          onDismiss={handleCancel}
        />
      );
    }

    // Processing state
    if (isProcessing || (isProcessingStep && ocrState.status !== 'reviewing')) {
      return (
        <View style={styles.centerContainer}>
          <OCRProgress state={ocrContextState} onCancel={handleCancel} />
        </View>
      );
    }

    // Review state
    if (isReviewing && 'data' in ocrState && ocrState.data) {
      return (
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <ImagePreview uri={imageUri} onScanPress={() => {}} />

            <ClassificationDisplay
              classification={ocrState.data.classification}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
              formatCurrency={amount => amount || '$0.00'}
              getConfidenceColor={confidence =>
                confidence && confidence > 0.8 ? '#4CAF50' : '#FF9800'
              }
            />

            <RecognizedTextDisplay
              text={ocrState.data.extractedText}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
            />
          </ScrollView>

          <View style={styles.buttonContainer}>
            <ActionButton
              title={t('camera.retake', 'Retake Photo')}
              onPress={handleRetake}
              backgroundColor={errorColor}
              style={styles.button}
            />
            <ActionButton
              title={t('camera.continue', 'Continue')}
              onPress={handleProceedToVerification}
              backgroundColor={primaryColor}
              style={styles.button}
            />
          </View>
        </Animated.View>
      );
    }

    return null;
  };

  // Determine target step for navigation guard
  const targetStep = isProcessingStep ? 'processing' : 'review';

  return (
    <CameraNavigationGuard targetStep={targetStep}>
      <View style={[styles.container, { backgroundColor }]}>
        <ScreenHeader
          title={
            isProcessingStep ? t('camera.processing', 'Processing') : t('camera.review', 'Review')
          }
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
    padding: horizontalScale(20),
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: horizontalScale(16),
    paddingBottom: verticalScale(100),
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: horizontalScale(16),
    paddingBottom: verticalScale(30),
    gap: horizontalScale(12),
  },
  button: {
    flex: 1,
  },
});
