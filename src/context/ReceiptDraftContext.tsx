import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';

// Types (assuming Receipt type exists, we'll define basic structure)
interface Receipt {
  id?: string;
  merchantName?: string;
  date?: string;
  total?: number;
  tax?: number;
  subtotal?: number;
  items?: ReceiptItem[];
  category?: string;
  notes?: string;
  imageUri?: string;
}

interface ReceiptItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ValidationError {
  field: keyof Receipt;
  message: string;
  code: string;
}

interface ReceiptDraftState {
  draft: Receipt | null;
  dirtyFields: Set<keyof Receipt>;
  validationErrors: Map<keyof Receipt, string>;
  lastSavedAt?: number;
  isSaving: boolean;
  isInitialized: boolean;
}

type ReceiptDraftAction =
  | { type: 'INITIALIZE_DRAFT'; payload: { receipt: Receipt } }
  | { type: 'UPDATE_FIELD'; payload: { field: keyof Receipt; value: any } }
  | { type: 'UPDATE_ITEM'; payload: { itemIndex: number; field: keyof ReceiptItem; value: any } }
  | { type: 'ADD_ITEM'; payload: { item: ReceiptItem } }
  | { type: 'REMOVE_ITEM'; payload: { itemIndex: number } }
  | { type: 'VALIDATE_FIELD'; payload: { field: keyof Receipt; error?: string } }
  | { type: 'CLEAR_VALIDATION_ERROR'; payload: { field: keyof Receipt } }
  | { type: 'SET_SAVING'; payload: { isSaving: boolean } }
  | { type: 'MARK_SAVED' }
  | { type: 'RESET_DRAFT' };

interface ReceiptDraftContextType {
  state: ReceiptDraftState;
  dispatch: React.Dispatch<ReceiptDraftAction>;
  // Field operations
  updateField: (field: keyof Receipt, value: any) => void;
  updateItem: (itemIndex: number, field: keyof ReceiptItem, value: any) => void;
  addItem: (item?: Partial<ReceiptItem>) => void;
  removeItem: (itemIndex: number) => void;
  // Validation
  validateField: (field: keyof Receipt) => boolean;
  clearValidationError: (field: keyof Receipt) => void;
  validateAll: () => boolean;
  // State management
  initializeDraft: (receipt: Receipt) => void;
  markSaved: () => void;
  setSaving: (isSaving: boolean) => void;
  resetDraft: () => void;
  // Computed values
  isDirty: boolean;
  hasValidationErrors: boolean;
  canSave: boolean;
  draftTotal: number;
}

// Initial state
const initialState: ReceiptDraftState = {
  draft: null,
  dirtyFields: new Set(),
  validationErrors: new Map(),
  lastSavedAt: undefined,
  isSaving: false,
  isInitialized: false
};

// Validation rules
const validateReceiptField = (field: keyof Receipt, value: any, draft: Receipt): string | undefined => {
  switch (field) {
    case 'merchantName':
      if (!value || (typeof value === 'string' && value.trim().length === 0)) {
        return 'Merchant name is required';
      }
      if (typeof value === 'string' && value.length > 100) {
        return 'Merchant name must be less than 100 characters';
      }
      break;

    case 'date':
      if (!value) {
        return 'Date is required';
      }
      if (new Date(value) > new Date()) {
        return 'Date cannot be in the future';
      }
      break;

    case 'total':
      if (value === null || value === undefined) {
        return 'Total amount is required';
      }
      if (typeof value === 'number' && value < 0) {
        return 'Total amount cannot be negative';
      }
      if (typeof value === 'number' && value > 999999) {
        return 'Total amount seems too large';
      }
      break;

    case 'tax':
      if (typeof value === 'number' && value < 0) {
        return 'Tax amount cannot be negative';
      }
      if (typeof value === 'number' && draft.total && value > draft.total) {
        return 'Tax cannot be greater than total';
      }
      break;

    case 'subtotal':
      if (typeof value === 'number' && value < 0) {
        return 'Subtotal cannot be negative';
      }
      if (typeof value === 'number' && draft.total && value > draft.total) {
        return 'Subtotal cannot be greater than total';
      }
      break;

    default:
      break;
  }
  return undefined;
};

