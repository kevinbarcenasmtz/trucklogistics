// src/types/camera_navigation.ts
import { CameraFlow, CameraFlowStep } from './cameraFlow';

/**
 * Camera Stack Parameter List - Flow-based only
 */
export type CameraStackParamList = {
  index: {
    flowId?: string; // Optional - for resuming existing flow
  };
  imagedetails: {
    flowId: string; // Required - must have active flow
  };
  verification: {
    flowId: string; // Required - must have active flow
  };
  report: {
    flowId: string; // Required - must have active flow
  };
};

/**
 * Route configuration for each camera step
 */
export interface CameraRouteConfig {
  step: CameraFlowStep;
  routeName: keyof CameraStackParamList;
  path: string;
  requiredFlowData: (keyof CameraFlow)[];
  allowedFromSteps: CameraFlowStep[];
}

/**
 * Camera route configurations
 */
export const CAMERA_ROUTE_CONFIGS: Record<CameraFlowStep, CameraRouteConfig> = {
  capture: {
    step: 'capture',
    routeName: 'index',
    path: '/camera',
    requiredFlowData: [],
    allowedFromSteps: [], // Can be accessed from anywhere
  },
  processing: {
    step: 'processing',
    routeName: 'imagedetails',
    path: '/camera/imagedetails',
    requiredFlowData: ['imageUri'],
    allowedFromSteps: ['capture'],
  },
  review: {
    step: 'review',
    routeName: 'imagedetails',
    path: '/camera/imagedetails',
    requiredFlowData: ['imageUri', 'ocrResult'],
    allowedFromSteps: ['processing', 'verification'],
  },
  verification: {
    step: 'verification',
    routeName: 'verification',
    path: '/camera/verification',
    requiredFlowData: ['imageUri', 'ocrResult'],
    allowedFromSteps: ['review', 'report'],
  },
  report: {
    step: 'report',
    routeName: 'report',
    path: '/camera/report',
    requiredFlowData: ['imageUri', 'receiptDraft'],
    allowedFromSteps: ['verification'],
  },
};

/**
 * Type guards for route validation
 */
export const RouteTypeGuards = {
  hasFlowId: (params: any): params is { flowId: string } => {
    return typeof params?.flowId === 'string' && params.flowId.length > 0;
  },

  isValidFlowRoute: (
    routeName: keyof CameraStackParamList,
    params: any
  ): boolean => {
    // Index route doesn't require flowId
    if (routeName === 'index') return true;
    
    // All other routes require flowId
    return RouteTypeGuards.hasFlowId(params);
  },
};

/**
 * Navigation utilities
 */
export const NavigationUtils = {
  /**
   * Get the route configuration for a step
   */
  getRouteForStep: (step: CameraFlowStep): CameraRouteConfig => {
    return CAMERA_ROUTE_CONFIGS[step];
  },

  /**
   * Build route params for navigation
   */
  buildRouteParams: (flowId: string): { flowId: string } => {
    return { flowId };
  },

  /**
   * Get the route path for a step with flow ID
   */
  getRoutePathWithFlow: (step: CameraFlowStep, flowId: string): string => {
    const config = CAMERA_ROUTE_CONFIGS[step];
    return `${config.path}?flowId=${flowId}`;
  },

  /**
   * Determine if a route transition is valid
   */
  canTransitionTo: (
    from: CameraFlowStep,
    to: CameraFlowStep
  ): boolean => {
    const toConfig = CAMERA_ROUTE_CONFIGS[to];
    
    // Capture can be accessed from anywhere
    if (to === 'capture') return true;
    
    // Check if the transition is allowed
    return toConfig.allowedFromSteps.includes(from);
  },
};

/**
 * Navigation state for tracking current position
 */
export interface NavigationState {
  currentRoute: keyof CameraStackParamList;
  currentStep: CameraFlowStep;
  flowId?: string;
  canGoBack: boolean;
  isTransitioning: boolean;
}