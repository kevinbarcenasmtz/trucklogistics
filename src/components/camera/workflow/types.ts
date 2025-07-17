import { CameraFlowStep, CameraFlow } from '@/src/types/cameraFlow';

// Error interface for step-level error handling
export interface FlowError {
  code: string;
  message: string;
  step: CameraFlowStep;
  retry?: boolean;
}

// Props that every step component will receive
export interface StepProps {
  flowId: string;                                    // Active flow identifier
  onNext: (data?: Partial<CameraFlow>) => void;     // Advance to next step
  onBack: () => void;                                // Return to previous step
  onCancel: () => void;                              // Cancel entire flow
  onError: (error: FlowError) => void;               // Handle step errors
}

// Configuration for each step in the workflow
export interface WorkflowStep {
  id: CameraFlowStep;                               // Step identifier matching flow types
  component: React.ComponentType<StepProps>;        // Step component
  canSkip: boolean;                                 // Whether step can be skipped
  validation: (flow: CameraFlow) => boolean;       // Step entry validation
}