// src/store/cameraFlowStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  CameraFlow,
  CameraFlowStep,
  FlowError,
  FlowTransition,
  FlowTypeGuards,
} from '../types/cameraFlow';

interface CameraFlowState {
  // State
  activeFlow: CameraFlow | null;
  flows: Record<string, CameraFlow>;

  // Actions
  startFlow: (imageUri: string) => Promise<CameraFlow>;
  updateFlow: (
    updates: Partial<
      Pick<CameraFlow, 'currentStep' | 'imageUri' | 'ocrResult' | 'receiptDraft' | 'lastError'>
    >
  ) => void;
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

  resetActiveFlow: () => void;
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
        console.log('🚀 STORE: Starting new flow with imageUri:', !!imageUri);

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

        console.log('💾 STORE: Setting new flow:', {
          id: flowId,
          currentStep: newFlow.currentStep,
          hasImageUri: !!newFlow.imageUri,
        });

        set(state => {
          console.log('📝 STORE: Previous state:', {
            activeFlowId: state.activeFlow?.id,
            hasActiveFlow: state.hasActiveFlow,
            totalFlows: Object.keys(state.flows).length,
          });

          const newState = {
            activeFlow: newFlow,
            flows: {
              ...state.flows,
              [flowId]: newFlow,
            },
            hasActiveFlow: true,
          };

          console.log('📝 STORE: New state set:', {
            activeFlowId: newState.activeFlow?.id,
            hasActiveFlow: newState.hasActiveFlow,
            totalFlows: Object.keys(newState.flows).length,
          });

          return newState;
        });

        // Cleanup old flows
        get().cleanupOldFlows();

        return newFlow;
      },

      // Update the active flow
      updateFlow: updates => {
        set(state => {
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
            const currentStepStartTime =
              state.activeFlow.transitions.find(t => t.to === state.activeFlow!.currentStep)
                ?.timestamp || state.activeFlow.timestamp;

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
        set(state => {
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
        console.log('❌ STORE: Cancelling flow');

        set(state => {
          if (!state.activeFlow) {
            console.log('⚠️  STORE: No active flow to cancel');
            return state;
          }

          console.log('❌ STORE: Cancelling flow:', state.activeFlow.id);

          const cancelledFlow: CameraFlow = {
            ...state.activeFlow,
            isComplete: false,
            metrics: {
              ...state.activeFlow.metrics,
              totalDuration: Date.now() - state.activeFlow.timestamp,
              abandonmentStep: state.activeFlow.currentStep,
            },
          };

          const newState = {
            activeFlow: null,
            flows: {
              ...state.flows,
              [cancelledFlow.id]: cancelledFlow,
            },
            hasActiveFlow: false,
          };

          console.log('✅ STORE: Flow cancelled, new state:', {
            activeFlow: null,
            hasActiveFlow: false,
            totalFlows: Object.keys(newState.flows).length,
          });

          return newState;
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
            return (
              FlowTypeGuards.hasImageUri(activeFlow) && FlowTypeGuards.hasOCRResult(activeFlow)
            );
          case 'verification':
            return (
              FlowTypeGuards.hasImageUri(activeFlow) && FlowTypeGuards.hasOCRResult(activeFlow)
            );
          case 'report':
            return (
              FlowTypeGuards.hasImageUri(activeFlow) && FlowTypeGuards.hasReceiptDraft(activeFlow)
            );
          default:
            return false;
        }
      },

      // Record a transition
      recordTransition: (to: CameraFlowStep, reason: FlowTransition['reason']) => {
        set(state => {
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
        set(state => {
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
        set(state => {
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

      resetActiveFlow: () => {
        set(state => ({
          ...state,
          activeFlow: null,
          hasActiveFlow: false,
        }));
      },

      // Cleanup old flows
      cleanupOldFlows: () => {
        console.log('🧹 STORE: Starting cleanup');

        set(state => {
          const now = Date.now();
          const flowIds = Object.keys(state.flows);

          console.log('🧹 STORE: Current flows before cleanup:', flowIds.length);

          // Remove flows older than MAX_FLOW_AGE or incomplete flows older than 1 hour
          const validFlows = flowIds.filter(id => {
            const flow = state.flows[id];
            if (!flow) return false; // Add null check

            const age = now - flow.timestamp;

            // Keep completed flows for 24 hours
            if (flow.isComplete) {
              return age < MAX_FLOW_AGE;
            }

            // Keep incomplete flows for only 1 hour
            return age < 60 * 60 * 1000;
          });

          console.log('🧹 STORE: Valid flows after cleanup:', validFlows.length);

          // Keep only the most recent MAX_FLOWS
          const flowsToKeep = validFlows
            .sort((a, b) => {
              const flowA = state.flows[a];
              const flowB = state.flows[b];
              if (!flowA || !flowB) return 0; // Add null checks
              return flowB.timestamp - flowA.timestamp;
            })
            .slice(0, MAX_FLOWS);

          const newFlows: Record<string, CameraFlow> = {};
          flowsToKeep.forEach(id => {
            const flow = state.flows[id];
            if (flow) {
              // Add null check
              newFlows[id] = flow;
            }
          });

          // Check if active flow was cleaned up
          const activeFlowStillValid =
            state.activeFlow && flowsToKeep.includes(state.activeFlow.id);

          console.log('🧹 STORE: Cleanup result:', {
            flowsKept: flowsToKeep.length,
            activeFlowStillValid,
            newHasActiveFlow: activeFlowStillValid ? state.hasActiveFlow : false,
          });

          return {
            ...state, // Keep other properties
            flows: newFlows,
            activeFlow: activeFlowStillValid ? state.activeFlow : null,
            hasActiveFlow: activeFlowStillValid ? state.hasActiveFlow : false,
          };
        });
      },
    }),

    {
      name: 'camera-flow-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        flows: state.flows,
        activeFlow: state.activeFlow,
        hasActiveFlow: state.hasActiveFlow,
      }),
      // Add onRehydrateStorage for debugging
      onRehydrateStorage: () => state => {
        console.log('💧 STORE: Rehydrated from storage:', {
          activeFlowId: state?.activeFlow?.id,
          hasActiveFlow: state?.hasActiveFlow,
          totalFlows: state?.flows ? Object.keys(state.flows).length : 0,
        });
      },
    }
  )
);
