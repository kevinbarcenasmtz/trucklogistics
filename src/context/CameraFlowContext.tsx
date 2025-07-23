// src/context/CameraFlowContext.tsx

import React, { createContext, useCallback, useContext, useReducer } from 'react';
import {
  CameraFlow,
  CameraFlowStep,
  FlowError,
  FlowMetrics,
  FlowTransition,
} from '../types/cameraFlow';

/**
 * Camera Flow State
 * Orchestrates overall camera workflow state
 */
export interface CameraFlowState {
  // Active flow
  readonly activeFlow?: CameraFlow;
  readonly hasActiveFlow: boolean;

  // Flow management
  readonly flows: Record<string, CameraFlow>;
  readonly flowHistory: string[]; // this is for recently used flow IDs

  // Navigation state
  readonly canNavigateBack: boolean;
  readonly canNavigateForward: boolean;
  readonly navigationBlocked: boolean;
  readonly blockReason?: string;

  // Flow persistence
  readonly persistedFlows: string[]; // Flows saved for app backgrounding
  readonly autoSaveEnabled: boolean;

  // Analytics
  readonly sessionMetrics: {
    readonly totalFlows: number;
    readonly completedFlows: number;
    readonly abandonedFlows: number;
    readonly averageCompletionTime: number;
  };
}

/**
 * Action types for camera flow management
 */
export type CameraFlowAction =
  | { type: 'CREATE_FLOW'; imageUri: string; flowId?: string }
  | { type: 'SET_ACTIVE_FLOW'; flowId: string }
  | { type: 'UPDATE_CURRENT_STEP'; step: CameraFlowStep; reason?: string }
  | { type: 'UPDATE_FLOW_DATA'; data: Partial<Pick<CameraFlow, 'ocrResult' | 'receiptDraft'>> }
  | { type: 'ADD_ERROR'; error: FlowError }
  | { type: 'CLEAR_ERROR' }
  | { type: 'COMPLETE_FLOW' }
  | { type: 'CANCEL_FLOW'; reason?: string }
  | { type: 'BLOCK_NAVIGATION'; reason: string }
  | { type: 'UNBLOCK_NAVIGATION' }
  | { type: 'PERSIST_FLOW'; flowId: string }
  | { type: 'RESTORE_FLOWS'; flows: CameraFlow[] }
  | { type: 'CLEANUP_FLOWS' }
  | { type: 'RESET_SESSION' };

/**
 * Initial state
 */
const initialState: CameraFlowState = {
  hasActiveFlow: false,
  flows: {},
  flowHistory: [],
  canNavigateBack: false,
  canNavigateForward: false,
  navigationBlocked: false,
  persistedFlows: [],
  autoSaveEnabled: true,
  sessionMetrics: {
    totalFlows: 0,
    completedFlows: 0,
    abandonedFlows: 0,
    averageCompletionTime: 0,
  },
};

/**
 * Generate unique flow ID
 */
