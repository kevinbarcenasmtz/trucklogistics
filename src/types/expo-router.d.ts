// src/types/expo-router.d.ts - Phase 3 Clean Route Types

import { CameraStackParamList } from './camera_navigation';

declare module 'expo-router' {
  interface RouteParams {
    // Camera stack routes - Flow-based only, no JSON serialization
    "camera/index": CameraStackParamList['index'];
    "camera/imagedetails": CameraStackParamList['imagedetails'];
    "camera/verification": CameraStackParamList['verification'];
    "camera/report": CameraStackParamList['report'];
    
    // Other app routes can be added here
    // Example: "home": undefined;
    // Example: "settings": { section?: string };
  }
}

// REMOVED LEGACY ROUTE DECLARATIONS:
// ❌ Complex route params with JSON serialization
// ❌ OCR-specific route parameters
// ❌ Legacy camera stack declarations
// ❌ Unused route param interfaces