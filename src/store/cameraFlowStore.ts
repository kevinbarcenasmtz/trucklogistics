// src/store/cameraFlowStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  CameraFlow, 
  CameraFlowStep, 
  FlowError,
  FlowTransition,
  FLOW_STEP_ORDER,
  FlowTypeGuards
} from '../types/cameraFlow';
import { ProcessedReceipt } from '../state/ocr/types';
import { Receipt } from '../types/ReceiptInterfaces';

interface CameraFlowState {
  // State
  activeFlow: CameraFlow | null;
  flows: Record<string, CameraFlow>;
  
  // Actions
  startFlow: (imageUri: string) => Promise<CameraFlow>;
  updateFlow: (updates: Partial<Pick<CameraFlow, 'currentStep' | 'imageUri' | 'ocrResult' | 'receiptDraft' | 'lastError'>>) => void;
  completeFlow: () => Promise<void>;
  cancelFlow: () => void;
  
  // Navigation helpers
  canNavigateToStep: (step: CameraFlowStep) => boolean;
  recordTransition: (to: CameraFlowStep, reason: FlowTransition['reason']) => void;
  
  // Error handling
  recordError: (error: FlowError) => void;
  clearError: () => void;
  
  // Queries
  getFlow: (flowId: string) => CameraFlow | null;
  hasActiveFlow: boolean;
  
  // Cleanup
  cleanupOldFlows: () => void;
}

const MAX_FLOW_AGE = 24 * 60 * 60 * 1000; // 24 hours
const MAX_FLOWS = 10;