// Calculate draft total from items
const calculateDraftTotal = (draft: Receipt | null): number => {
  if (!draft?.items || draft.items.length === 0) {
    return draft?.total || 0;
  }
  return draft.items.reduce((sum, item) => sum + (item.total || item.price * item.quantity), 0);
};

// Reducer
function receiptDraftReducer(state: ReceiptDraftState, action: ReceiptDraftAction): ReceiptDraftState {
  switch (action.type) {
    case 'INITIALIZE_DRAFT': {
      const { receipt } = action.payload;
      return {
        ...state,
        draft: { ...receipt },
        dirtyFields: new Set(),
        validationErrors: new Map(),
        isInitialized: true,
        lastSavedAt: undefined
      };
    }

    case 'UPDATE_FIELD': {
      const { field, value } = action.payload;
      if (!state.draft) return state;

      const newDraft = { ...state.draft, [field]: value };
      const newDirtyFields = new Set(state.dirtyFields);
      newDirtyFields.add(field);

      // Auto-validate the field
      const validationError = validateReceiptField(field, value, newDraft);
      const newValidationErrors = new Map(state.validationErrors);
      
      if (validationError) {
        newValidationErrors.set(field, validationError);
      } else {
        newValidationErrors.delete(field);
      }

      return {
        ...state,
        draft: newDraft,
        dirtyFields: newDirtyFields,
        validationErrors: newValidationErrors
      };
    }

    case 'UPDATE_ITEM': {
      const { itemIndex, field, value } = action.payload;
      if (!state.draft?.items || itemIndex >= state.draft.items.length) return state;

      const newItems = [...state.draft.items];
      newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };

      // Recalculate item total if price or quantity changed
      if (field === 'price' || field === 'quantity') {
        newItems[itemIndex].total = newItems[itemIndex].price * newItems[itemIndex].quantity;
      }

      const newDraft = { ...state.draft, items: newItems };
      const newDirtyFields = new Set(state.dirtyFields);
      newDirtyFields.add('items');

      return {
        ...state,
        draft: newDraft,
        dirtyFields: newDirtyFields
      };
    }

    case 'ADD_ITEM': {
      const { item } = action.payload;
      if (!state.draft) return state;

      const newItem: ReceiptItem = {
        id: Date.now().toString(),
        name: item.name || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        total: item.total || (item.price || 0) * (item.quantity || 1)
      };

      const newItems = [...(state.draft.items || []), newItem];
      const newDraft = { ...state.draft, items: newItems };
      const newDirtyFields = new Set(state.dirtyFields);
      newDirtyFields.add('items');

      return {
        ...state,
        draft: newDraft,
        dirtyFields: newDirtyFields
      };
    }

    case 'REMOVE_ITEM': {
      const { itemIndex } = action.payload;
      if (!state.draft?.items || itemIndex >= state.draft.items.length) return state;

      const newItems = state.draft.items.filter((_, index) => index !== itemIndex);
      const newDraft = { ...state.draft, items: newItems };
      const newDirtyFields = new Set(state.dirtyFields);
      newDirtyFields.add('items');

      return {
        ...state,
        draft: newDraft,
        dirtyFields: newDirtyFields
      };
    }

    case 'VALIDATE_FIELD': {
      const { field, error } = action.payload;
      const newValidationErrors = new Map(state.validationErrors);
      
      if (error) {
        newValidationErrors.set(field, error);
      } else {
        newValidationErrors.delete(field);
      }

      return {
        ...state,
        validationErrors: newValidationErrors
      };
    }

    case 'CLEAR_VALIDATION_ERROR': {
      const { field } = action.payload;
      const newValidationErrors = new Map(state.validationErrors);
      newValidationErrors.delete(field);

      return {
        ...state,
        validationErrors: newValidationErrors
      };
    }

    case 'SET_SAVING':
      return {
        ...state,
        isSaving: action.payload.isSaving
      };

    case 'MARK_SAVED':
      return {
        ...state,
        dirtyFields: new Set(),
        lastSavedAt: Date.now(),
        isSaving: false
      };

    case 'RESET_DRAFT':
      return initialState;

    default:
      return state;
  }
}

