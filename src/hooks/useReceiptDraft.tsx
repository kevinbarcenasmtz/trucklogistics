// src/hooks/useReceiptDraft.tsx

import { useCallback, useEffect, useRef } from 'react';
import { useReceiptDraft as useReceiptDraftContext } from '../context/ReceiptDraftContext';
import { ReceiptDraftService } from '../services/camera/ReceiptDraftService';
import { ProcessedReceipt } from '../state/ocr/types';
import { Receipt } from '../types/ReceiptInterfaces';

/**
 * Receipt draft hook configuration
 */
export interface UseReceiptDraftConfig {
  enableAutoValidation?: boolean;
  enableAutoSave?: boolean;
  autoSaveDelay?: number;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  enableLogging?: boolean;
}

/**
 * Field update options
 */
export interface FieldUpdateOptions {
  skipValidation?: boolean;
  skipAutoSave?: boolean;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  showWarnings?: boolean;
  validateCrossFields?: boolean;
}

/**
 * Save options
 */
export interface SaveOptions {
  validateBeforeSave?: boolean;
  skipIfNotDirty?: boolean;
}

/**
 * Reset options
 */
export interface ResetOptions {
  confirmIfDirty?: boolean;
  clearHistory?: boolean;
}

/**
 * Hook return interface
 */
export interface UseReceiptDraftReturn {
  // State properties
  readonly draft?: Receipt;
  readonly originalData?: ProcessedReceipt;
  readonly isInitialized: boolean;
  readonly isDirty: boolean;
  readonly hasChanges: boolean;
  readonly isValid: boolean;
  readonly isSaving: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly lastSavedTimestamp?: number;
  readonly saveError?: string;

  // Field-specific state
  readonly fieldErrors: Record<string, any[]>;
  readonly fieldsWithErrors: string[];
  readonly modifiedFields: string[];
  readonly errorCount: number;
  readonly warningCount: number;

  // Action functions
  readonly updateField: (field: keyof Receipt, value: any, options?: FieldUpdateOptions) => void;
  readonly updateMultipleFields: (updates: Partial<Receipt>, options?: FieldUpdateOptions) => void;
  readonly validateField: (field: keyof Receipt, options?: ValidationOptions) => boolean;
  readonly validateAll: (options?: ValidationOptions) => boolean;
  readonly saveChanges: (options?: SaveOptions) => Promise<boolean>;
  readonly resetChanges: (options?: ResetOptions) => void;

  // History functions
  readonly undo: () => boolean;
  readonly redo: () => boolean;
  readonly clearHistory: () => void;

  // Error handling
  readonly clearFieldError: (field: keyof Receipt) => void;
  readonly clearAllErrors: () => void;
  readonly getFieldError: (field: keyof Receipt) => string | undefined;

  // Utility functions
  readonly getFieldValue: (field: keyof Receipt) => any;
  readonly isFieldModified: (field: keyof Receipt) => boolean;
  readonly isFieldValid: (field: keyof Receipt) => boolean;
  readonly getDraftSummary: () => any;
  readonly getValidationSummary: () => any;

  // Initialization
  readonly initializeFromProcessedData: (processedData: ProcessedReceipt) => void;
  readonly reinitialize: (draft?: Receipt) => void;
}

/**
 * useReceiptDraft Hook
 * Simplifies receipt draft operations for components
 */