function generateFlowId(): string {
  return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create new camera flow
 */
function createNewFlow(imageUri: string, flowId?: string): CameraFlow {
  const id = flowId || generateFlowId();
  const timestamp = Date.now();

  return {
    id,
    imageUri,
    currentStep: 'capture',
    timestamp,
    isComplete: false,
    stepHistory: ['capture'],
    transitions: [],
    errorHistory: [],
    metrics: {
      stepDurations: {},
      totalDuration: 0,
      retryCount: 0,
      errorCount: 0,
      completionRate: 0,
    },
  };
}

/**
 * Create flow transition record
 */
function createTransition(
  from: CameraFlowStep,
  to: CameraFlowStep,
  reason: FlowTransition['reason'] = 'user_action'
): FlowTransition {
  return {
    from,
    to,
    reason,
    timestamp: Date.now(),
  };
}

/**
 * Update flow metrics
 */
function updateFlowMetrics(flow: CameraFlow, newStep: CameraFlowStep): FlowMetrics {
  const now = Date.now();
  const stepDuration = now - flow.timestamp;

  return {
    ...flow.metrics,
    stepDurations: {
      ...flow.metrics.stepDurations,
      [flow.currentStep]: stepDuration,
    },
    totalDuration: now - flow.timestamp,
  };
}

/**
 * Validate step transition
 */
function canTransitionToStep(
  currentStep: CameraFlowStep,
  targetStep: CameraFlowStep,
  flow: CameraFlow
): boolean {
  const stepOrder: CameraFlowStep[] = ['capture', 'processing', 'review', 'verification', 'report'];
  const currentIndex = stepOrder.indexOf(currentStep);
  const targetIndex = stepOrder.indexOf(targetStep);

  // Can always go backwards
  if (targetIndex < currentIndex) return true;

  // Can go forward if we have required data
  switch (targetStep) {
    case 'processing':
      return !!flow.imageUri;
    case 'review':
      return !!flow.imageUri && !!flow.ocrResult;
    case 'verification':
      return !!flow.imageUri && !!flow.ocrResult;
    case 'report':
      return !!flow.imageUri && !!flow.receiptDraft;
    default:
      return true;
  }
}

/**
 * Camera Flow Reducer
 */
function cameraFlowReducer(state: CameraFlowState, action: CameraFlowAction): CameraFlowState {
  switch (action.type) {
    case 'CREATE_FLOW':
      const newFlow = createNewFlow(action.imageUri, action.flowId);
      const newFlows = { ...state.flows, [newFlow.id]: newFlow };
      const newHistory = [newFlow.id, ...state.flowHistory].slice(0, 10); // Keep last 10

      return {
        ...state,
        activeFlow: newFlow,
        hasActiveFlow: true,
        flows: newFlows,
        flowHistory: newHistory,
        canNavigateBack: false,
        canNavigateForward: false,
        navigationBlocked: false,
        sessionMetrics: {
          ...state.sessionMetrics,
          totalFlows: state.sessionMetrics.totalFlows + 1,
        },
      };

    case 'SET_ACTIVE_FLOW':
      const targetFlow = state.flows[action.flowId];
      if (!targetFlow) return state;

      return {
        ...state,
        activeFlow: targetFlow,
        hasActiveFlow: true,
        canNavigateBack: targetFlow.stepHistory.length > 1,
        canNavigateForward: false,
      };

    case 'UPDATE_CURRENT_STEP':
      if (!state.activeFlow) return state;

      const canTransition = canTransitionToStep(
        state.activeFlow.currentStep,
        action.step,
        state.activeFlow
      );
      if (!canTransition) return state;

      const transition = createTransition(
        state.activeFlow.currentStep,
        action.step,
        action.reason === 'auto' ? 'auto_advance' : 'user_action'
      );

      const updatedMetrics = updateFlowMetrics(state.activeFlow, action.step);

      const updatedFlow: CameraFlow = {
        ...state.activeFlow,
        currentStep: action.step,
        stepHistory: [...state.activeFlow.stepHistory, action.step],
        transitions: [...state.activeFlow.transitions, transition],
        metrics: updatedMetrics,
        timestamp: Date.now(),
      };

      return {
        ...state,
        activeFlow: updatedFlow,
        flows: { ...state.flows, [updatedFlow.id]: updatedFlow },
        canNavigateBack: updatedFlow.stepHistory.length > 1,
        canNavigateForward: false,
      };

    case 'UPDATE_FLOW_DATA':
      if (!state.activeFlow) return state;

      const dataUpdatedFlow: CameraFlow = {
        ...state.activeFlow,
        ...action.data,
        timestamp: Date.now(),
      };

      return {
        ...state,
        activeFlow: dataUpdatedFlow,
        flows: { ...state.flows, [dataUpdatedFlow.id]: dataUpdatedFlow },
      };

    case 'ADD_ERROR':
      if (!state.activeFlow) return state;

      const errorUpdatedFlow: CameraFlow = {
        ...state.activeFlow,
        lastError: action.error,
        errorHistory: [...state.activeFlow.errorHistory, action.error],
        metrics: {
          ...state.activeFlow.metrics,
          errorCount: state.activeFlow.metrics.errorCount + 1,
        },
      };

      return {
        ...state,
        activeFlow: errorUpdatedFlow,
        flows: { ...state.flows, [errorUpdatedFlow.id]: errorUpdatedFlow },
      };

    case 'CLEAR_ERROR':
      if (!state.activeFlow) return state;

      const errorClearedFlow: CameraFlow = {
        ...state.activeFlow,
        lastError: undefined,
      };

      return {
        ...state,
        activeFlow: errorClearedFlow,
        flows: { ...state.flows, [errorClearedFlow.id]: errorClearedFlow },
      };

    case 'COMPLETE_FLOW':
      if (!state.activeFlow) return state;

      const completedFlow: CameraFlow = {
        ...state.activeFlow,
        isComplete: true,
        metrics: {
          ...state.activeFlow.metrics,
          totalDuration: Date.now() - state.activeFlow.timestamp,
          completionRate: 100,
        },
      };

      return {
        ...state,
        activeFlow: completedFlow,
        flows: { ...state.flows, [completedFlow.id]: completedFlow },
        sessionMetrics: {
          ...state.sessionMetrics,
          completedFlows: state.sessionMetrics.completedFlows + 1,
        },
      };

    case 'CANCEL_FLOW':
      if (!state.activeFlow) return state;

      const cancelledFlow: CameraFlow = {
        ...state.activeFlow,
        metrics: {
          ...state.activeFlow.metrics,
          abandonmentStep: state.activeFlow.currentStep,
        },
      };

      return {
        ...state,
        activeFlow: undefined,
        hasActiveFlow: false,
        flows: { ...state.flows, [cancelledFlow.id]: cancelledFlow },
        canNavigateBack: false,
        canNavigateForward: false,
        sessionMetrics: {
          ...state.sessionMetrics,
          abandonedFlows: state.sessionMetrics.abandonedFlows + 1,
        },
      };

    case 'BLOCK_NAVIGATION':
      return {
        ...state,
        navigationBlocked: true,
        blockReason: action.reason,
      };

    case 'UNBLOCK_NAVIGATION':
      return {
        ...state,
        navigationBlocked: false,
        blockReason: undefined,
      };

    case 'PERSIST_FLOW':
      const persistedFlows = [...state.persistedFlows, action.flowId];
      return {
        ...state,
        persistedFlows,
      };

    case 'RESTORE_FLOWS':
      const restoredFlows: Record<string, CameraFlow> = {};
      action.flows.forEach(flow => {
        restoredFlows[flow.id] = flow;
      });

      return {
        ...state,
        flows: { ...state.flows, ...restoredFlows },
      };

    case 'CLEANUP_FLOWS':
      // Remove completed flows older than 24 hours
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const cleanedFlows: Record<string, CameraFlow> = {};

      Object.values(state.flows).forEach(flow => {
        if (!flow.isComplete || flow.timestamp > cutoff) {
          cleanedFlows[flow.id] = flow;
        }
      });

      return {
        ...state,
        flows: cleanedFlows,
        flowHistory: state.flowHistory.filter(id => cleanedFlows[id]),
      };

    case 'RESET_SESSION':
      return initialState;

    default:
      if (process.env.NODE_ENV === 'development') {
        console.warn('Unknown CameraFlowAction:', action);
      }
      return state;
  }
}

/**
 * Context Value Interface
 */
export interface CameraFlowContextValue {
  readonly state: CameraFlowState;
  readonly dispatch: React.Dispatch<CameraFlowAction>;

  // Flow management
  readonly createFlow: (imageUri: string, flowId?: string) => string;
  readonly setActiveFlow: (flowId: string) => void;
  readonly updateCurrentStep: (step: CameraFlowStep, reason?: string) => void;
  readonly updateFlowData: (data: Partial<Pick<CameraFlow, 'ocrResult' | 'receiptDraft'>>) => void;
  readonly completeFlow: () => void;
  readonly cancelFlow: (reason?: string) => void;

  // Navigation
  readonly navigateToStep: (step: CameraFlowStep) => boolean;
  readonly navigateBack: () => boolean;
  readonly blockNavigation: (reason: string) => void;
  readonly unblockNavigation: () => void;

  // Error handling
  readonly addError: (error: FlowError) => void;
  readonly clearError: () => void;

  // Persistence
  readonly persistFlow: (flowId: string) => void;
  readonly restoreFlows: (flows: CameraFlow[]) => void;
  readonly cleanupFlows: () => void;
  readonly resetSession: () => void;
}

/**
 * Camera Flow Context
 */
const CameraFlowContext = createContext<CameraFlowContextValue | null>(null);

/**
 * Camera Flow Provider Props
 */
export interface CameraFlowProviderProps {
  children: React.ReactNode;
}

/**
 * Camera Flow Provider Component
 */
export const CameraFlowProvider: React.FC<CameraFlowProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cameraFlowReducer, initialState);

  // Flow management methods
  const createFlow = useCallback((imageUri: string, flowId?: string): string => {
    const id = flowId || generateFlowId();
    dispatch({ type: 'CREATE_FLOW', imageUri, flowId: id });
    return id;
  }, []);

  const setActiveFlow = useCallback((flowId: string) => {
    dispatch({ type: 'SET_ACTIVE_FLOW', flowId });
  }, []);

  const updateCurrentStep = useCallback((step: CameraFlowStep, reason?: string) => {
    dispatch({ type: 'UPDATE_CURRENT_STEP', step, reason });
  }, []);

  const updateFlowData = useCallback(
    (data: Partial<Pick<CameraFlow, 'ocrResult' | 'receiptDraft'>>) => {
      dispatch({ type: 'UPDATE_FLOW_DATA', data });
    },
    []
  );

  const completeFlow = useCallback(() => {
    dispatch({ type: 'COMPLETE_FLOW' });
  }, []);

  const cancelFlow = useCallback((reason?: string) => {
    dispatch({ type: 'CANCEL_FLOW', reason });
  }, []);

  // Navigation methods
  const navigateToStep = useCallback(
    (step: CameraFlowStep): boolean => {
      if (!state.activeFlow || state.navigationBlocked) return false;

      const canTransition = canTransitionToStep(
        state.activeFlow.currentStep,
        step,
        state.activeFlow
      );
      if (canTransition) {
        dispatch({ type: 'UPDATE_CURRENT_STEP', step });
      }
      return canTransition;
    },
    [state.activeFlow, state.navigationBlocked]
  );

  const navigateBack = useCallback((): boolean => {
    if (!state.activeFlow || !state.canNavigateBack || state.navigationBlocked) return false;

    const history = state.activeFlow.stepHistory;
    if (history.length > 1) {
      const previousStep = history[history.length - 2];
      dispatch({ type: 'UPDATE_CURRENT_STEP', step: previousStep, reason: 'back' });
      return true;
    }
    return false;
  }, [state.activeFlow, state.canNavigateBack, state.navigationBlocked]);

  const blockNavigation = useCallback((reason: string) => {
    dispatch({ type: 'BLOCK_NAVIGATION', reason });
  }, []);

  const unblockNavigation = useCallback(() => {
    dispatch({ type: 'UNBLOCK_NAVIGATION' });
  }, []);

  // Error handling methods
  const addError = useCallback((error: FlowError) => {
    dispatch({ type: 'ADD_ERROR', error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Persistence methods
  const persistFlow = useCallback((flowId: string) => {
    dispatch({ type: 'PERSIST_FLOW', flowId });
  }, []);

  const restoreFlows = useCallback((flows: CameraFlow[]) => {
    dispatch({ type: 'RESTORE_FLOWS', flows });
  }, []);

  const cleanupFlows = useCallback(() => {
    dispatch({ type: 'CLEANUP_FLOWS' });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: 'RESET_SESSION' });
  }, []);

  // Development logging
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[CameraFlowContext] State updated:', {
        hasActiveFlow: state.hasActiveFlow,
        activeFlowId: state.activeFlow?.id,
        currentStep: state.activeFlow?.currentStep,
        canNavigateBack: state.canNavigateBack,
        navigationBlocked: state.navigationBlocked,
        totalFlows: Object.keys(state.flows).length,
        sessionMetrics: state.sessionMetrics,
        timestamp: new Date().toISOString(),
      });
    }
  }, [state]);

  const contextValue: CameraFlowContextValue = {
    state,
    dispatch,
    createFlow,
    setActiveFlow,
    updateCurrentStep,
    updateFlowData,
    completeFlow,
    cancelFlow,
    navigateToStep,
    navigateBack,
    blockNavigation,
    unblockNavigation,
    addError,
    clearError,
    persistFlow,
    restoreFlows,
    cleanupFlows,
    resetSession,
  };

  return <CameraFlowContext.Provider value={contextValue}>{children}</CameraFlowContext.Provider>;
};

/**
 * Custom hook to use Camera Flow Context
 */
export function useCameraFlow(): CameraFlowContextValue {
  const context = useContext(CameraFlowContext);

  if (!context) {
    throw new Error('useCameraFlow must be used within a CameraFlowProvider');
  }

  return context;
}

/**
 * Type guards for camera flow state checking
 */
export const CameraFlowStateGuards = {
  hasActiveFlow: (state: CameraFlowState): state is CameraFlowState & { activeFlow: CameraFlow } =>
    state.hasActiveFlow && !!state.activeFlow,
  canNavigateBack: (state: CameraFlowState): boolean =>
    state.canNavigateBack && !state.navigationBlocked,
  canNavigateForward: (state: CameraFlowState): boolean =>
    state.canNavigateForward && !state.navigationBlocked,
  isNavigationBlocked: (state: CameraFlowState): boolean => state.navigationBlocked,
  hasFlows: (state: CameraFlowState): boolean => Object.keys(state.flows).length > 0,
  isCurrentStep: (state: CameraFlowState, step: CameraFlowStep): boolean =>
    state.activeFlow?.currentStep === step,
  hasCompletedFlows: (state: CameraFlowState): boolean => state.sessionMetrics.completedFlows > 0,
};

export default CameraFlowProvider;
