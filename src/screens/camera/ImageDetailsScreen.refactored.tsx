// src/screens/camera/ImageDetailsScreen.refactored.tsx
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActionButton, ScreenHeader } from '../../components/camera/CameraUIComponents';
import {
  ClassificationDisplay,
  ImagePreview,
  RecognizedTextDisplay,
} from '../../components/camera/ImageDetailComponents';
import { ErrorDisplay } from '../../components/ocr/ErrorDisplay';
import { OCRProgress } from '../../components/ocr/OCRProgress';
import { useOCR } from '../../context/OCRContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { OCRSelectors, OCRState, OCRStateGuards } from '../../state/ocr/types';
import { horizontalScale, moderateScale, verticalScale } from '../../theme';
import type { Receipt } from '../../types/ReceiptInterfaces';

// ✅ Separate component for results view
function ResultsView({
  state,
  imageUri,
  onContinue,
  onRetake,
  formatCurrency,
  getConfidenceColor,
  safeGetProperty,
  fadeAnim,
  slideAnim,
}: {
  state: OCRState;
  imageUri: string;
  onContinue: () => void;
  onRetake: () => void;
  formatCurrency: (amount?: string) => string;
  getConfidenceColor: (confidence: number) => string;
  safeGetProperty: <T>(obj: any, property: string, defaultValue: T) => T;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}) {
  const { t } = useTranslation();

  if (state.status !== 'reviewing' || !state.data) {
    return null;
  }

  const { extractedText, classification } = state.data;

  return (
    <>
      <RecognizedTextDisplay text={extractedText} fadeAnim={fadeAnim} slideAnim={slideAnim} />

      <ClassificationDisplay
        data={classification}
        formatCurrency={formatCurrency}
        getConfidenceColor={getConfidenceColor}
        safeGetProperty={safeGetProperty}
      />

      <View style={styles.buttonContainer}>
        <ActionButton
          title={t('continue', 'Continue')}
          icon="arrow-forward"
          onPress={onContinue}
          backgroundColor="#4CAF50"
          style={styles.button}
        />

        <ActionButton
          title={t('retake', 'Retake Photo')}
          icon="camera-alt"
          onPress={onRetake}
          backgroundColor="#757575"
          style={styles.button}
        />
      </View>
    </>
  );
}

export default function ImageDetailsScreen() {
  const { uri } = useLocalSearchParams();
  const { state, dispatch } = useOCR();
  const { t } = useTranslation();
  const {
    backgroundColor,
    textColor,
    secondaryTextColor,
    primaryColor,
    errorColor,
    successColor,
    getButtonBackground,
  } = useAppTheme();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // ✅ Derive all state from the state machine
  const currentState = state.state;
  const context = state.context;
  const progress = useMemo(() => OCRSelectors.getProgress(state), [state]);
  const isProcessing = useMemo(() => OCRStateGuards.isProcessing(currentState), [currentState]);
  const canRetry = useMemo(() => OCRSelectors.canRetry(state), [state]);
  const isError = currentState.status === 'error';
  const isReviewing = currentState.status === 'reviewing';
  const needsImageCapture = currentState.status === 'idle' && uri;

  // ✅ Memoized helper functions
  const formatCurrency = useCallback((amount?: string): string => {
    if (!amount) return '$0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount || 0);
  }, []);

  const getConfidenceColor = useCallback(
    (confidence: number): string => {
      if (confidence >= 0.8) return successColor;
      if (confidence >= 0.6) return '#FF9800';
      return errorColor;
    },
    [successColor, errorColor]
  );

  const safeGetProperty = useCallback(<T,>(obj: any, property: string, defaultValue: T): T => {
    return obj && obj[property] !== undefined ? obj[property] : defaultValue;
  }, []);

  // ✅ Start animations when entering review state
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

  // ✅ Handle initial image capture (no useEffect!)
  const handleImageCapture = useCallback(() => {
    if (uri && currentState.status === 'idle') {
      // Start the OCR process
      dispatch({ type: 'START_CAPTURE', source: 'gallery' });
      dispatch({ type: 'IMAGE_CAPTURED', uri: uri as string });

      // The OCRContext will handle the actual processing
      // through side effects managed in the context
    }
  }, [uri, currentState.status, dispatch]);

  // ✅ Action handlers
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

    router.push({
      pathname: '/camera/verification',
      params: {
        receipt: JSON.stringify(receiptData),
        imageUri: currentState.data.imageUri,
      },
    });
  }, [currentState]);

  const handleRetry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, [dispatch]);

  const handleCancel = useCallback(() => {
    dispatch({ type: 'CANCEL' });
    router.back();
  }, [dispatch]);

  const handleRetake = useCallback(() => {
    dispatch({ type: 'RESET' });
    router.back();
  }, [dispatch]);

  // ✅ Trigger animations when entering review state
  React.useEffect(() => {
    if (isReviewing) {
      startAnimations();
    }
  }, [isReviewing, startAnimations]);

  // ✅ Component-based conditional rendering
  const renderContent = () => {
    // Handle initial capture
    if (needsImageCapture) {
      return (
        <View style={styles.centerContainer}>
          <ImagePreview uri={uri as string} onScanPress={handleImageCapture} />
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

    // Processing states - Use the OCRProgress component
    if (isProcessing) {
      return <OCRProgress state={state} onCancel={handleCancel} />;
    }

    // Review state with results
    if (isReviewing) {
      return (
        <ResultsView
          state={currentState}
          imageUri={uri as string}
          onContinue={handleContinue}
          onRetake={handleRetake}
          formatCurrency={formatCurrency}
          getConfidenceColor={getConfidenceColor}
          safeGetProperty={safeGetProperty}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
        />
      );
    }

    // Idle or other states
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.statusText, { color: secondaryTextColor }]}>
          {t('readyToScan', 'Ready to scan')}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScreenHeader title={t('receiptScanner', 'Receipt Scanner')} onBack={handleCancel} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>{renderContent()}</View>
      </ScrollView>

      {/* Debug info in development */}
      {__DEV__ && (
        <View style={[styles.debugContainer, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <Text style={styles.debugText}>
            Status: {currentState.status} | Progress: {Math.round(progress * 100)}%
          </Text>
          {context.correlationId && (
            <Text style={styles.debugText}>Correlation: {context.correlationId.slice(-8)}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    padding: horizontalScale(16),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(32),
  },
  buttonContainer: {
    gap: verticalScale(12),
    marginTop: verticalScale(24),
    marginBottom: verticalScale(32),
  },
  button: {
    borderWidth: 0,
  },
  statusText: {
    fontSize: moderateScale(16),
    marginTop: verticalScale(16),
    textAlign: 'center',
  },
  debugContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: horizontalScale(8),
  },
  debugText: {
    color: 'white',
    fontSize: moderateScale(10),
    fontFamily: 'monospace',
  },
});