export function useReceiptDraft(config: UseReceiptDraftConfig = {}): UseReceiptDraftReturn {
  const {
    enableAutoValidation = true,
    enableAutoSave = false,
    autoSaveDelay = 2000,
    validationMode = 'onChange',
    enableLogging = process.env.NODE_ENV === 'development',
  } = config;

  const draftContext = useReceiptDraftContext();

  // Service instance
  const serviceRef = useRef<ReceiptDraftService | undefined>(undefined);
  const autoSaveTimerRef = useRef<number | undefined>(undefined);
  const lastValidationRef = useRef<Record<string, number>>({});

  // Initialize service
  if (!serviceRef.current) {
    serviceRef.current = new ReceiptDraftService({
      requiredFields: ['date', 'type', 'amount', 'vehicle'],
      amountMinimum: 0.01,
      amountMaximum: 999999.99,
      dateRangeMonths: 12,
      locationMaxLength: 100,
      vendorNameMaxLength: 100,
    });
  }

  // Save changes function
  const saveChanges = useCallback(
    async (options: SaveOptions = {}): Promise<boolean> => {
      const { validateBeforeSave = true, skipIfNotDirty = false } = options;

      if (!draftContext.state.draft) {
        if (enableLogging) {
          console.warn('[useReceiptDraft] No draft to save');
        }
        return false;
      }

      if (skipIfNotDirty && !draftContext.state.isDirty) {
        if (enableLogging) {
          console.log('[useReceiptDraft] Skipping save - no changes');
        }
        return true;
      }

      if (draftContext.state.isSaving) {
        if (enableLogging) {
          console.warn('[useReceiptDraft] Save already in progress');
        }
        return false;
      }

      try {
        if (enableLogging) {
          console.log('[useReceiptDraft] Starting save operation');
        }

        // Validate before save if requested
        if (validateBeforeSave && serviceRef.current && draftContext.state.draft) {
          const result = serviceRef.current.validateReceipt(draftContext.state.draft);
          draftContext.validateForm(result);

          if (!result.isValid) {
            if (enableLogging) {
              console.warn('[useReceiptDraft] Save cancelled - validation failed');
            }
            return false;
          }
        }

        // Start save operation
        draftContext.startSave();

        // Simulate save operation (replace with actual save logic)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Complete save
        draftContext.saveSuccess();

        if (enableLogging) {
          console.log('[useReceiptDraft] Save completed successfully');
        }

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Save failed';
        draftContext.saveError(errorMessage);

        if (enableLogging) {
          console.error('[useReceiptDraft] Save failed:', error);
        }

        return false;
      }
    },
    [draftContext, enableLogging]
  );

  // Use ref for saveChanges to avoid dependency issues in auto-save
  const saveChangesRef = useRef(saveChanges);
  saveChangesRef.current = saveChanges;

  // Auto-save functionality
  useEffect(() => {
    if (enableAutoSave && draftContext.state.isDirty && !draftContext.state.isSaving) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        if (draftContext.state.isDirty && draftContext.state.isValid) {
          saveChangesRef.current({ skipIfNotDirty: true }).catch(error => {
            if (enableLogging) {
              console.warn('[useReceiptDraft] Auto-save failed:', error);
            }
          });
        }
      }, autoSaveDelay);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    enableAutoSave,
    draftContext.state.isDirty,
    draftContext.state.isSaving,
    draftContext.state.isValid,
    autoSaveDelay,
    enableLogging,
  ]);

  // Development logging
  useEffect(() => {
    if (enableLogging) {
      console.log('[useReceiptDraft] State updated:', {
        isInitialized: draftContext.state.isInitialized,
        isDirty: draftContext.state.isDirty,
        isValid: draftContext.state.isValid,
        modifiedFieldCount: draftContext.state.modifiedFields.size,
        errorCount: Object.keys(draftContext.state.fieldErrors).length,
        timestamp: new Date().toISOString(),
      });
    }
  }, [draftContext.state, enableLogging]);

  // Validate single field
  const validateField = useCallback(
    (field: keyof Receipt, options: ValidationOptions = {}): boolean => {
      if (!draftContext.state.draft || !serviceRef.current) {
        return false;
      }

      const { showWarnings = true, validateCrossFields = true } = options;

      try {
        const value = draftContext.state.draft[field];
        const fullDraft = validateCrossFields ? draftContext.state.draft : undefined;

        const result = serviceRef.current.validateField(field, value, fullDraft);

        // Filter warnings if not requested
        const filteredResult = showWarnings
          ? result
          : {
              ...result,
              errors: result.errors.filter(e => e.severity === 'error'),
            };

        // Update context with validation result
        draftContext.validateField(field, filteredResult);

        // Track validation time for debouncing
        lastValidationRef.current[field] = Date.now();

        if (enableLogging) {
          console.log('[useReceiptDraft] Field validation:', {
            field,
            isValid: filteredResult.isValid,
            errorCount: filteredResult.errors.length,
          });
        }

        return filteredResult.isValid;
      } catch (error) {
        if (enableLogging) {
          console.error('[useReceiptDraft] Field validation error:', { field, error });
        }
        return false;
      }
    },
    [draftContext, enableLogging]
  );

  // Validate all fields
  const validateAll = useCallback(
    (options: ValidationOptions = {}): boolean => {
      if (!draftContext.state.draft || !serviceRef.current) {
        return false;
      }

      const { showWarnings = true } = options;

      try {
        const result = serviceRef.current.validateReceipt(draftContext.state.draft);

        // Filter warnings if not requested
        const filteredResult = showWarnings
          ? result
          : {
              ...result,
              fieldErrors: Object.fromEntries(
                Object.entries(result.fieldErrors).map(([field, errors]) => [
                  field,
                  errors.filter(e => e.severity === 'error'),
                ])
              ),
              hasWarnings: false,
            };

        // Update context with validation result
        draftContext.validateForm(filteredResult);

        if (enableLogging) {
          console.log('[useReceiptDraft] Form validation:', {
            isValid: filteredResult.isValid,
            errorCount: Object.keys(filteredResult.fieldErrors).length,
          });
        }

        return filteredResult.isValid;
      } catch (error) {
        if (enableLogging) {
          console.error('[useReceiptDraft] Form validation error:', error);
        }
        return false;
      }
    },
    [draftContext, enableLogging]
  );

  // Update field with validation and auto-save
  const updateField = useCallback(
    (field: keyof Receipt, value: any, options: FieldUpdateOptions = {}) => {
      const { skipValidation = false, skipAutoSave = false } = options;

      if (enableLogging) {
        console.log('[useReceiptDraft] Updating field:', { field, value, options });
      }

      // Update the field in context
      draftContext.updateField(field, value);

      // Inline validation to avoid circular dependency
      if (enableAutoValidation && !skipValidation && validationMode === 'onChange') {
        if (draftContext.state.draft && serviceRef.current) {
          try {
            const fullDraft = { ...draftContext.state.draft, [field]: value };
            const result = serviceRef.current.validateField(field, value, fullDraft);
            draftContext.validateField(field, result);
          } catch (error) {
            if (enableLogging) {
              console.error('[useReceiptDraft] Inline validation error:', { field, error });
            }
          }
        }
      }

      // Clear auto-save timer if field update should trigger new auto-save
      if (enableAutoSave && !skipAutoSave && autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = undefined;
      }
    },
    [draftContext, enableAutoValidation, validationMode, enableAutoSave, enableLogging]
  );

  // Update multiple fields
  const updateMultipleFields = useCallback(
    (updates: Partial<Receipt>, options: FieldUpdateOptions = {}) => {
      const { skipValidation = false, skipAutoSave = false } = options;

      if (enableLogging) {
        console.log('[useReceiptDraft] Updating multiple fields:', {
          fields: Object.keys(updates),
          options,
        });
      }

      // Update fields in context
      draftContext.updateMultipleFields(updates);

      // Inline validation to avoid circular dependency
      if (enableAutoValidation && !skipValidation && validationMode === 'onChange') {
        if (draftContext.state.draft && serviceRef.current) {
          try {
            const updatedDraft = { ...draftContext.state.draft, ...updates };
            const result = serviceRef.current.validateReceipt(updatedDraft);
            draftContext.validateForm(result);
          } catch (error) {
            if (enableLogging) {
              console.error('[useReceiptDraft] Inline validation error:', error);
            }
          }
        }
      }

      // Clear auto-save timer if updates should trigger new auto-save
      if (enableAutoSave && !skipAutoSave && autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = undefined;
      }
    },
    [draftContext, enableAutoValidation, validationMode, enableAutoSave, enableLogging]
  );

  // Reset changes
  const resetChanges = useCallback(
    (options: ResetOptions = {}) => {
      const { confirmIfDirty = true, clearHistory = false } = options;

      if (confirmIfDirty && draftContext.state.isDirty) {
        // In a real app, you might show a confirmation dialog here
        if (enableLogging) {
          console.log('[useReceiptDraft] Resetting changes (dirty state detected)');
        }
      }

      if (clearHistory) {
        // Reset to original data completely
        draftContext.resetToOriginal();
      } else {
        // Just revert current changes
        draftContext.resetToOriginal();
      }

      if (enableLogging) {
        console.log('[useReceiptDraft] Changes reset');
      }
    },
    [draftContext, enableLogging]
  );

  // History functions
  const undo = useCallback((): boolean => {
    if (!draftContext.state.canUndo) {
      return false;
    }

    draftContext.undo();

    if (enableLogging) {
      console.log('[useReceiptDraft] Undo performed');
    }

    return true;
  }, [draftContext, enableLogging]);

  const redo = useCallback((): boolean => {
    if (!draftContext.state.canRedo) {
      return false;
    }

    draftContext.redo();

    if (enableLogging) {
      console.log('[useReceiptDraft] Redo performed');
    }

    return true;
  }, [draftContext, enableLogging]);

  const clearHistory = useCallback(() => {
    // This would need to be implemented in the context if desired
    if (enableLogging) {
      console.log('[useReceiptDraft] History cleared');
    }
  }, [enableLogging]);

  // Error handling functions
  const clearFieldError = useCallback(
    (field: keyof Receipt) => {
      draftContext.clearFieldError(field);
    },
    [draftContext]
  );

  const clearAllErrors = useCallback(() => {
    draftContext.clearAllErrors();
  }, [draftContext]);

  const getFieldError = useCallback(
    (field: keyof Receipt): string | undefined => {
      const errors = draftContext.state.fieldErrors[field];
      return errors && errors.length > 0 ? errors[0].message : undefined;
    },
    [draftContext.state.fieldErrors]
  );

  // Utility functions
  const getFieldValue = useCallback(
    (field: keyof Receipt): any => {
      return draftContext.state.draft?.[field];
    },
    [draftContext.state.draft]
  );

  const isFieldModified = useCallback(
    (field: keyof Receipt): boolean => {
      return draftContext.state.modifiedFields.has(field);
    },
    [draftContext.state.modifiedFields]
  );

  const isFieldValid = useCallback(
    (field: keyof Receipt): boolean => {
      const errors = draftContext.state.fieldErrors[field];
      return !errors || errors.filter(e => e.severity === 'error').length === 0;
    },
    [draftContext.state.fieldErrors]
  );

  const getDraftSummary = useCallback(() => {
    if (!draftContext.state.draft || !serviceRef.current) {
      return null;
    }

    return serviceRef.current.getValidationSummary(draftContext.state.draft);
  }, [draftContext.state.draft]);

  const getValidationSummary = useCallback(() => {
    return {
      isValid: draftContext.state.isValid,
      errorCount: Object.values(draftContext.state.fieldErrors).reduce(
        (count, errors) => count + errors.filter(e => e.severity === 'error').length,
        0
      ),
      warningCount: Object.values(draftContext.state.fieldErrors).reduce(
        (count, errors) => count + errors.filter(e => e.severity === 'warning').length,
        0
      ),
      fieldsWithErrors: Object.keys(draftContext.state.fieldErrors).filter(field =>
        draftContext.state.fieldErrors[field].some(e => e.severity === 'error')
      ),
    };
  }, [draftContext.state]);

  // Initialization functions
  const initializeFromProcessedData = useCallback(
    (processedData: ProcessedReceipt) => {
      if (!serviceRef.current) {
        throw new Error('Service not initialized');
      }

      const draft = serviceRef.current.createDraftFromProcessedData(processedData);
      draftContext.initializeDraft(processedData, draft);

      if (enableLogging) {
        console.log('[useReceiptDraft] Initialized from processed data');
      }
    },
    [draftContext, enableLogging]
  );

  const reinitialize = useCallback(
    (draft?: Receipt) => {
      if (draft) {
        // If draft provided, we need original data to initialize properly
        // This is a simplified version - in practice you'd need the original ProcessedReceipt
        if (enableLogging) {
          console.log('[useReceiptDraft] Reinitializing with provided draft');
        }
      } else {
        draftContext.clearDraft();
        if (enableLogging) {
          console.log('[useReceiptDraft] Cleared draft for reinitialization');
        }
      }
    },
    [draftContext, enableLogging]
  );

  // Derived state
  const fieldsWithErrors = Object.keys(draftContext.state.fieldErrors).filter(field =>
    draftContext.state.fieldErrors[field].some(e => e.severity === 'error')
  );

  const modifiedFields = Array.from(draftContext.state.modifiedFields);

  const errorCount = Object.values(draftContext.state.fieldErrors).reduce(
    (count, errors) => count + errors.filter(e => e.severity === 'error').length,
    0
  );

  const warningCount = Object.values(draftContext.state.fieldErrors).reduce(
    (count, errors) => count + errors.filter(e => e.severity === 'warning').length,
    0
  );

  return {
    // State properties
    draft: draftContext.state.draft,
    originalData: draftContext.state.originalData,
    isInitialized: draftContext.state.isInitialized,
    isDirty: draftContext.state.isDirty,
    hasChanges: draftContext.state.hasChanges,
    isValid: draftContext.state.isValid,
    isSaving: draftContext.state.isSaving,
    canUndo: draftContext.state.canUndo,
    canRedo: draftContext.state.canRedo,
    lastSavedTimestamp: draftContext.state.lastSavedTimestamp,
    saveError: draftContext.state.saveError,

    // Field-specific state
    fieldErrors: draftContext.state.fieldErrors,
    fieldsWithErrors,
    modifiedFields,
    errorCount,
    warningCount,

    // Action functions
    updateField,
    updateMultipleFields,
    validateField,
    validateAll,
    saveChanges,
    resetChanges,

    // History functions
    undo,
    redo,
    clearHistory,

    // Error handling
    clearFieldError,
    clearAllErrors,
    getFieldError,

    // Utility functions
    getFieldValue,
    isFieldModified,
    isFieldValid,
    getDraftSummary,
    getValidationSummary,

    // Initialization
    initializeFromProcessedData,
    reinitialize,
  };
}

export default useReceiptDraft;
