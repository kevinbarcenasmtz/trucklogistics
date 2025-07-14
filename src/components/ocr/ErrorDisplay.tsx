// src/components/ocr/ErrorDisplay.tsx
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { OCRError } from '../../state/ocr/types';
import { horizontalScale, moderateScale, verticalScale } from '../../theme';
import { ActionButton } from '../camera/CameraUIComponents';

interface ErrorDisplayProps {
  error: OCRError;
  onRetry?: () => void;
  onDismiss: () => void;
}

export function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  const { t } = useTranslation();
  const { textColor, secondaryTextColor, errorColor, primaryColor, getSurfaceColor } =
    useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: 'rgba(255, 59, 48, 0.1)',
          borderColor: 'rgba(255, 59, 48, 0.2)',
        },
      ]}
    >
      <View style={styles.header}>
        <MaterialIcons name="error" size={24} color={errorColor} />
        <Text style={[styles.title, { color: textColor }]}>
          {t('processingError', 'Processing Error')}
        </Text>
      </View>

      <Text style={[styles.message, { color: secondaryTextColor }]}>{error.userMessage}</Text>

      <View style={styles.buttonContainer}>
        {onRetry && error.retryable && (
          <ActionButton
            title={t('retry', 'Retry')}
            icon="refresh"
            onPress={onRetry}
            backgroundColor={primaryColor}
            style={styles.button}
          />
        )}

        <ActionButton
          title={t('cancel', 'Cancel')}
          icon="cancel" // Changed from "x" to valid MaterialIcons name
          onPress={onDismiss}
          backgroundColor={getSurfaceColor()}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: horizontalScale(8),
  },
  message: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(16),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: horizontalScale(12),
  },
  button: {
    flex: 1,
  },
});
