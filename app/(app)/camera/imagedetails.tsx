//app/(app)/camera/imagedetails.tsx
import CameraWorkflowCoordinator from '@/src/components/camera/workflow/CameraWorkflowCoordinator';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ImageDetailsScreen() {
  const params = useLocalSearchParams();
  const flowId = params.flowId as string;

  if (!flowId) {
    // Redirect to camera if no flow
    return <Redirect href="/camera" />;
  }

  return <CameraWorkflowCoordinator flowId={flowId} />;
}