export const useCameraFlow = create<CameraFlowState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeFlow: null,
      flows: {},
      hasActiveFlow: false,

      // Start a new flow
      startFlow: async (imageUri: string) => {
        const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        
        const newFlow: CameraFlow = {
          id: flowId,
          imageUri,
          currentStep: 'processing',
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
        set((state) => ({
          activeFlow: newFlow,
          flows: {
            ...state.flows,
            [flowId]: newFlow,
          },
          hasActiveFlow: true,
        }));
    
        // Cleanup old flows
        get().cleanupOldFlows();
    
        return newFlow;
      },
    
      // Update the active flow
      updateFlow: (updates) => {
        set((state) => {
          if (!state.activeFlow) return state;
    
          const updatedFlow: CameraFlow = {
            ...state.activeFlow,
            ...updates,
          };
    
          // Update step history if step changed
          if (updates.currentStep && updates.currentStep !== state.activeFlow.currentStep) {
            if (!updatedFlow.stepHistory.includes(updates.currentStep)) {
              updatedFlow.stepHistory = [...updatedFlow.stepHistory, updates.currentStep];
            }
    
            // Update step duration metrics
            const currentStepStartTime = state.activeFlow.transitions.find(
              t => t.to === state.activeFlow!.currentStep
            )?.timestamp || state.activeFlow.timestamp;
    
            updatedFlow.metrics = {
              ...updatedFlow.metrics,
              stepDurations: {
                ...updatedFlow.metrics.stepDurations,
                [state.activeFlow.currentStep]: Date.now() - currentStepStartTime,
              },
            };
          }
    
          return {
            activeFlow: updatedFlow,
            flows: {
              ...state.flows,
              [updatedFlow.id]: updatedFlow,
            },
          };
        });
      },
    
      // Complete the flow
      completeFlow: async () => {
        set((state) => {
          if (!state.activeFlow) return state;
    
          const completedFlow: CameraFlow = {
            ...state.activeFlow,
            isComplete: true,
            currentStep: 'report',
            metrics: {
              ...state.activeFlow.metrics,
              totalDuration: Date.now() - state.activeFlow.timestamp,
              completionRate: 1,
            },
          };
    
          return {
            activeFlow: null,
            flows: {
              ...state.flows,
              [completedFlow.id]: completedFlow,
            },
            hasActiveFlow: false,
          };
        });
      },
    
      // Cancel the flow
      cancelFlow: () => {
        set((state) => {
          if (!state.activeFlow) return state;
    
          const cancelledFlow: CameraFlow = {
            ...state.activeFlow,
            isComplete: false,
            metrics: {
              ...state.activeFlow.metrics,
              totalDuration: Date.now() - state.activeFlow.timestamp,
              abandonmentStep: state.activeFlow.currentStep,
            },
          };
    
          return {
            activeFlow: null,
            flows: {
              ...state.flows,
              [cancelledFlow.id]: cancelledFlow,
            },
            hasActiveFlow: false,
          };
        });
      },
    
      // Check if navigation to a step is allowed
      canNavigateToStep: (step: CameraFlowStep) => {
        const { activeFlow } = get();
        if (!activeFlow) return step === 'capture';
    
        switch (step) {
          case 'capture':
            return true;
          case 'processing':
            return FlowTypeGuards.hasImageUri(activeFlow);
          case 'review':
            return FlowTypeGuards.hasImageUri(activeFlow) && FlowTypeGuards.hasOCRResult(activeFlow);
          case 'verification':
            return FlowTypeGuards.hasImageUri(activeFlow) && FlowTypeGuards.hasOCRResult(activeFlow);
          case 'report':
            return FlowTypeGuards.hasImageUri(activeFlow) && FlowTypeGuards.hasReceiptDraft(activeFlow);
          default:
            return false;
        }
      },
    
      // Record a transition
      recordTransition: (to: CameraFlowStep, reason: FlowTransition['reason']) => {
        set((state) => {
          if (!state.activeFlow) return state;
    
          const transition: FlowTransition = {
            from: state.activeFlow.currentStep,
            to,
            reason,
            timestamp: Date.now(),
          };
    
          const updatedFlow: CameraFlow = {
            ...state.activeFlow,
            transitions: [...state.activeFlow.transitions, transition],
          };
    
          return {
            activeFlow: updatedFlow,
            flows: {
              ...state.flows,
              [updatedFlow.id]: updatedFlow,
            },
          };
        });
      },
    
      // Record an error
      recordError: (error: FlowError) => {
        set((state) => {
          if (!state.activeFlow) return state;
    
          const updatedFlow: CameraFlow = {
            ...state.activeFlow,
            lastError: error,
            errorHistory: [...state.activeFlow.errorHistory, error],
            metrics: {
              ...state.activeFlow.metrics,
              errorCount: state.activeFlow.metrics.errorCount + 1,
            },
          };
    
          return {
            activeFlow: updatedFlow,
            flows: {
              ...state.flows,
              [updatedFlow.id]: updatedFlow,
            },
          };
        });
      },
    
      // Clear current error
      clearError: () => {
        set((state) => {
          if (!state.activeFlow) return state;
    
          const updatedFlow: CameraFlow = {
            ...state.activeFlow,
            lastError: undefined,
          };
    
          return {
            activeFlow: updatedFlow,
            flows: {
              ...state.flows,
              [updatedFlow.id]: updatedFlow,
            },
          };
        });
      },
    
      // Get a specific flow
      getFlow: (flowId: string) => {
        return get().flows[flowId] || null;
      },
    
      // Cleanup old flows
      cleanupOldFlows: () => {
        set((state) => {
          const now = Date.now();
          const flowIds = Object.keys(state.flows);
          
          // Remove flows older than MAX_FLOW_AGE
          const validFlows = flowIds.filter(id => {
            const flow = state.flows[id];
            return (now - flow.timestamp) < MAX_FLOW_AGE;
          });
    
          // Keep only the most recent MAX_FLOWS
          const flowsToKeep = validFlows
            .sort((a, b) => state.flows[b].timestamp - state.flows[a].timestamp)
            .slice(0, MAX_FLOWS);
    
          const newFlows: Record<string, CameraFlow> = {};
          flowsToKeep.forEach(id => {
            newFlows[id] = state.flows[id];
          });
    
          return { flows: newFlows };
        });
      },
    }),
    {
      name: 'camera-flow-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        flows: state.flows,
        activeFlow: state.activeFlow,
        hasActiveFlow: state.hasActiveFlow,
      }),
    }
    )
    );