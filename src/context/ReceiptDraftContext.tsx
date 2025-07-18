// src/context/ReceiptDraftContext.tsx

import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { ProcessedReceipt } from '../state/ocr/types';
import { Receipt } from '../types/ReceiptInterfaces';

/**
 * Field validation error
 */
export interface FieldValidationError {
  readonly code: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

/**
 * Validation result for a field
 */
export interface FieldValidationResult {
  readonly isValid: boolean;
  readonly errors: FieldValidationError[];
}

/**
 * Complete form validation result
 */
export interface FormValidationResult {
  readonly isValid: boolean;
  readonly fieldErrors: Record<string, FieldValidationError[]>;
  readonly hasErrors: boolean;
  readonly hasWarnings: boolean;
}

/**
 * Receipt Draft State
 * Manages temporary receipt form state during verification
 */
export interface ReceiptDraftState {
  // Core draft data
  readonly draft?: Receipt;
  readonly originalData?: ProcessedReceipt;

  // Change tracking
  readonly modifiedFields: Set<keyof Receipt>;
  readonly isDirty: boolean;
  readonly hasChanges: boolean;

  // Validation state
  readonly fieldErrors: Record<string, FieldValidationError[]>;
  readonly formValidation?: FormValidationResult;
  readonly isValid: boolean;

  // Save state
  readonly isSaving: boolean;
  readonly lastSavedTimestamp?: number;
  readonly saveError?: string;

  // History (for undo/redo)
  readonly history: Receipt[];
  readonly historyIndex: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;

