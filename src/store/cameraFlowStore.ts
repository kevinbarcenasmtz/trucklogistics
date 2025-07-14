// src/stores/cameraFlowStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { generateCorrelationId } from '../utils/correlation';
import { ProcessedReceipt } from '../state/ocr/types';
import { Receipt } from '../types/ReceiptInterfaces';

export type CameraFlowStep = 'capture' | 'processing' | 'review' | 'verification' | 'report';

export interface CameraFlow {
  readonly id: string;
  readonly imageUri: string;
  readonly currentStep: CameraFlowStep;
  readonly timestamp: number;
  
  // Optional data that accumulates through the flow
  readonly ocrResult?: ProcessedReceipt;
  readonly receiptDraft?: Partial<Receipt>;
  readonly isComplete: boolean;
  
  // Navigation history for back button behavior
  readonly stepHistory: CameraFlowStep[];
  
  // Error recovery
  readonly lastError?: {
    step: CameraFlowStep;
    message: string;
    timestamp: number;
  };
}

interface CameraFlowState {
  // Current active flow (only one at a time)
  activeFlow: CameraFlow | null;
  
  // Flow history for debugging/analytics
  flowHistory: Pick<CameraFlow, 'id' | 'timestamp' | 'isComplete'>[];
  
  // Actions
  startFlow: (imageUri: string) => CameraFlow;
  updateFlow: (updates: Partial<Pick<CameraFlow, 'currentStep' | 'ocrResult' | 'receiptDraft' | 'lastError'>>) => void;
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
      const flow: CameraFlow = {
        id: generateCorrelationId(),
        imageUri,
        currentStep: 'capture',
        timestamp: Date.now(),
        isComplete: false,
        stepHistory: ['capture'],
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

      const updatedFlow: CameraFlow = {
        ...activeFlow,
        ...updates,
        stepHistory: updates.currentStep && updates.currentStep !== activeFlow.currentStep
          ? [...activeFlow.stepHistory, updates.currentStep]
          : activeFlow.stepHistory,
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