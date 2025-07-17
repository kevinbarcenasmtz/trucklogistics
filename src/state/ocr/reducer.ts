// src/state/ocr/reducer.ts

import { Receipt } from '../../types/ReceiptInterfaces';
import { generateCorrelationId } from '../../utils/correlation';
import { OCRAction, OCRContext, OCRState, OCRStateWithContext, ProcessingMetrics } from './types';

/**
 * Initial context values
 */
const initialContext: OCRContext = {
  correlationId: '',
  startTime: 0,
  retryCount: 0,
  metrics: {},
};

/**
 * Initial state
 */
export const initialState: OCRStateWithContext = {
  state: { status: 'idle' },
  context: initialContext,
};

/**
 * OCR State Machine Reducer
 * Manages all state transitions and maintains context
 */
export function ocrReducer(current: OCRStateWithContext, action: OCRAction): OCRStateWithContext {
  // preserve context while updating state
  const updateState = (
    newState: OCRState,
    contextUpdates?: Partial<OCRContext>
  ): OCRStateWithContext => ({
    state: newState,
    context: {
      ...current.context,
      ...contextUpdates,
    },
  });

  // helper to update metrics
  const updateMetrics = (metrics: Partial<ProcessingMetrics>): OCRStateWithContext => ({
    ...current,
    context: {
      ...current.context,
      metrics: {
        ...current.context.metrics,
        ...metrics,
      },
    },
  });

  /**
 * Convert confidence from AIClassifiedReceipt to a single number
 */
const getConfidenceValue = (confidence: { [key: string]: number } | number | undefined): number => {
  if (typeof confidence === 'number') return confidence;
  if (typeof confidence === 'object' && confidence) {
    // Calculate average confidence from all fields
    const values = Object.values(confidence);
    return values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0.8;
  }
  return 0.8; // Default confidence
};

  switch (action.type) {
    // ===== CAPTURE ACTIONS =====
    case 'START_CAPTURE': {
      // can only start capture from idle state
      if (current.state.status !== 'idle') {
        console.warn('Cannot start capture from non-idle state');
        return current;
      }

      return updateState(
        { status: 'capturing', source: action.source },
        {
          correlationId: generateCorrelationId(),
          startTime: Date.now(),
          retryCount: 0,
          abortController: new AbortController(),
          metrics: {},
        }
      );
    }

    case 'IMAGE_CAPTURED': {
      // can only capture image when in capturing state
      if (current.state.status !== 'capturing') {
        console.warn('Cannot capture image when not in capturing state');
        return current;
      }

      return updateState({
        status: 'optimizing',
        progress: 0,
        imageUri: action.uri,
      });
    }

    // ===== OPTIMIZATION ACTIONS =====
    case 'OPTIMIZE_START': {
      if (current.state.status !== 'optimizing') return current;

      return updateState({
        ...current.state,
        progress: 0,
      });
    }

    case 'OPTIMIZE_PROGRESS': {
      if (current.state.status !== 'optimizing') return current;

      return updateState({
        ...current.state,
        progress: Math.min(1, Math.max(0, action.progress)),
      });
    }

    case 'OPTIMIZE_COMPLETE': {
      if (current.state.status !== 'optimizing') return current;

      const optimizationTime = Date.now() - current.context.startTime;

      return updateState(
        {
          status: 'uploading',
          progress: 0,
          imageUri: current.state.imageUri,
          optimizedUri: action.optimizedUri,
          uploadId: '', // will be set by UPLOAD_START
        },
        {
          metrics: {
            ...current.context.metrics,
            imageOptimizationTime: optimizationTime,
            originalImageSize: action.metrics.originalSize,
            optimizedImageSize: action.metrics.optimizedSize,
            compressionRatio: action.metrics.reductionPercentage,
          },
        }
      );
    }

    // ===== UPLOAD ACTIONS =====
    case 'UPLOAD_START': {
      if (current.state.status !== 'uploading') return current;

      return updateState({
        ...current.state,
        uploadId: action.uploadId,
      });
    }

    case 'UPLOAD_PROGRESS': {
      if (current.state.status !== 'uploading') return current;

      return updateState({
        ...current.state,
        progress: Math.min(1, Math.max(0, action.progress)),
      });
    }

    case 'UPLOAD_COMPLETE': {
      if (current.state.status !== 'uploading') return current;

      const uploadTime =
        Date.now() -
        (current.context.startTime + (current.context.metrics.imageOptimizationTime || 0));

      return updateState(
        {
          status: 'processing',
          progress: 0,
          imageUri: current.state.imageUri,
          optimizedUri: current.state.optimizedUri,
          jobId: '', // Will be set by PROCESS_START
        },
        {
          metrics: {
            ...current.context.metrics,
            uploadTime,
          },
        }
      );
    }

    // ===== PROCESSING ACTIONS =====
    case 'PROCESS_START': {
      if (current.state.status !== 'processing') return current;

      return updateState({
        ...current.state,
        jobId: action.jobId,
      });
    }

    case 'PROCESS_PROGRESS': {
      if (current.state.status !== 'processing' && current.state.status !== 'extracting') {
        return current;
      }

      // transition to extracting state when appropriate
      if (action.stage === 'extracting' && current.state.status === 'processing') {
        return updateState({
          status: 'extracting',
          progress: action.progress,
          imageUri: current.state.imageUri,
          optimizedUri: current.state.optimizedUri,
          jobId: current.state.jobId,
        });
      }

      return updateState({
        ...current.state,
        progress: Math.min(1, Math.max(0, action.progress)),
      });
    }

    case 'EXTRACT_COMPLETE': {
      if (current.state.status !== 'extracting' && current.state.status !== 'processing') {
        return current;
      }

      const ocrProcessingTime =
        Date.now() -
        (current.context.startTime +
          (current.context.metrics.imageOptimizationTime || 0) +
          (current.context.metrics.uploadTime || 0));

      return updateState(
        {
          status: 'classifying',
          progress: 0,
          text: action.text,
          imageUri: current.state.imageUri,
          optimizedUri: current.state.optimizedUri,
        },
        {
          metrics: {
            ...current.context.metrics,
            ocrProcessingTime,
            ocrConfidence: action.confidence,
          },
        }
      );
    }

    // ===== CLASSIFICATION ACTIONS =====
    case 'CLASSIFY_START': {
      if (current.state.status !== 'classifying') return current;

      return updateState({
        ...current.state,
        progress: 0,
      });
    }

    case 'CLASSIFY_PROGRESS': {
      if (current.state.status !== 'classifying') return current;

      return updateState({
        ...current.state,
        progress: Math.min(1, Math.max(0, action.progress)),
      });
    }

    case 'CLASSIFY_COMPLETE': {
      if (current.state.status !== 'classifying') return current;
      
      const classificationTime =
        Date.now() -
        (current.context.startTime +
          (current.context.metrics.imageOptimizationTime || 0) +
          (current.context.metrics.uploadTime || 0) +
          (current.context.metrics.ocrProcessingTime || 0));
      
      const totalProcessingTime = Date.now() - current.context.startTime;
      
      return updateState(
        {
          status: 'reviewing',
          data: {
            imageUri: current.state.optimizedUri,
            originalImageUri: current.state.imageUri,
            extractedText: current.state.text,
            classification: action.classification,
            processedAt: new Date().toISOString(),
            confidence: getConfidenceValue(action.classification.confidence),
          },
          imageUri: current.state.imageUri,
          optimizedUri: current.state.optimizedUri,
        },
        {
          metrics: {
            ...current.context.metrics,
            classificationTime,
            totalProcessingTime,
            classificationConfidence: getConfidenceValue(action.classification.confidence),
          },
        }
      );
    }

    // ===== REVIEW/EDIT ACTIONS =====
    case 'ENTER_REVIEW': {
      // allow entering review from error state if we have data
      if (
        current.state.status === 'error' &&
        current.state.previousState.status === 'reviewing' &&
        'data' in current.state.previousState
      ) {
        return updateState(current.state.previousState);
      }
      return current;
    }

    case 'ENTER_EDIT': {
      if (current.state.status !== 'reviewing') return current;

      return updateState({
        status: 'editing',
        data: current.state.data,
        changes: {},
        imageUri: current.state.imageUri,
      });
    }

    case 'UPDATE_FIELD': {
      if (current.state.status !== 'editing') return current;

      return updateState({
        ...current.state,
        changes: {
          ...current.state.changes,
          [action.field]: action.value,
        },
      });
    }

    case 'CONFIRM_CHANGES': {
      if (current.state.status !== 'editing') return current;

      // apply changes to data
      const updatedData = {
        ...current.state.data,
        classification: {
          ...current.state.data.classification,
          ...current.state.changes,
        },
      };

      return updateState({
        status: 'reviewing',
        data: updatedData,
        imageUri: current.state.imageUri,
        optimizedUri: current.state.data.imageUri,
      });
    }

    case 'DISCARD_CHANGES': {
      if (current.state.status !== 'editing') return current;

      return updateState({
        status: 'reviewing',
        data: current.state.data,
        imageUri: current.state.imageUri,
        optimizedUri: current.state.data.imageUri,
      });
    }

    // ===== SAVE ACTIONS =====
    case 'SAVE_START': {
      if (current.state.status !== 'reviewing') return current;

      // convert ProcessedReceipt to Receipt format
      const receipt: Receipt = {
        id: Date.now().toString(),
        date: current.state.data.classification.date,
        type: current.state.data.classification.type,
        amount: current.state.data.classification.amount,
        vehicle: current.state.data.classification.vehicle,
        vendorName: current.state.data.classification.vendorName,
        location: current.state.data.classification.location,
        status: 'Pending',
        extractedText: current.state.data.extractedText,
        imageUri: current.state.data.imageUri,
        timestamp: new Date().toISOString(),
      };

      return updateState({
        status: 'saving',
        data: receipt,
        imageUri: current.state.imageUri,
      });
    }

    case 'SAVE_COMPLETE': {
      if (current.state.status !== 'saving') return current;

      // clean up abort controller
      current.context.abortController?.abort();

      return updateState(
        {
          status: 'complete',
          receipt: action.receipt,
        },
        {
          abortController: undefined,
        }
      );
    }

    // ===== CONTROL ACTIONS =====
    case 'ERROR': {
      // cannot error from idle or complete states
      if (current.state.status === 'idle' || current.state.status === 'complete') {
        return current;
      }

      const canRetry = action.error.retryable && current.context.retryCount < 3;

      return updateState({
        status: 'error',
        error: action.error,
        previousState: current.state,
        canRetry,
      });
    }

    case 'RETRY': {
      if (current.state.status !== 'error' || !current.state.canRetry) {
        return current;
      }

      // increment retry count and restore previous state
      return updateState(current.state.previousState, {
        retryCount: current.context.retryCount + 1,
        abortController: new AbortController(), // New controller for retry
      });
    }

    case 'CANCEL': {
      // cannot cancel from certain states
      if (
        current.state.status === 'idle' ||
        current.state.status === 'complete' ||
        current.state.status === 'saving'
      ) {
        return current;
      }

      // abort any ongoing operations
      current.context.abortController?.abort();

      return {
        state: { status: 'idle' },
        context: initialContext,
      };
    }

    case 'RESET': {
      // clean up and reset to initial state
      current.context.abortController?.abort();
      return {
        state: { status: 'idle' },
        context: initialContext,
      };
    }
    case 'RESET_TO_CAPTURING': {
      // Force reset to capturing state - useful for recovery
      current.context.abortController?.abort();

      return updateState(
        { status: 'capturing', source: action.source },
        {
          correlationId: generateCorrelationId(),
          startTime: Date.now(),
          retryCount: 0,
          abortController: new AbortController(),
          metrics: {},
        }
      );
    }
    case 'UPDATE_METRICS': {
      return updateMetrics(action.metrics);
    }

    default: {
      // Exhaustive check
      const _exhaustive: never = action;
      console.warn('Unhandled action type:', action);
      return current;
    }
  }
}

/**
 * Hook to log state transitions in development
 */
export function withLogging(reducer: typeof ocrReducer): typeof ocrReducer {
  if (process.env.NODE_ENV === 'production') {
    return reducer;
  }

  return (state, action) => {
    console.group(`OCR Action: ${action.type}`);
    console.log('Previous State:', state.state.status);
    console.log('Action:', action);

    const nextState = reducer(state, action);

    console.log('Next State:', nextState.state.status);
    console.log('Context:', nextState.context);
    console.groupEnd();

    return nextState;
  };
}

/**
 * Create reducer with optional logging
 */
export const createOCRReducer = () => {
  return process.env.NODE_ENV === 'development' ? withLogging(ocrReducer) : ocrReducer;
};