  // Utility flags
  readonly isInitialized: boolean;
}

/**
 * Action types for draft state management
 */
export type ReceiptDraftAction =
  | { type: 'INITIALIZE_DRAFT'; originalData: ProcessedReceipt; draft: Receipt }
  | { type: 'UPDATE_FIELD'; field: keyof Receipt; value: any }
  | { type: 'UPDATE_MULTIPLE_FIELDS'; updates: Partial<Receipt> }
  | { type: 'VALIDATE_FIELD'; field: keyof Receipt; result: FieldValidationResult }
  | { type: 'VALIDATE_FORM'; result: FormValidationResult }
  | { type: 'CLEAR_FIELD_ERROR'; field: keyof Receipt }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'START_SAVE' }
  | { type: 'SAVE_SUCCESS'; timestamp: number }
  | { type: 'SAVE_ERROR'; error: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET_TO_ORIGINAL' }
  | { type: 'CLEAR_DRAFT' };

/**
 * Initial state
 */
const initialState: ReceiptDraftState = {
  modifiedFields: new Set(),
  isDirty: false,
  hasChanges: false,
  fieldErrors: {},
  isValid: false,
  isSaving: false,
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  isInitialized: false,
};

/**
 * Create receipt draft from processed data
 */
function createDraftFromProcessedData(processedData: ProcessedReceipt): Receipt {
  const classification = processedData.classification;
  const currentTimestamp = new Date().toISOString();

  return {
    id: '', // Will be set when saved
    date: classification.date || currentTimestamp.split('T')[0], // Convert to date string
    type: classification.type || 'Other',
    amount: classification.amount || '0.00',
    vehicle: classification.vehicle || '',
    status: 'Pending',
    extractedText: processedData.extractedText,
    imageUri: processedData.imageUri,
    vendorName: classification.vendorName || '',
    location: classification.location || '',
    timestamp: currentTimestamp,
  };
}

/**
 * Add entry to history stack
 */
function addToHistory(history: Receipt[], current: Receipt, maxHistory: number = 20): Receipt[] {
  const newHistory = [...history, current];
  return newHistory.length > maxHistory ? newHistory.slice(-maxHistory) : newHistory;
}

/**
 * Receipt Draft Reducer
 */
function receiptDraftReducer(
  state: ReceiptDraftState,
  action: ReceiptDraftAction
): ReceiptDraftState {
  switch (action.type) {
    case 'INITIALIZE_DRAFT':
      const initialDraft = createDraftFromProcessedData(action.originalData);
      return {
        ...initialState,
        draft: action.draft || initialDraft,
        originalData: action.originalData,
        history: [action.draft || initialDraft],
        historyIndex: 0,
        isInitialized: true,
        isValid: true, // Assume processed data is initially valid
      };

    case 'UPDATE_FIELD':
      if (!state.draft) return state;

      const updatedDraft = {
        ...state.draft,
        [action.field]: action.value,
        timestamp: new Date().toISOString(),
      };

      const newModifiedFields = new Set(state.modifiedFields);
      newModifiedFields.add(action.field);

      const newHistory = addToHistory(state.history.slice(0, state.historyIndex + 1), updatedDraft);

      return {
        ...state,
        draft: updatedDraft,
        modifiedFields: newModifiedFields,
        isDirty: true,
        hasChanges: true,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        canUndo: newHistory.length > 1,
        canRedo: false,
        // Clear field error when field is updated
        fieldErrors: {
          ...state.fieldErrors,
          [action.field]: [],
        },
      };

    case 'UPDATE_MULTIPLE_FIELDS':
      if (!state.draft) return state;

      const multiUpdatedDraft = {
        ...state.draft,
        ...action.updates,
        timestamp: new Date().toISOString(),
      };

      const multiModifiedFields = new Set(state.modifiedFields);
      Object.keys(action.updates).forEach(field => {
        multiModifiedFields.add(field as keyof Receipt);
      });

      const multiNewHistory = addToHistory(
        state.history.slice(0, state.historyIndex + 1),
        multiUpdatedDraft
      );

      return {
        ...state,
        draft: multiUpdatedDraft,
        modifiedFields: multiModifiedFields,
        isDirty: true,
        hasChanges: true,
        history: multiNewHistory,
        historyIndex: multiNewHistory.length - 1,
        canUndo: multiNewHistory.length > 1,
        canRedo: false,
      };

    case 'VALIDATE_FIELD':
      return {
        ...state,
        fieldErrors: {
          ...state.fieldErrors,
          [action.field]: action.result.errors,
        },
      };

    case 'VALIDATE_FORM':
      return {
        ...state,
        formValidation: action.result,
        fieldErrors: action.result.fieldErrors,
        isValid: action.result.isValid,
      };

    case 'CLEAR_FIELD_ERROR':
      const clearedFieldErrors = { ...state.fieldErrors };
      delete clearedFieldErrors[action.field];
      return {
        ...state,
        fieldErrors: clearedFieldErrors,
      };

    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        fieldErrors: {},
        formValidation: undefined,
        saveError: undefined,
      };

    case 'START_SAVE':
      return {
        ...state,
        isSaving: true,
        saveError: undefined,
      };

    case 'SAVE_SUCCESS':
      return {
        ...state,
        isSaving: false,
        lastSavedTimestamp: action.timestamp,
        isDirty: false,
        modifiedFields: new Set(),
        saveError: undefined,
      };

    case 'SAVE_ERROR':
      return {
        ...state,
        isSaving: false,
        saveError: action.error,
      };

    case 'UNDO':
      if (!state.canUndo || state.historyIndex <= 0) return state;

      const undoIndex = state.historyIndex - 1;
      return {
        ...state,
        draft: state.history[undoIndex],
        historyIndex: undoIndex,
        canUndo: undoIndex > 0,
        canRedo: true,
        isDirty: undoIndex > 0,
      };

    case 'REDO':
      if (!state.canRedo || state.historyIndex >= state.history.length - 1) return state;

      const redoIndex = state.historyIndex + 1;
      return {
        ...state,
        draft: state.history[redoIndex],
        historyIndex: redoIndex,
        canUndo: true,
        canRedo: redoIndex < state.history.length - 1,
        isDirty: true,
      };

    case 'RESET_TO_ORIGINAL':
      if (!state.originalData) return state;

      const originalDraft = createDraftFromProcessedData(state.originalData);
      return {
        ...state,
        draft: originalDraft,
        modifiedFields: new Set(),
        isDirty: false,
        hasChanges: false,
        fieldErrors: {},
        formValidation: undefined,
        history: [originalDraft],
        historyIndex: 0,
        canUndo: false,
        canRedo: false,
      };

    case 'CLEAR_DRAFT':
      return initialState;

    default:
      if (process.env.NODE_ENV === 'development') {
        console.warn('Unknown ReceiptDraftAction:', action);
      }
      return state;
  }
}

/**
 * Context Value Interface
 */
export interface ReceiptDraftContextValue {
  readonly state: ReceiptDraftState;
  readonly dispatch: React.Dispatch<ReceiptDraftAction>;

  // Convenience methods
  readonly initializeDraft: (originalData: ProcessedReceipt, draft?: Receipt) => void;
  readonly updateField: (field: keyof Receipt, value: any) => void;
  readonly updateMultipleFields: (updates: Partial<Receipt>) => void;
  readonly validateField: (field: keyof Receipt, result: FieldValidationResult) => void;
  readonly validateForm: (result: FormValidationResult) => void;
  readonly clearFieldError: (field: keyof Receipt) => void;
  readonly clearAllErrors: () => void;
  readonly startSave: () => void;
  readonly saveSuccess: () => void;
  readonly saveError: (error: string) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly resetToOriginal: () => void;
  readonly clearDraft: () => void;
}

