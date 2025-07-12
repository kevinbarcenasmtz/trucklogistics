// src/screens/camera/ImageDetailsScreen.refactored.tsx
import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../hooks/useAppTheme';
import { horizontalScale, verticalScale } from '../../theme';
import { useOCR } from '../../context/OCRContext';
import { ocrService } from '../../services/ocr/OCRService';
import { ScreenHeader, ActionButton } from '../../components/camera/CameraUIComponents';
import { 
  ImagePreview, 
  RecognizedTextDisplay, 
  ClassificationDisplay,
  AnalyzingIndicator
} from '../../components/camera/ImageDetailComponents';
import type { AIClassifiedReceipt, Receipt } from '../../types/ReceiptInterfaces';

export default function ImageDetailsScreen() {
  const { uri } = useLocalSearchParams();
  const { state, dispatch, retry, cancel } = useOCR();
  const { t } = useTranslation();
  const { backgroundColor, secondaryTextColor, primaryColor } = useAppTheme();

  const [recognizedText, setRecognizedText] = useState<string>('');
  const [classifiedData, setClassifiedData] = useState<AIClassifiedReceipt | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // ✅ Memoize helper functions to prevent recreating on every render
  const formatCurrency = useCallback((amount?: string): string => {
    if (!amount) return '$0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount || 0);
  }, []);

  const getConfidenceColor = useCallback((confidence: number): string => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FF9800';
    return '#F44336';
  }, []);

  const safeGetProperty = useCallback(<T,>(obj: any, property: string, defaultValue: T): T => {
    return obj && obj[property] !== undefined ? obj[property] : defaultValue;
  }, []);

  // ✅ Memoize animation start function
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

  // ✅ Process image with proper dependencies
  const processImage = useCallback(async (imageUri: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      dispatch({ type: 'IMAGE_CAPTURED', uri: imageUri });

      const result = await ocrService.processImage(
        imageUri,
        (action) => {
          dispatch(action);
          
          if (action.type === 'EXTRACT_COMPLETE') {
            setRecognizedText(action.text);
          }
          if (action.type === 'CLASSIFY_COMPLETE') {
            setClassifiedData(action.classification);
          }
        },
        state.context.correlationId
      );

      setRecognizedText(result.extractedText);
      setClassifiedData(result.classification);
      startAnimations();

    } catch (err) {
      console.error('OCR processing failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);
      dispatch({ 
        type: 'ERROR', 
        error: {
          code: 'PROCESSING_FAILED',
          message: errorMessage,
          userMessage: 'Failed to process the image. Please try again.',
          retryable: true
        }
      });
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch, state.context.correlationId, startAnimations]);

  // ✅ Handler functions with useCallback
  const handleImageScan = useCallback(() => {
    if (uri) {
      processImage(uri as string);
    }
  }, [uri, processImage]);

  const handleContinue = useCallback(() => {
    if (!recognizedText) {
      alert(t('extractTextFirst', 'Please extract the text first'));
      return;
    }

    const receiptData: Partial<Receipt> = {
      id: Date.now().toString(),
      date: classifiedData?.date || new Date().toISOString().split('T')[0],
      type: classifiedData?.type || 'Other',
      amount: classifiedData?.amount || '$0.00',
      vehicle: classifiedData?.vehicle || 'Unknown Vehicle',
      vendorName: classifiedData?.vendorName || 'Unknown Vendor',
      location: classifiedData?.location || '',
      status: 'Pending',
      extractedText: recognizedText,
      imageUri: uri as string,
      timestamp: new Date().toISOString(),
    };

    router.push({
      pathname: '/camera/verification',
      params: {
        receipt: JSON.stringify(receiptData),
        imageUri: uri as string,
      },
    });
  }, [recognizedText, classifiedData, uri, t]);

  const handleRetry = useCallback(async () => {
    setRecognizedText('');
    setClassifiedData(null);
    setError(null);
    
    if (uri) {
      await processImage(uri as string);
    }
  }, [uri, processImage]);

  const handleCancel = useCallback(() => {
    cancel();
    router.back();
  }, [cancel]);

  const handleRetake = useCallback(() => {
    setRecognizedText('');
    setClassifiedData(null);
    setError(null);
    
    if (uri) {
      processImage(uri as string);
    }
  }, [uri, processImage]);

  // ✅ useEffect with proper dependencies
  useEffect(() => {
    if (uri && !recognizedText && !isProcessing) {
      processImage(uri as string);
    }

    return () => {
      ocrService.cancel();
    };
  }, [uri, recognizedText, isProcessing, processImage]);

  // ✅ Memoize computed values
  const showImagePreview = useMemo(() => 
    !recognizedText && !isProcessing && !error && uri, 
    [recognizedText, isProcessing, error, uri]
  );

  const showActionButtons = useMemo(() => 
    recognizedText && !isProcessing && !error, 
    [recognizedText, isProcessing, error]
  );

  // ✅ Memoize style objects
  const containerStyle = useMemo(() => [
    styles.container, 
    { backgroundColor }
  ], [backgroundColor]);

  const errorContainerStyle = useMemo(() => [
    styles.errorContainer, 
    { backgroundColor: 'rgba(255, 59, 48, 0.1)' }
  ], []);

  const debugContainerStyle = useMemo(() => [
    styles.debugContainer, 
    { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
  ], []);

  return (
    <View style={containerStyle}>
      <ScreenHeader 
        title={t('receiptScanner', 'Receipt Scanner')}
        onBack={handleCancel}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          
          {/* Error Display */}
          {error && (
            <View style={errorContainerStyle}>
              <Text style={[styles.errorText, { color: '#FF3B30' }]}>
                {error}
              </Text>
              <ActionButton
                title={t('retry', 'Retry')}
                icon="refresh"
                onPress={handleRetry}
                backgroundColor={primaryColor}
                style={styles.retryButton}
              />
            </View>
          )}

          {/* Image Preview - ✅ No inline function */}
          {showImagePreview && (
            <ImagePreview 
              uri={uri as string} 
              onScanPress={handleImageScan}
            />
          )}

          {/* Processing Indicator */}
          {isProcessing && <AnalyzingIndicator />}

          {/* Text Recognition Results */}
          {recognizedText && (
            <RecognizedTextDisplay
              text={recognizedText}
              fadeAnim={fadeAnim}
              slideAnim={slideAnim}
            />
          )}

          {/* Classification Results */}
          {classifiedData && (
            <ClassificationDisplay
              data={classifiedData}
              formatCurrency={formatCurrency}
              getConfidenceColor={getConfidenceColor}
              safeGetProperty={safeGetProperty}
            />
          )}

          {/* Action Buttons */}
          {showActionButtons && (
            <View style={styles.buttonContainer}>
              <ActionButton
                title={t('continue', 'Continue')}
                icon="arrow-forward"
                onPress={handleContinue}
                backgroundColor="#4CAF50"
                style={styles.button}
              />
              
              <ActionButton
                title={t('retake', 'Retake Photo')}
                icon="camera-alt"
                onPress={handleRetake}
                backgroundColor="#757575"
                style={styles.button}
              />
            </View>
          )}

          {/* Debug info */}
          {__DEV__ && (
            <View style={debugContainerStyle}>
              <Text style={[styles.debugText, { color: secondaryTextColor }]}>
                OCR Status: {state.state.status}
              </Text>
              <Text style={[styles.debugText, { color: secondaryTextColor }]}>
                Has Text: {recognizedText ? 'Yes' : 'No'}
              </Text>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  contentContainer: {
    padding: horizontalScale(16),
    paddingBottom: verticalScale(32),
  },
  errorContainer: {
    padding: horizontalScale(16),
    borderRadius: 12,
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  errorText: { fontSize: 14, marginBottom: verticalScale(12), textAlign: 'center' },
  retryButton: { marginTop: verticalScale(8) },
  buttonContainer: { gap: verticalScale(12), marginTop: verticalScale(16) },
  button: { borderWidth: 0 },
  debugContainer: { marginTop: verticalScale(24), padding: horizontalScale(12), borderRadius: 8 },
  debugText: { fontSize: 12, marginBottom: 4 },
});