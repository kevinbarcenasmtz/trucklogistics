// app/(app)/camera/imagedetails.tsx
import OldImageDetailsScreen from '@/src/screens/camera/ImageDetailsScreen';
import NewImageDetailsScreen from '@/src/screens/camera/ImageDetailsScreen.refactored';
// Simply export the component as the default export
const useNewOCR = process.env.EXPO_PUBLIC_USE_NEW_OCR === 'true';

export default useNewOCR ? NewImageDetailsScreen : OldImageDetailsScreen;
