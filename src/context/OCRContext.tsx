// src/contexts/OCRContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { ocrService } from '../services/ocr/OCRService';
import { initialState, ocrReducer } from '../state/ocr/reducer';
import { OCRAction, OCRStateWithContext } from '../state/ocr/types';
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
  const processingRef = useRef(false);

  // Helper methods
  const startCapture = useCallback((source: 'camera' | 'gallery') => {
    dispatch({ type: 'START_CAPTURE', source });
  }, []);

  const retry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, []);

  const cancel = useCallback(() => {
    ocrService.cancel();
    dispatch({ type: 'CANCEL' });
  }, []);

  const updateField = useCallback((field: keyof Receipt, value: any) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  }, []);

  // ✅ Handle OCR processing as a side effect of state changes
  useEffect(() => {
    const currentState = state.state;

    // Start processing when image is captured and in optimizing state
    if (
      currentState.status === 'optimizing' &&
      'imageUri' in currentState &&
      !processingRef.current
    ) {
      processingRef.current = true;

      // Process the image
      ocrService
        .processImage(
          currentState.imageUri,
          action => dispatch(action),
          state.context.correlationId
        )
        .then(result => {
          // Processing complete - the result is already in state via dispatched actions
          // The CLASSIFY_COMPLETE action should trigger the transition to reviewing state
          dispatch({ type: 'ENTER_REVIEW' });
        })
        .catch(error => {
          // Error is already handled by dispatch in processImage
          console.error('OCR processing error:', error);
        })
        .finally(() => {
          processingRef.current = false;
        });
    }
  }, [state.state, state.context.correlationId]);

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
