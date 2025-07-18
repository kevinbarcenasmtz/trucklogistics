// src/types/camera_navigation.ts - Phase 3 Flow-based Navigation Only

import { CameraFlowStep } from './cameraFlow';

/**
 * Camera Stack Parameter List - Flow-based navigation only
 * NO JSON serialization, clean flow IDs only
 */
export type CameraStackParamList = {
  /** Camera capture screen - entry point */
  index: {
    /** Optional flow ID for resuming existing flow */
    flowId?: string;
  };
  /** Image processing and review screen */
  imagedetails: {
    /** Required active flow ID */
    flowId: string;
  };
  /** Receipt verification and editing screen */
  verification: {
    /** Required active flow ID */
    flowId: string;
  };
  /** Receipt completion and report screen */
  report: {
    /** Required active flow ID */
    flowId: string;
  };
};

/**
 * Navigation route configuration for each camera step
 */
export interface CameraRouteConfig {
  /** Associated workflow step */
  step: CameraFlowStep;
  /** Route name in navigation stack */
  routeName: keyof CameraStackParamList;
  /** URL path for deep linking */
  path: string;
  /** Required flow data for this route */
  requiredFlowData: string[];
  /** Steps that can navigate to this route */
  allowedFromSteps: CameraFlowStep[];
  /** Whether route requires active flow */
  requiresActiveFlow: boolean;
}

/**
 * Camera route configurations mapping
 */
export const CAMERA_ROUTE_CONFIGS: Record<CameraFlowStep, CameraRouteConfig> = {
  capture: {
    step: 'capture',
    routeName: 'index',
    path: '/camera',
    requiredFlowData: [],
    allowedFromSteps: [],
    requiresActiveFlow: false,
  },
  processing: {
    step: 'processing',
    routeName: 'imagedetails',
    path: '/camera/imagedetails',
    requiredFlowData: ['imageUri'],
    allowedFromSteps: ['capture'],
    requiresActiveFlow: true,
  },
  review: {
    step: 'review',
    routeName: 'imagedetails', 
    path: '/camera/imagedetails',
    requiredFlowData: ['imageUri', 'ocrResult'],
    allowedFromSteps: ['processing', 'verification'],
    requiresActiveFlow: true,
  },
  verification: {
    step: 'verification',
    routeName: 'verification',
    path: '/camera/verification',
    requiredFlowData: ['imageUri', 'ocrResult'],
    allowedFromSteps: ['review', 'report'],
    requiresActiveFlow: true,
  },
  report: {
    step: 'report',
    routeName: 'report',
    path: '/camera/report',
    requiredFlowData: ['imageUri', 'receiptDraft'],
    allowedFromSteps: ['verification'],
    requiresActiveFlow: true,
  },
};

/**
 * Navigation guard result for route validation
 */
export interface NavigationGuardResult {
  /** Whether navigation is allowed */
  allowed: boolean;
  /** Reason if navigation blocked */
  reason?: string;
  /** Suggested action if navigation blocked */
  suggestedAction?: {
    type: 'redirect' | 'retry' | 'cancel' | 'create_flow';
    target?: CameraFlowStep;
    message?: string;
  };
}

/**
 * Type guards for route validation
 */
export const RouteTypeGuards = {
  /** Check if params contain valid flow ID */
  hasFlowId: (params: any): params is { flowId: string } => {
    return typeof params?.flowId === 'string' && params.flowId.length > 0;
  },

  /** Validate if route params are valid for given route */
  isValidFlowRoute: (routeName: keyof CameraStackParamList, params: any): boolean => {
    if (routeName === 'index') return true; // Index doesn't require flowId
    return RouteTypeGuards.hasFlowId(params);
  },

  /** Check if route requires active flow */
  requiresActiveFlow: (routeName: keyof CameraStackParamList): boolean => {
    const config = Object.values(CAMERA_ROUTE_CONFIGS).find(
      config => config.routeName === routeName
    );
    return config?.requiresActiveFlow ?? false;
  },
};

/**
 * Navigation utilities for flow-based routing
 */
export const NavigationUtils = {
  /** Get route config for given step */
  getRouteConfig: (step: CameraFlowStep): CameraRouteConfig => {
    return CAMERA_ROUTE_CONFIGS[step];
  },

  /** Get step from route name */
  getStepFromRoute: (routeName: keyof CameraStackParamList): CameraFlowStep | undefined => {
    return Object.values(CAMERA_ROUTE_CONFIGS).find(
      config => config.routeName === routeName
    )?.step;
  },

  /** Validate navigation transition */
  canNavigateToStep: (
    fromStep: CameraFlowStep, 
    toStep: CameraFlowStep
  ): NavigationGuardResult => {
    const toConfig = CAMERA_ROUTE_CONFIGS[toStep];
    
    if (toConfig.allowedFromSteps.length === 0) {
      return { allowed: true }; // No restrictions
    }
    
    if (toConfig.allowedFromSteps.includes(fromStep)) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      reason: `Cannot navigate from ${fromStep} to ${toStep}`,
      suggestedAction: {
        type: 'redirect',
        target: 'capture',
        message: 'Please restart the workflow',
      },
    };
  },
};

// REMOVED ALL LEGACY NAVIGATION TYPES:
// ❌ CameraScreenParams - used JSON serialization
// ❌ OCRNavigationParams - old OCR-specific navigation
// ❌ ProcessingRouteParams - replaced by flow-based navigation
// ❌ ReviewRouteParams - replaced by flow-based navigation  
// ❌ VerificationRouteParams - replaced by flow-based navigation
// ❌ ReportRouteParams - replaced by flow-based navigation
// ❌ RouteParamsList with JSON.stringify types
// ❌ NavigationScreenProps with complex serialization
// ❌ OCRCameraStack types