// src/types/camera_navigation.ts
export type VerificationItem = {
  id: string;
  title: string;
  verified: boolean;
};

export type VerificationData = {
  verificationResults: VerificationItem[];
  imageData: any;
};

export type CameraStackParamList = {
  index: undefined;
  imagedetails: { uri: string };
  verification: { receipt: string; uri: string }; // Updated to match actual usage
  report: { receipt: string }; // Updated to match actual usage
};