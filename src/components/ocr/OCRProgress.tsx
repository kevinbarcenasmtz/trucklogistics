// src/components/ocr/OCRProgress.tsx
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { OCRStateWithContext } from '../../state/ocr/types';
import { OCRSelectors } from '../../state/ocr/types';
import { horizontalScale, moderateScale, verticalScale } from '../../theme';

interface OCRProgressProps {
  state: OCRStateWithContext;
  onCancel: () => void;
}

export function OCRProgress({ state, onCancel }: OCRProgressProps) {
  const { t } = useTranslation();
  const { surfaceColor, textColor, secondaryTextColor, primaryColor, backgroundColor } =
    useAppTheme();

  const progress = OCRSelectors.getProgress(state);
  const processingTime = OCRSelectors.getProcessingTime(state);

  const getStageText = (status: string): string => {
    switch (status) {
      case 'optimizing':
        return t('optimizingImage', 'Optimizing Image...');
      case 'uploading':
        return t('uploadingImage', 'Uploading Image...');
      case 'processing':
        return t('processingImage', 'Processing Image...');
      case 'extracting':
        return t('extractingText', 'Extracting Text...');
      case 'classifying':
        return t('analyzingReceipt', 'Analyzing Receipt...');
      default:
        return t('processing', 'Processing...');
    }
  };

  const getStageIcon = (status: string): any => {
    switch (status) {
      case 'optimizing':
        return 'image';
      case 'uploading':
        return 'upload-cloud';
      case 'processing':
        return 'cpu';
      case 'extracting':
        return 'type';
      case 'classifying':
        return 'search';
      default:
        return 'activity';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: surfaceColor }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Feather name={getStageIcon(state.state.status)} size={20} color={primaryColor} />
          <Text style={[styles.title, { color: textColor }]}>
            {getStageText(state.state.status)}
          </Text>
        </View>

        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Feather name="x" size={20} color={secondaryTextColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: primaryColor,
                width: `${Math.round(progress * 100)}%`,
              },
            ]}
          />
        </View>

        <Text style={[styles.progressText, { color: secondaryTextColor }]}>
          {Math.round(progress * 100)}% • {Math.round(processingTime / 1000)}s
        </Text>
      </View>
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
  progressText: {
    fontSize: moderateScale(12),
    textAlign: 'center',
  },
});
