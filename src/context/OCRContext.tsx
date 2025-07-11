import React, { createContext, useCallback, useContext, useReducer } from 'react';
import { ocrReducer } from '../state/ocr/reducer';
import { OCRAction, OCRContext as OCRCtx, OCRState } from '../state/ocr/types';
import { Receipt } from '../types/ReceiptInterfaces';

interface OCRContextValue {
  state: OCRState & { context: OCRCtx };
  dispatch: React.Dispatch<OCRAction>;
  // Helper methods
  startCapture: (source: 'camera' | 'gallery') => void;
  retry: () => void;
  cancel: () => void;
  updateField: (field: keyof Receipt, value: any) => void;
}

const OCRContext = createContext<OCRContextValue | null>(null);

export function OCRProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(ocrReducer, {
    status: 'idle',
    context: {
      correlationId: '',
      startTime: 0,
      retryCount: 0,
    },
  });

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