// Context
const ReceiptDraftContext = createContext<ReceiptDraftContextType | undefined>(undefined);

// Provider component
interface ReceiptDraftProviderProps {
  children: ReactNode;
}

export function ReceiptDraftProvider({ children }: ReceiptDraftProviderProps) {
  const [state, dispatch] = useReducer(receiptDraftReducer, initialState);

  // Field operations
  const updateField = useCallback((field: keyof Receipt, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  }, []);

  const updateItem = useCallback((itemIndex: number, field: keyof ReceiptItem, value: any) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { itemIndex, field, value } });
  }, []);

  const addItem = useCallback((item: Partial<ReceiptItem> = {}) => {
    dispatch({ type: 'ADD_ITEM', payload: { item: item as ReceiptItem } });
  }, []);

  const removeItem = useCallback((itemIndex: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemIndex } });
  }, []);

  // Validation
  const validateField = useCallback((field: keyof Receipt): boolean => {
    if (!state.draft) return false;
    
    const value = state.draft[field];
    const error = validateReceiptField(field, value, state.draft);
    
    dispatch({ type: 'VALIDATE_FIELD', payload: { field, error } });
    return !error;
  }, [state.draft]);

  const clearValidationError = useCallback((field: keyof Receipt) => {
    dispatch({ type: 'CLEAR_VALIDATION_ERROR', payload: { field } });
  }, []);

  const validateAll = useCallback((): boolean => {
    if (!state.draft) return false;

    const fieldsToValidate: (keyof Receipt)[] = ['merchantName', 'date', 'total', 'tax', 'subtotal'];
    let isValid = true;

    fieldsToValidate.forEach(field => {
      const fieldIsValid = validateField(field);
      if (!fieldIsValid) {
        isValid = false;
      }
    });

    return isValid;
  }, [state.draft, validateField]);

  // State management
  const initializeDraft = useCallback((receipt: Receipt) => {
    dispatch({ type: 'INITIALIZE_DRAFT', payload: { receipt } });
  }, []);

  const markSaved = useCallback(() => {
    dispatch({ type: 'MARK_SAVED' });
  }, []);

  const setSaving = useCallback((isSaving: boolean) => {
    dispatch({ type: 'SET_SAVING', payload: { isSaving } });
  }, []);

  const resetDraft = useCallback(() => {
    dispatch({ type: 'RESET_DRAFT' });
  }, []);

  // Computed values
  const isDirty = state.dirtyFields.size > 0;
  const hasValidationErrors = state.validationErrors.size > 0;
  const canSave = state.isInitialized && !state.isSaving && !hasValidationErrors;
  const draftTotal = calculateDraftTotal(state.draft);

  const contextValue: ReceiptDraftContextType = {
    state,
    dispatch,
    updateField,
    updateItem,
    addItem,
    removeItem,
    validateField,
    clearValidationError,
    validateAll,
    initializeDraft,
    markSaved,
    setSaving,
    resetDraft,
    isDirty,
    hasValidationErrors,
    canSave,
    draftTotal
  };

  return (
    <ReceiptDraftContext.Provider value={contextValue}>
      {children}
    </ReceiptDraftContext.Provider>
  );
}

// Hook to use the context
export function useReceiptDraft() {
  const context = useContext(ReceiptDraftContext);
  if (context === undefined) {
    throw new Error('useReceiptDraft must be used within a ReceiptDraftProvider');
  }
  return context;
}

// Export types for external use
export type { Receipt, ReceiptItem, ReceiptDraftState, ReceiptDraftAction, ReceiptDraftContextType, ValidationError };