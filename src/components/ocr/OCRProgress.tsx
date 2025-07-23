// src/components/ocr/OCRProgress.tsx
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOCRProcessing } from '../../context/OCRProcessingContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { ProcessingStage, ProcessingStatus } from '../../state/ocr/types';
import { horizontalScale, moderateScale, verticalScale } from '../../theme';

interface OCRProgressProps {
  onCancel: () => void;
}

export function OCRProgress({ onCancel }: OCRProgressProps) {
  const { t } = useTranslation();
  const { surfaceColor, textColor, secondaryTextColor, primaryColor, backgroundColor } =
    useAppTheme();

  // Get state directly from context
  const { state } = useOCRProcessing();

  // Calculate processing time if we have a start timestamp
  const processingTime = state.startTimestamp ? Date.now() - state.startTimestamp : 0;

  const getStageText = (status: ProcessingStatus, stage?: ProcessingStage): string => {
    // First check if we have a specific stage description from backend
    if (state.stageDescription) {
      return state.stageDescription;
    }

    // Otherwise, use status and stage to determine text
    if (status === 'uploading') {
      return t('uploadingImage', 'Uploading Image...');
    }

    if (status === 'processing' && stage) {
      switch (stage) {
        case 'initializing':
          return t('initializingProcess', 'Initializing...');
        case 'uploading_chunks':
          return t('uploadingChunks', 'Uploading chunks...');
        case 'combining_chunks':
          return t('combiningChunks', 'Combining chunks...');
        case 'extracting_text':
          return t('extractingText', 'Extracting Text...');
        case 'classifying_data':
          return t('analyzingReceipt', 'Analyzing Receipt...');
        case 'finalizing':
          return t('finalizingProcess', 'Finalizing...');
        default:
          return t('processing', 'Processing...');
      }
    }

    switch (status) {
      case 'complete':
        return t('processingComplete', 'Complete');
      case 'error':
        return t('processingError', 'Error');
      default:
        return t('processing', 'Processing...');
    }
  };

  const getStageIcon = (status: ProcessingStatus, stage?: ProcessingStage): string => {
    if (status === 'uploading') {
      return 'upload-cloud';
    }

    if (status === 'processing' && stage) {
      switch (stage) {
        case 'initializing':
          return 'settings';
        case 'uploading_chunks':
        case 'combining_chunks':
          return 'layers';
        case 'extracting_text':
          return 'type';
        case 'classifying_data':
          return 'search';
        case 'finalizing':
          return 'check-circle';
        default:
          return 'cpu';
      }
    }

    switch (status) {
      case 'complete':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      default:
        return 'activity';
    }
  };

  // Don't render if idle
  if (state.status === 'idle') {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: surfaceColor }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Feather
            name={getStageIcon(state.status, state.stage) as any}
            size={20}
            color={state.hasError ? '#FF3B30' : primaryColor}
          />
          <Text style={[styles.title, { color: textColor }]}>
            {getStageText(state.status, state.stage)}
          </Text>
        </View>

        {(state.isProcessing || state.isUploading) && (
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Feather name="x" size={20} color={secondaryTextColor} />
          </TouchableOpacity>
        )}
      </View>

      {!state.hasError && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: primaryColor,
                  width: `${Math.round(state.totalProgress)}%`,
                },
              ]}
            />
          </View>
          <View style={styles.progressDetails}>
            <Text style={[styles.progressText, { color: secondaryTextColor }]}>
              {Math.round(state.totalProgress)}%
            </Text>
            {processingTime > 0 && (
              <Text style={[styles.progressText, { color: secondaryTextColor }]}>
                {Math.round(processingTime / 1000)}s
              </Text>
            )}
          </View>
        </View>
      )}

      {state.hasError && state.error && (
        <Text style={[styles.errorText, { color: '#FF3B30' }]}>{state.error.userMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: horizontalScale(8),
  },
  cancelButton: {
    padding: moderateScale(4),
  },
  progressContainer: {
    gap: verticalScale(8),
  },
  progressBar: {
    height: verticalScale(4),
    borderRadius: moderateScale(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: moderateScale(2),
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: moderateScale(12),
  },
  errorText: {
    fontSize: moderateScale(14),
    marginTop: verticalScale(8),
  },
});