/**
 * Receipt Draft Context
 */
const ReceiptDraftContext = createContext<ReceiptDraftContextValue | null>(null);

/**
 * Receipt Draft Provider Props
 */
export interface ReceiptDraftProviderProps {
  children: React.ReactNode;
}

/**
 * Receipt Draft Provider Component
 */
export const ReceiptDraftProvider: React.FC<ReceiptDraftProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(receiptDraftReducer, initialState);

  // Convenience action creators
  const initializeDraft = useCallback((originalData: ProcessedReceipt, draft?: Receipt) => {
    dispatch({
      type: 'INITIALIZE_DRAFT',
      originalData,
      draft: draft || createDraftFromProcessedData(originalData),
    });
  }, []);

  const updateField = useCallback((field: keyof Receipt, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  }, []);

  const updateMultipleFields = useCallback((updates: Partial<Receipt>) => {
    dispatch({ type: 'UPDATE_MULTIPLE_FIELDS', updates });
  }, []);

  const validateField = useCallback((field: keyof Receipt, result: FieldValidationResult) => {
    dispatch({ type: 'VALIDATE_FIELD', field, result });
  }, []);

  const validateForm = useCallback((result: FormValidationResult) => {
    dispatch({ type: 'VALIDATE_FORM', result });
  }, []);

  const clearFieldError = useCallback((field: keyof Receipt) => {
    dispatch({ type: 'CLEAR_FIELD_ERROR', field });
  }, []);

  const clearAllErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
  }, []);

  const startSave = useCallback(() => {
    dispatch({ type: 'START_SAVE' });
  }, []);

  const saveSuccess = useCallback(() => {
    dispatch({ type: 'SAVE_SUCCESS', timestamp: Date.now() });
  }, []);

  const saveError = useCallback((error: string) => {
    dispatch({ type: 'SAVE_ERROR', error });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const resetToOriginal = useCallback(() => {
    dispatch({ type: 'RESET_TO_ORIGINAL' });
  }, []);

  const clearDraft = useCallback(() => {
    dispatch({ type: 'CLEAR_DRAFT' });
  }, []);

  // Development logging - moved outside conditional
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ReceiptDraftContext] State updated:', {
        isInitialized: state.isInitialized,
        isDirty: state.isDirty,
        hasChanges: state.hasChanges,
        isValid: state.isValid,
        isSaving: state.isSaving,
        modifiedFieldCount: state.modifiedFields.size,
        errorCount: Object.keys(state.fieldErrors).length,
        canUndo: state.canUndo,
        canRedo: state.canRedo,
        timestamp: new Date().toISOString(),
      });
    }
  }, [state]);

  const contextValue: ReceiptDraftContextValue = {
    state,
    dispatch,
    initializeDraft,
    updateField,
    updateMultipleFields,
    validateField,
    validateForm,
    clearFieldError,
    clearAllErrors,
    startSave,
    saveSuccess,
    saveError,
    undo,
    redo,
    resetToOriginal,
    clearDraft,
  };

  return (
    <ReceiptDraftContext.Provider value={contextValue}>{children}</ReceiptDraftContext.Provider>
  );
};

/**
 * Custom hook to use Receipt Draft Context
 */
export function useReceiptDraft(): ReceiptDraftContextValue {
  const context = useContext(ReceiptDraftContext);

  if (!context) {
    throw new Error('useReceiptDraft must be used within a ReceiptDraftProvider');
  }

  return context;
}

/**
 * Type guards for draft state checking
 */
export const ReceiptDraftStateGuards = {
  isInitialized: (state: ReceiptDraftState): boolean => state.isInitialized,
  hasDraft: (state: ReceiptDraftState): state is ReceiptDraftState & { draft: Receipt } =>
    state.isInitialized && !!state.draft,
  hasChanges: (state: ReceiptDraftState): boolean => state.hasChanges,
  isDirty: (state: ReceiptDraftState): boolean => state.isDirty,
  isValid: (state: ReceiptDraftState): boolean => state.isValid,
  isSaving: (state: ReceiptDraftState): boolean => state.isSaving,
  hasErrors: (state: ReceiptDraftState): boolean => Object.keys(state.fieldErrors).length > 0,
  canUndo: (state: ReceiptDraftState): boolean => state.canUndo,
  canRedo: (state: ReceiptDraftState): boolean => state.canRedo,
  hasOriginalData: (
    state: ReceiptDraftState
  ): state is ReceiptDraftState & { originalData: ProcessedReceipt } => !!state.originalData,
};

export default ReceiptDraftProvider;
