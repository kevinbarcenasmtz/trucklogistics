// src/types/camera_navigation.ts
import { CameraFlow, CameraFlowStep } from './cameraFlow';
import { ProcessedReceipt } from '../state/ocr/types';
import { Receipt } from './ReceiptInterfaces';

/**
 * Legacy types - keeping for backwards compatibility during migration
 */
export type VerificationItem = {
  id: string;
  title: string;
  verified: boolean;
};

export type VerificationData = {
  verificationResults: VerificationItem[];
  imageData: any;
};

/**
 * Enhanced Camera Stack Parameter List
 * Now uses flow IDs instead of serialized data
 */
export type CameraStackParamList = {
  index: {
    // Optional flow ID for resuming an existing flow
    flowId?: string;
  };
  imagedetails: {
    // Flow ID to identify which flow we're processing
    flowId: string;
    // Optional direct URI for backwards compatibility
    uri?: string;
  };
  verification: {
    // Flow ID containing all the data
    flowId: string;
    // Legacy params - will be removed after migration
    receipt?: string;
    uri?: string;
  };
  report: {
    // Flow ID containing the completed receipt
    flowId: string;
    // Legacy param - will be removed after migration
    receipt?: string;
  };
};

/**
 * Route parameter validation helpers
 */
export interface RouteParamValidators {
  validateFlowId: (flowId: string | undefined) => boolean;
  validateImageUri: (uri: string | undefined) => boolean;
  validateReceiptData: (receipt: string | undefined) => boolean;
  extractFlowFromLegacyParams: (params: any) => CameraFlow | null;
}

/**
 * Navigation state for complex routing scenarios
 */
export interface NavigationState {
  currentRoute: keyof CameraStackParamList;
  previousRoute?: keyof CameraStackParamList;
  flowId?: string;
  canGoBack: boolean;
  isTransitioning: boolean;
}

/**
 * Route configuration for each camera step
 */
export interface CameraRouteConfig {
  step: CameraFlowStep;
  routeName: keyof CameraStackParamList;
  path: string;
  requiredFlowData: (keyof CameraFlow)[];
  allowedFromSteps: CameraFlowStep[];
  autoRedirectOnInvalid?: keyof CameraStackParamList;
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
    allowedFromSteps: [],
  },
  processing: {
    step: 'processing',
    routeName: 'imagedetails',
    path: '/camera/imagedetails',
    requiredFlowData: ['imageUri'],
    allowedFromSteps: ['capture'],
    autoRedirectOnInvalid: 'index',
  },
  review: {
    step: 'review',
    routeName: 'imagedetails',
    path: '/camera/imagedetails',
    requiredFlowData: ['imageUri', 'ocrResult'],
    allowedFromSteps: ['processing', 'verification'],
    autoRedirectOnInvalid: 'index',
  },
  verification: {
    step: 'verification',
    routeName: 'verification',
    path: '/camera/verification',
    requiredFlowData: ['imageUri', 'ocrResult'],
    allowedFromSteps: ['review', 'report'],
    autoRedirectOnInvalid: 'imagedetails',
  },
  report: {
    step: 'report',
    routeName: 'report',
    path: '/camera/report',
    requiredFlowData: ['imageUri', 'receiptDraft'],
    allowedFromSteps: ['verification'],
    autoRedirectOnInvalid: 'verification',
  },
};

/**
 * Migration helpers for transitioning from old to new navigation
 */
export interface MigrationHelpers {
  // Convert legacy route params to flow data
  convertLegacyParams: (
    routeName: keyof CameraStackParamList,
    params: any
  ) => {
    flowId?: string;
    shouldCreateFlow: boolean;
    migrationData?: Partial<CameraFlow>;
  };

  // Generate flow from legacy receipt data
  createFlowFromLegacyReceipt: (receiptJson: string) => CameraFlow | null;

  // Extract image URI from various param formats
  extractImageUri: (params: any) => string | null;

  // Check if route uses legacy parameters
  isLegacyRoute: (params: any) => boolean;
}

/**
 * Type guards for route validation
 */
export const RouteTypeGuards = {
  hasFlowId: (params: any): params is { flowId: string } => {
    return typeof params?.flowId === 'string' && params.flowId.length > 0;
  },

  hasImageUri: (params: any): params is { uri: string } => {
    return typeof params?.uri === 'string' && params.uri.length > 0;
  },

  hasLegacyReceipt: (params: any): params is { receipt: string } => {
    return typeof params?.receipt === 'string' && params.receipt.length > 0;
  },

  isValidRoute: (
    routeName: keyof CameraStackParamList,
    params: any
  ): boolean => {
    const config = Object.values(CAMERA_ROUTE_CONFIGS).find(
      c => c.routeName === routeName
    );
    
    if (!config) return false;

    // If it has a flowId, it's valid (new format)
    if (RouteTypeGuards.hasFlowId(params)) return true;

    // Check legacy format compatibility
    switch (routeName) {
      case 'index':
        return true; // Always valid
      case 'imagedetails':
        return RouteTypeGuards.hasImageUri(params);
      case 'verification':
        return RouteTypeGuards.hasLegacyReceipt(params) && RouteTypeGuards.hasImageUri(params);
      case 'report':
        return RouteTypeGuards.hasLegacyReceipt(params);
      default:
        return false;
    }
  },
};

/**
 * Navigation utilities
 */
export interface NavigationUtils {
  // Get the correct route for a flow step
  getRouteForStep: (step: CameraFlowStep) => {
    routeName: keyof CameraStackParamList;
    path: string;
  };

  // Build route params for new navigation
  buildRouteParams: (flowId: string, step: CameraFlowStep) => any;

  // Build legacy route params for backwards compatibility
  buildLegacyParams: (flow: CameraFlow, step: CameraFlowStep) => any;

  // Determine if a route transition is valid
  canTransitionTo: (
    from: CameraFlowStep,
    to: CameraFlowStep,
    flow: CameraFlow
  ) => boolean;
}

/**
 * Error types for navigation issues
 */
export interface NavigationError {
  code: 'INVALID_FLOW_ID' | 'MISSING_FLOW_DATA' | 'INVALID_TRANSITION' | 'ROUTE_NOT_FOUND';
  message: string;
  currentRoute?: keyof CameraStackParamList;
  targetRoute?: keyof CameraStackParamList;
  flowId?: string;
  suggestedAction?: {
    type: 'redirect' | 'create_flow' | 'go_back';
    target?: string;
  };
}

/**
 * Deep linking support
 */
export interface DeepLinkConfig {
  // URL patterns for each route
  patterns: Record<keyof CameraStackParamList, string>;
  
  // Parse deep link URLs into route params
  parseUrl: (url: string) => {
    routeName: keyof CameraStackParamList;
    params: any;
  } | null;

  // Generate deep link URLs
  generateUrl: (routeName: keyof CameraStackParamList, params: any) => string;
}

/**
 * Analytics tracking for navigation
 */
export interface NavigationAnalytics {
  // Track route transitions
  trackTransition: (
    from: keyof CameraStackParamList,
    to: keyof CameraStackParamList,
    flowId?: string,
    duration?: number
  ) => void;

  // Track navigation errors
  trackError: (error: NavigationError) => void;

  // Track flow completion
  trackFlowCompletion: (
    flowId: string,
    startStep: CameraFlowStep,
    endStep: CameraFlowStep,
    duration: number
  ) => void;

  // Track flow abandonment
  trackFlowAbandonment: (
    flowId: string,
    currentStep: CameraFlowStep,
    reason: 'user_exit' | 'error' | 'timeout'
  ) => void;
}