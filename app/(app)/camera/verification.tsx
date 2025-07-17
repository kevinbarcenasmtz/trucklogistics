//app/(app)/camera/verification.tsx
import CameraWorkflowCoordinator from '@/src/components/camera/workflow/CameraWorkflowCoordinator';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function VerificationScreen() {
  const params = useLocalSearchParams();
  const flowId = params.flowId as string;

  if (!flowId) {
    return <Redirect href="/camera" />;
  }

  return <CameraWorkflowCoordinator flowId={flowId} />;
}
