//app/(app)/camera/index.tsx
import CameraWorkflowCoordinator from '@/src/components/camera/workflow/CameraWorkflowCoordinator';
import { useLocalSearchParams } from 'expo-router';

export default function CameraScreen() {
  const params = useLocalSearchParams();
  return <CameraWorkflowCoordinator flowId={params.flowId as string} />;
}