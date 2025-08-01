// src/components/camera/workflow/steps/VerificationStep.tsx

import { useAppTheme } from '@/src/hooks/useAppTheme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraFlow } from '../../../../hooks/useCameraFlow';
import { useReceiptDraft } from '../../../../hooks/useReceiptDraft';
import { BaseCameraStepProps } from '../../../../types/component_props';
import { Receipt } from '../../../../types/ReceiptInterfaces';
import {
  EditField,
  FormContainer,
  SaveButton,
  ViewRawTextButton,
} from '../../VerificationComponents';
import StepTransition from '../StepTransition';

/**
 * VerificationStep Component - Uses store directly instead of props
 */
export const VerificationStep: React.FC<BaseCameraStepProps> = ({
  flowId,
  testID = 'verification-step',
  style,
}) => {
  const {
    getCurrentProcessedData,
    saveCurrentReceipt,
    navigateBack,
    navigateNext,
    cancelFlow,
    isSaving: flowIsSaving,
  } = useCameraFlow();

  const {
    draft,
    originalData,
    isDirty,
    isSaving,
    fieldsWithErrors,
    modifiedFields,
    errorCount,
    updateField,
    validateField,
    validateAll,
    saveChanges,
    resetChanges,
    clearFieldError,
    getFieldError,
    isFieldModified,
    isFieldValid,
    initializeFromProcessedData,
  } = useReceiptDraft({
    enableAutoValidation: true,
    enableAutoSave: false,
    validationMode: 'onChange',
  });

  // Updated to use new semantic theme colors
  const {
    screenBackground,
    cardBackground,
    textPrimary,
    textSecondary,
    primary,
    borderDefault,
    error,
    warning,
    success,
  } = useAppTheme();

  const { t } = useTranslation();

  // Local UI state
  const [activeField, setActiveField] = useState<keyof Receipt | null>(null);
  const [showRawTextModal, setShowRawTextModal] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  /**
   * Handle field value changes with validation
   */
  const handleFieldChange = useCallback(
    (field: keyof Receipt, value: any) => {
      console.log('[VerificationStep] Field changed:', { field, value });

      // Clear any existing error for this field
      clearFieldError(field);

      // Update field value
      updateField(field, value);

      // Trigger validation for this field
      setTimeout(() => {
        validateField(field, { showWarnings: true });
      }, 100);
    },
    [updateField, validateField, clearFieldError]
  );

  /**
   * Handle saving with validation
   */
  const handleSave = useCallback(async () => {
    try {
      console.log('[VerificationStep] Starting save process');

      // Validate all fields first
      const isValidForm = validateAll({ showWarnings: false });

      if (!isValidForm) {
        Alert.alert(
          t('verification.validationError', 'Validation Error'),
          t('verification.fixErrors', 'Please fix the validation errors before saving.'),
          [{ text: t('common.ok', 'OK') }]
        );
        return;
      }

      // Save using the hook
      const saveResult = await saveChanges({
        validateBeforeSave: true,
        skipIfNotDirty: false,
      });

      if (saveResult) {
        console.log('[VerificationStep] Save successful, proceeding to next step');

        // Also save at flow level
        const flowSaveResult = await saveCurrentReceipt();

        if (flowSaveResult.success) {
          navigateNext();
        } else {
          throw new Error(flowSaveResult.error || 'Flow save failed');
        }
      } else {
        throw new Error('Save operation failed');
      }
    } catch (error) {
      console.error('[VerificationStep] Save failed:', error);
      Alert.alert(
        t('error.title', 'Error'),
        t('verification.saveFailed', 'Failed to save receipt. Please try again.')
      );
    }
  }, [validateAll, saveChanges, saveCurrentReceipt, navigateNext, t]);

  /**
   * Handle back navigation with unsaved changes check
   */
  const handleBack = useCallback(() => {
    if (isDirty) {
      setPendingNavigation(() => () => navigateBack());
      setShowUnsavedChangesDialog(true);
    } else {
      navigateBack();
    }
  }, [isDirty, navigateBack]);

  /**
   * Handle cancel with unsaved changes check
   */
  const handleCancel = useCallback(() => {
    if (isDirty) {
      setPendingNavigation(() => () => cancelFlow('user_cancelled_verification'));
      setShowUnsavedChangesDialog(true);
    } else {
      cancelFlow('user_cancelled_verification');
    }
  }, [isDirty, cancelFlow]);

  /**
   * Handle unsaved changes dialog response
   */
  const handleUnsavedChangesResponse = useCallback(
    (action: 'save' | 'discard' | 'cancel') => {
      setShowUnsavedChangesDialog(false);

      switch (action) {
        case 'save':
          handleSave().then(() => {
            if (pendingNavigation) {
              pendingNavigation();
            }
          });
          break;
        case 'discard':
          resetChanges();
          if (pendingNavigation) {
            pendingNavigation();
          }
          break;
        case 'cancel':
          // Do nothing, stay on current screen
          break;
      }

      setPendingNavigation(null);
    },
    [handleSave, resetChanges, pendingNavigation]
  );

  /**
   * Handle viewing raw extracted text
   */
  const handleViewRawText = useCallback(() => {
    setShowRawTextModal(true);
  }, []);

  /**
   * Get field error message
   */
  const getFieldErrorMessage = useCallback(
    (field: keyof Receipt): string | undefined => {
      return getFieldError(field);
    },
    [getFieldError]
  );

  /**
   * Check if field has error
   */
  const hasFieldError = useCallback(
    (field: keyof Receipt): boolean => {
      return fieldsWithErrors.includes(field);
    },
    [fieldsWithErrors]
  );

  /**
   * Get field status color
   */
  const getFieldStatusColor = useCallback(
    (field: keyof Receipt): string => {
      if (hasFieldError(field)) return error;
      if (isFieldModified(field)) return warning;
      if (isFieldValid(field)) return success;
      return borderDefault;
    },
    [hasFieldError, isFieldModified, isFieldValid, error, warning, success, borderDefault]
  );

  // Initialize draft from processed data
  useEffect(() => {
    const processedData = getCurrentProcessedData();
    if (processedData && !draft) {
      console.log('[VerificationStep] Initializing draft from processed data');
      initializeFromProcessedData(processedData);
    }
  }, [getCurrentProcessedData, draft, initializeFromProcessedData]);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [handleBack]);

  // Validate draft data exists - moved after all hooks
  if (!draft) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: screenBackground }, style]} testID={testID}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: textPrimary }}>Loading draft data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: screenBackground,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: borderDefault,
      backgroundColor: cardBackground,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: textSecondary,
    },
    statusBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: borderDefault,
    },
    statusItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusText: {
      fontSize: 12,
      color: textSecondary,
    },
    statusTextModified: {
      color: warning,
      fontWeight: '600',
    },
    statusTextError: {
      color: error,
      fontWeight: '600',
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 120, // Space for fixed buttons
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      borderTopWidth: 1,
      backgroundColor: cardBackground,
      borderTopColor: borderDefault,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: 'transparent',
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: primary,
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: primary,
    },
    cancelButton: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    cancelButtonText: {
      fontSize: 14,
      color: textSecondary,
    },
    bottomSpacing: {
      height: 20,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: cardBackground,
      borderRadius: 12,
      padding: 20,
      margin: 20,
      maxHeight: '80%',
      minWidth: '90%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: textPrimary,
      marginBottom: 16,
      textAlign: 'center',
    },
    modalText: {
      fontSize: 12,
      color: textPrimary,
      fontFamily: 'monospace',
      lineHeight: 16,
    },
    modalButton: {
      backgroundColor: primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    modalButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={[styles.container, style]} testID={testID}>
      <StepTransition entering={true}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('verification.title', 'Verify Receipt')}</Text>
          <Text style={styles.subtitle}>
            {t('verification.subtitle', 'Review and edit the extracted information')}
          </Text>
        </View>

        {/* Status bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <MaterialIcons
              name={isDirty ? 'edit' : 'check'}
              size={16}
              color={isDirty ? warning : success}
            />
            <Text style={[styles.statusText, isDirty && styles.statusTextModified]}>
              {isDirty
                ? t('verification.unsaved', 'Unsaved changes')
                : t('verification.saved', 'No changes')}
            </Text>
          </View>

          <View style={styles.statusItem}>
            <MaterialIcons
              name={errorCount > 0 ? 'error' : 'check-circle'}
              size={16}
              color={errorCount > 0 ? error : success}
            />
            <Text style={[styles.statusText, errorCount > 0 && styles.statusTextError]}>
              {errorCount > 0
                ? t('verification.errors', `${errorCount} errors`)
                : t('verification.valid', 'Valid')}
            </Text>
          </View>

          <View style={styles.statusItem}>
            <MaterialIcons
              name="edit-note"
              size={16}
              color={modifiedFields.length > 0 ? warning : textSecondary}
            />
            <Text style={styles.statusText}>
              {t('verification.modified', `${modifiedFields.length} modified`)}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <FormContainer title={t('verification.basicInfo', 'Basic Information')}>
            <EditField
              field="date"
              value={draft.date}
              onChange={value => handleFieldChange('date', value)}
              isActive={activeField === 'date'}
              onActivate={() => setActiveField('date')}
              icon="event"
              label={t('verification.date', 'Date')}
              placeholder={t('verification.datePlaceholder', 'YYYY-MM-DD')}
            />

            <EditField
              field="amount"
              value={draft.amount}
              onChange={value => handleFieldChange('amount', value)}
              isActive={activeField === 'amount'}
              onActivate={() => setActiveField('amount')}
              icon="attach-money"
              label={t('verification.amount', 'Amount')}
              placeholder={t('verification.amountPlaceholder', 'Enter amount')}
              keyboardType="decimal-pad"
            />

            <EditField
              field="vendorName"
              value={draft.vendorName || ''}
              onChange={value => handleFieldChange('vendorName', value)}
              isActive={activeField === 'vendorName'}
              onActivate={() => setActiveField('vendorName')}
              icon="store"
              label={t('verification.vendor', 'Vendor')}
              placeholder={t('verification.vendorPlaceholder', 'Enter vendor name')}
            />
          </FormContainer>

          {/* Receipt Details */}
          <FormContainer title={t('verification.details', 'Receipt Details')}>
            <EditField
              field="type"
              value={draft.type}
              onChange={value => handleFieldChange('type', value as Receipt['type'])}
              isActive={activeField === 'type'}
              onActivate={() => setActiveField('type')}
              icon="category"
              label={t('verification.type', 'Type')}
              placeholder={t('verification.typePlaceholder', 'Fuel, Maintenance, Other')}
            />

            <EditField
              field="vehicle"
              value={draft.vehicle}
              onChange={value => handleFieldChange('vehicle', value)}
              isActive={activeField === 'vehicle'}
              onActivate={() => setActiveField('vehicle')}
              icon="directions-car"
              label={t('verification.vehicle', 'Vehicle')}
              placeholder={t('verification.vehiclePlaceholder', 'Enter vehicle')}
            />

            <EditField
              field="location"
              value={draft.location || ''}
              onChange={value => handleFieldChange('location', value)}
              isActive={activeField === 'location'}
              onActivate={() => setActiveField('location')}
              icon="location-on"
              label={t('verification.location', 'Location')}
              placeholder={t('verification.locationPlaceholder', 'Enter location')}
            />
          </FormContainer>

          {/* View Raw Text Button */}
          <ViewRawTextButton onPress={handleViewRawText} />

          {/* Spacing for button container */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleBack}
              testID="back-button"
            >
              <Text style={styles.secondaryButtonText}>{t('common.back', 'Back')}</Text>
            </TouchableOpacity>

            <SaveButton onPress={handleSave} isLoading={isSaving || flowIsSaving} />
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            testID="cancel-button"
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel', 'Cancel')}</Text>
          </TouchableOpacity>
        </View>

        {/* Raw Text Modal */}
        <Modal
          visible={showRawTextModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRawTextModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('verification.rawText', 'Extracted Text')}</Text>
              <ScrollView>
                <Text style={styles.modalText}>
                  {originalData?.extractedText || t('verification.noText', 'No text available')}
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowRawTextModal(false)}
              >
                <Text style={styles.modalButtonText}>{t('common.close', 'Close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Unsaved Changes Dialog */}
        {showUnsavedChangesDialog && (
          <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={() => handleUnsavedChangesResponse('cancel')}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {t('verification.unsavedChanges', 'Unsaved Changes')}
                </Text>
                <Text style={[styles.modalText, { textAlign: 'center', marginBottom: 20 }]}>
                  {t(
                    'verification.unsavedMessage',
                    'You have unsaved changes. What would you like to do?'
                  )}
                </Text>
                <View style={{ gap: 12 }}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: success }]}
                    onPress={() => handleUnsavedChangesResponse('save')}
                  >
                    <Text style={styles.modalButtonText}>
                      {t('verification.saveAndContinue', 'Save & Continue')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: error }]}
                    onPress={() => handleUnsavedChangesResponse('discard')}
                  >
                    <Text style={styles.modalButtonText}>
                      {t('verification.discardChanges', 'Discard Changes')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      {
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: borderDefault,
                      },
                    ]}
                    onPress={() => handleUnsavedChangesResponse('cancel')}
                  >
                    <Text style={[styles.modalButtonText, { color: textPrimary }]}>
                      {t('common.cancel', 'Cancel')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </StepTransition>
    </SafeAreaView>
  );
};

export default VerificationStep;
