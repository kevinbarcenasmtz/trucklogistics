import React, { createContext, useCallback, useContext, useReducer } from 'react';
import { ocrReducer, initialState } from '../state/ocr/reducer';
import { OCRAction, OCRStateWithContext } from '../state/ocr/types'; // Use OCRStateWithContext
import { Receipt } from '../types/ReceiptInterfaces';

interface OCRContextValue {
  state: OCRStateWithContext;
  dispatch: React.Dispatch<OCRAction>;
  // Helper methods
  startCapture: (source: 'camera' | 'gallery') => void;
  retry: () => void;
  cancel: () => void;
  updateField: (field: keyof Receipt, value: any) => void;
}

const OCRContext = createContext<OCRContextValue | null>(null);

export function OCRProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(ocrReducer, initialState);

  const startCapture = useCallback((source: 'camera' | 'gallery') => {
    dispatch({ type: 'START_CAPTURE', source });
  }, []);

  const retry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, []);

  const cancel = useCallback(() => {
    dispatch({ type: 'CANCEL' });
  }, []);

  const updateField = useCallback((field: keyof Receipt, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  }, []);

  return (
    <OCRContext.Provider
      value={{
        state,
        dispatch,
        startCapture,
        retry,
        cancel,
        updateField,
      }}
    >
      {children}
    </OCRContext.Provider>
  );
}

export function useOCR() {
  const context = useContext(OCRContext);
  if (!context) {
    throw new Error('useOCR must be used within OCRProvider');
  }
  return context;
}
