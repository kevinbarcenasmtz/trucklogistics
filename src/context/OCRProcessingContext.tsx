import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
interface OCRProcessingState {
  status: 'idle' | 'capturing' | 'optimizing' | 'uploading' | 'processing' | 'extracting' | 'classifying' | 'complete' | 'error';
  progress: number; // 0-1
  currentOperation?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metrics: {
    startTime?: number;
    duration?: number;
    operations: Record<string, { startTime: number; duration?: number; }>;
  };
}

type OCRProcessingAction =
  | { type: 'START_PROCESSING' }
  | { type: 'UPDATE_PROGRESS'; payload: { progress: number; operation?: string } }
  | { type: 'PROCESSING_COMPLETE' }
  | { type: 'PROCESSING_ERROR'; payload: { code: string; message: string; details?: any } }
  | { type: 'RESET' };

interface OCRProcessingContextType {
  state: OCRProcessingState;
  dispatch: React.Dispatch<OCRProcessingAction>;
  // Convenience methods
  startProcessing: () => void;
  updateProgress: (progress: number, operation?: string) => void;
  completeProcessing: () => void;
  setError: (code: string, message: string, details?: any) => void;
  reset: () => void;
  // Computed values
  isProcessing: boolean;
  isComplete: boolean;
  isError: boolean;
  currentProgressPercent: number;
}

// Initial state
const initialState: OCRProcessingState = {
  status: 'idle',
  progress: 0,
  currentOperation: undefined,
  error: undefined,
  metrics: {
    operations: {}
  }
};

// Reducer
function ocrProcessingReducer(state: OCRProcessingState, action: OCRProcessingAction): OCRProcessingState {
  switch (action.type) {
    case 'START_PROCESSING':
      return {
        ...state,
        status: 'capturing',
        progress: 0,
        currentOperation: 'Initializing camera capture...',
        error: undefined,
        metrics: {
          startTime: Date.now(),
          operations: {}
        }
      };

    case 'UPDATE_PROGRESS': {
      const { progress, operation } = action.payload;
      
      // Determine status based on progress
      let newStatus = state.status;
      if (progress <= 0.1) {
        newStatus = 'capturing';
      } else if (progress <= 0.3) {
        newStatus = 'optimizing';
      } else if (progress <= 0.5) {
        newStatus = 'uploading';
      } else if (progress <= 0.8) {
        newStatus = 'processing';
      } else if (progress <= 0.95) {
        newStatus = 'extracting';
      } else if (progress < 1.0) {
        newStatus = 'classifying';
      }

      // Update operation metrics
      const newOperations = { ...state.metrics.operations };
      if (operation && state.currentOperation !== operation) {
        // Complete previous operation
        if (state.currentOperation) {
          const prevOp = newOperations[state.currentOperation];
          if (prevOp && !prevOp.duration) {
            prevOp.duration = Date.now() - prevOp.startTime;
          }
        }
        // Start new operation
        newOperations[operation] = { startTime: Date.now() };
      }

      return {
        ...state,
        status: newStatus,
        progress: Math.max(0, Math.min(1, progress)),
        currentOperation: operation || state.currentOperation,
        metrics: {
          ...state.metrics,
          operations: newOperations
        }
      };
    }

    case 'PROCESSING_COMPLETE': {
      // Complete final operation
      const newOperations = { ...state.metrics.operations };
      if (state.currentOperation) {
        const currentOp = newOperations[state.currentOperation];
        if (currentOp && !currentOp.duration) {
          currentOp.duration = Date.now() - currentOp.startTime;
        }
      }

      const duration = state.metrics.startTime ? Date.now() - state.metrics.startTime : undefined;

      return {
        ...state,
        status: 'complete',
        progress: 1,
        currentOperation: 'Processing complete',
        error: undefined,
        metrics: {
          ...state.metrics,
          duration,
          operations: newOperations
        }
      };
    }

    case 'PROCESSING_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload,
        currentOperation: 'Processing failed'
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Context
const OCRProcessingContext = createContext<OCRProcessingContextType | undefined>(undefined);

// Provider component
interface OCRProcessingProviderProps {
  children: ReactNode;
}

export function OCRProcessingProvider({ children }: OCRProcessingProviderProps) {
  const [state, dispatch] = useReducer(ocrProcessingReducer, initialState);

  // Convenience methods
  const startProcessing = () => {
    dispatch({ type: 'START_PROCESSING' });
  };

  const updateProgress = (progress: number, operation?: string) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { progress, operation } });
  };

  const completeProcessing = () => {
    dispatch({ type: 'PROCESSING_COMPLETE' });
  };

  const setError = (code: string, message: string, details?: any) => {
    dispatch({ type: 'PROCESSING_ERROR', payload: { code, message, details } });
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  // Computed values
  const isProcessing = ['capturing', 'optimizing', 'uploading', 'processing', 'extracting', 'classifying'].includes(state.status);
  const isComplete = state.status === 'complete';
  const isError = state.status === 'error';
  const currentProgressPercent = Math.round(state.progress * 100);

  const contextValue: OCRProcessingContextType = {
    state,
    dispatch,
    startProcessing,
    updateProgress,
    completeProcessing,
    setError,
    reset,
    isProcessing,
    isComplete,
    isError,
    currentProgressPercent
  };

  return (
    <OCRProcessingContext.Provider value={contextValue}>
      {children}
    </OCRProcessingContext.Provider>
  );
}

// Hook to use the context
export function useOCRProcessing() {
  const context = useContext(OCRProcessingContext);
  if (context === undefined) {
    throw new Error('useOCRProcessing must be used within an OCRProcessingProvider');
  }
  return context;
}

// Export types for external use
export type { OCRProcessingState, OCRProcessingAction, OCRProcessingContextType };