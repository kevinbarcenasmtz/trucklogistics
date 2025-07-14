// src/stores/cameraFlowStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { generateCorrelationId } from '../utils/correlation';
import { ProcessedReceipt } from '../state/ocr/types';
import { Receipt } from '../types/ReceiptInterfaces';
import { 
  CameraFlow, 
  CameraFlowStep, 
  FlowTransition, 
  FlowError, 
  FlowMetrics 
} from '../types/cameraFlow';

interface CameraFlowState {
  // Current active flow (only one at a time)
  activeFlow: CameraFlow | null;
  
  // Flow history for debugging/analytics
  flowHistory: Pick<CameraFlow, 'id' | 'timestamp' | 'isComplete'>[];
  
  // Actions
  startFlow: (imageUri: string) => CameraFlow;
  updateFlow: (updates: Partial<Pick<CameraFlow, 'currentStep' | 'ocrResult' | 'receiptDraft' | 'lastError'>>) => void;
  addTransition: (from: CameraFlowStep, to: CameraFlowStep, reason: FlowTransition['reason']) => void;
  addError: (error: FlowError) => void;
  completeFlow: () => void;
  cancelFlow: () => void;
  canNavigateToStep: (step: CameraFlowStep) => boolean;
  getFlowById: (id: string) => CameraFlow | null;
}

export const useCameraFlowStore = create<CameraFlowState>()(
  subscribeWithSelector((set, get) => ({
    activeFlow: null,
    flowHistory: [],

    startFlow: (imageUri: string) => {
      const now = Date.now();
      const flow: CameraFlow = {
        id: generateCorrelationId(),
        imageUri,
        currentStep: 'capture',
        timestamp: now,
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

      set({ activeFlow: flow });
      return flow;
    },

    updateFlow: (updates) => {
      const { activeFlow } = get();
      if (!activeFlow) {
        console.warn('Cannot update flow: no active flow');
        return;
      }

      const now = Date.now();
      let newTransitions = activeFlow.transitions;
      let newStepHistory = activeFlow.stepHistory;

      // Handle step change
      if (updates.currentStep && updates.currentStep !== activeFlow.currentStep) {
        const transition: FlowTransition = {
          from: activeFlow.currentStep,
          to: updates.currentStep,
          reason: 'user_action',
          timestamp: now,
        };
        newTransitions = [...activeFlow.transitions, transition];
        newStepHistory = [...activeFlow.stepHistory, updates.currentStep];
      }

      const updatedFlow: CameraFlow = {
        ...activeFlow,
        ...updates,
        stepHistory: newStepHistory,
        transitions: newTransitions,
        metrics: {
          ...activeFlow.metrics,
          totalDuration: now - activeFlow.timestamp,
        },
      };

      set({ activeFlow: updatedFlow });
    },

    addTransition: (from, to, reason) => {
      const { activeFlow } = get();
      if (!activeFlow) return;

      const transition: FlowTransition = {
        from,
        to,
        reason,
        timestamp: Date.now(),
      };

      const updatedFlow: CameraFlow = {
        ...activeFlow,
        transitions: [...activeFlow.transitions, transition],
      };

      set({ activeFlow: updatedFlow });
    },

    addError: (error) => {
      const { activeFlow } = get();
      if (!activeFlow) return;

      const updatedFlow: CameraFlow = {
        ...activeFlow,
        lastError: error,
        errorHistory: [...activeFlow.errorHistory, error],
        metrics: {
          ...activeFlow.metrics,
          errorCount: activeFlow.metrics.errorCount + 1,
        },
      };

      set({ activeFlow: updatedFlow });
    },

    completeFlow: () => {
      const { activeFlow, flowHistory } = get();
      if (!activeFlow) return;

      const completedFlow = {
        id: activeFlow.id,
        timestamp: activeFlow.timestamp,
        isComplete: true,
      };

      set({
        activeFlow: null,
        flowHistory: [completedFlow, ...flowHistory.slice(0, 9)], // Keep last 10 flows
      });
    },

    cancelFlow: () => {
      const { activeFlow, flowHistory } = get();
      if (!activeFlow) return;

      const cancelledFlow = {
        id: activeFlow.id,
        timestamp: activeFlow.timestamp,
        isComplete: false,
      };

      set({
        activeFlow: null,
        flowHistory: [cancelledFlow, ...flowHistory.slice(0, 9)],
      });
    },

    canNavigateToStep: (step: CameraFlowStep) => {
      const { activeFlow } = get();
      if (!activeFlow) return false;

      // Define valid navigation rules
      const stepOrder: CameraFlowStep[] = ['capture', 'processing', 'review', 'verification', 'report'];
      const currentIndex = stepOrder.indexOf(activeFlow.currentStep);
      const targetIndex = stepOrder.indexOf(step);

      // Can navigate backwards in history
      if (activeFlow.stepHistory.includes(step)) return true;
      
      // Can navigate forward if we have required data
      if (targetIndex > currentIndex) {
        switch (step) {
          case 'processing':
            return !!activeFlow.imageUri;
          case 'review':
            return !!activeFlow.ocrResult;
          case 'verification':
            return !!activeFlow.ocrResult;
          case 'report':
            return !!activeFlow.receiptDraft;
          default:
            return false;
        }
      }

      // Can navigate to current step
      return step === activeFlow.currentStep;
    },

    getFlowById: (id: string) => {
      const { activeFlow } = get();
      return activeFlow?.id === id ? activeFlow : null;
    },
  }))
);

// Convenient hook for accessing flow state
export const useCameraFlow = () => {
  const store = useCameraFlowStore();
  
  return {
    activeFlow: store.activeFlow,
    startFlow: store.startFlow,
    updateFlow: store.updateFlow,
    addTransition: store.addTransition,
    addError: store.addError,
    completeFlow: store.completeFlow,
    cancelFlow: store.cancelFlow,
    canNavigateToStep: store.canNavigateToStep,
    getFlowById: store.getFlowById,
    
    // Computed properties
    hasActiveFlow: !!store.activeFlow,
    currentStep: store.activeFlow?.currentStep || null,
    canGoBack: store.activeFlow ? store.activeFlow.stepHistory.length > 1 : false,
  };
};