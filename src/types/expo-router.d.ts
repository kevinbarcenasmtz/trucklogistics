// src/types/expo-router.d.ts

import { CameraStackParamList } from './camera_navigation';

declare module 'expo-router' {
  interface RouteParams {
    // Camera stack routes
    "camera/index": CameraStackParamList['index'];
    "camera/imagedetails": CameraStackParamList['imagedetails'];
    "camera/verification": CameraStackParamList['verification'];
    "camera/report": CameraStackParamList['report'];
    
    // Other routes can be added here
  }
}